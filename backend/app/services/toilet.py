import json
import base64
from datetime import datetime, timezone
from uuid import UUID

import redis.asyncio as aioredis
from sqlalchemy import select, func, and_, or_, text, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_Y, ST_X, ST_SetSRID, ST_MakePoint, ST_Transform

from app.config import get_settings
from app.exceptions import NotFoundError, ForbiddenError, GoneError, BadRequestError
from app.models.toilet import Toilet, ToiletPhoto
from app.models.review import Review
from app.models.confirmation import Confirmation
from app.models.user import User
from app.models.enums import UserRole
from app.utils.geo import make_point
from app.utils.storage import get_url

settings = get_settings()


def _decode_cursor(cursor: str | None) -> dict | None:
    if not cursor:
        return None
    try:
        return json.loads(base64.b64decode(cursor))
    except Exception:
        return None


def _encode_cursor(data: dict) -> str:
    return base64.b64encode(json.dumps(data).encode()).decode()


def _is_open_now(opening_hours: dict | None) -> bool | None:
    if not opening_hours:
        return None
    now = datetime.now()
    day_map = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
    day_key = day_map.get(now.weekday())
    if not day_key or day_key not in opening_hours:
        return None
    intervals = opening_hours[day_key]
    if not intervals:
        return False
    current_time = now.strftime("%H:%M")
    for i in range(0, len(intervals), 2):
        if i + 1 < len(intervals):
            if intervals[i] <= current_time <= intervals[i + 1]:
                return True
    return False


async def create_toilet(db: AsyncSession, data: dict, user_id: str) -> Toilet:
    lat = data.pop("lat")
    lon = data.pop("lon")
    geom = WKTElement(f"POINT({lon} {lat})", srid=4326)
    toilet = Toilet(**data, geom=geom, created_by=user_id)
    db.add(toilet)
    await db.flush()
    return toilet


async def get_toilet(db: AsyncSession, redis: aioredis.Redis, toilet_id: str, user: User | None = None) -> dict:
    result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    toilet = result.scalar_one_or_none()
    if not toilet:
        raise NotFoundError("Toilet not found")
    if toilet.is_deleted:
        raise GoneError("This toilet has been deleted")

    photo_result = await db.execute(
        select(ToiletPhoto.url).where(ToiletPhoto.toilet_id == toilet_id)
    )
    photo_urls = [get_url(row[0]) for row in photo_result.all()]

    geom_result = await db.execute(
        select(ST_Y(Toilet.geom), ST_X(Toilet.geom)).where(Toilet.id == toilet_id)
    )
    geom_row = geom_result.one()
    lat, lon = geom_row

    review_result = await db.execute(
        select(Review)
        .where(Review.toilet_id == toilet_id)
        .order_by(Review.created_at.desc())
        .limit(5)
    )
    reviews = review_result.scalars().all()

    review_items = []
    for r in reviews:
        user_result = await db.execute(select(User).where(User.id == r.user_id))
        review_user = user_result.scalar_one_or_none()
        review_items.append({
            "id": str(r.id),
            "rating": r.rating,
            "text": r.text,
            "photo_urls": [],
            "user_nickname": review_user.nickname if review_user else "deleted",
            "user_avatar_url": review_user.avatar_url if review_user else None,
            "created_at": r.created_at,
        })

    total_reviews = toilet.reviews_count or 0

    cache_key = f"is_open:{toilet_id}"
    cached = await redis.get(cache_key)
    if cached is not None:
        is_open = cached == "true"
    else:
        is_open = _is_open_now(toilet.opening_hours)
        if is_open is not None:
            await redis.setex(cache_key, 300, "true" if is_open else "false")

    return {
        "id": str(toilet.id),
        "name": toilet.name,
        "lat": lat,
        "lon": lon,
        "address": toilet.address,
        "floor": toilet.floor,
        "description": toilet.description,
        "location_hint": toilet.location_hint,
        "gender": toilet.gender,
        "toilet_type": toilet.toilet_type,
        "is_free": toilet.is_free,
        "price": toilet.price,
        "currency": toilet.currency,
        "has_water": toilet.has_water,
        "has_hot_water": toilet.has_hot_water,
        "has_soap": toilet.has_soap,
        "has_dryer": toilet.has_dryer,
        "paper_type": toilet.paper_type,
        "has_child_toilet": toilet.has_child_toilet,
        "has_changing_table": toilet.has_changing_table,
        "is_accessible": toilet.is_accessible,
        "cabin_count": toilet.cabin_count,
        "opening_hours": toilet.opening_hours,
        "is_open_now": is_open,
        "is_verified": toilet.is_verified,
        "rating_avg": float(toilet.rating_avg) if toilet.rating_avg else None,
        "reviews_count": total_reviews,
        "last_confirmed_at": toilet.last_confirmed_at,
        "photo_urls": photo_urls,
        "created_by": str(toilet.created_by) if toilet.created_by else None,
        "created_at": toilet.created_at,
        "updated_at": toilet.updated_at,
        "reviews": {
            "items": review_items,
            "next_cursor": None,
            "total": total_reviews,
        },
    }


async def update_toilet(db: AsyncSession, toilet_id: str, data: dict, user: User) -> Toilet:
    result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    toilet = result.scalar_one_or_none()
    if not toilet:
        raise NotFoundError("Toilet not found")
    if toilet.is_deleted:
        raise GoneError("This toilet has been deleted")

    if user.role == UserRole.USER and toilet.created_by != str(user.id):
        raise ForbiddenError("You can only edit your own toilets")

    lat = data.pop("lat", None)
    lon = data.pop("lon", None)
    if lat is not None and lon is not None:
        toilet.geom = WKTElement(f"POINT({lon} {lat})", srid=4326)

    for key, value in data.items():
        setattr(toilet, key, value)
    await db.flush()
    return toilet


async def soft_delete_toilet(db: AsyncSession, toilet_id: str, user: User) -> None:
    result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    toilet = result.scalar_one_or_none()
    if not toilet:
        raise NotFoundError("Toilet not found")
    if toilet.is_deleted:
        raise GoneError("This toilet has been deleted")

    if user.role == UserRole.USER and toilet.created_by != str(user.id):
        raise ForbiddenError("You can only delete your own toilets")

    toilet.is_deleted = True
    await db.flush()


async def hard_delete_toilet(db: AsyncSession, toilet_id: str) -> None:
    result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    toilet = result.scalar_one_or_none()
    if not toilet:
        raise NotFoundError("Toilet not found")
    await db.delete(toilet)
    await db.flush()


async def nearby(
    db: AsyncSession,
    redis: aioredis.Redis,
    lat: float,
    lon: float,
    radius: float = 1000,
    limit: int = 20,
    cursor: str | None = None,
    **filters,
) -> dict:
    user_point = WKTElement(f"POINT({lon} {lat})", srid=4326)
    distance_expr = ST_Distance(
        ST_Transform(Toilet.geom, 3857),
        ST_Transform(user_point, 3857),
    ).label("distance_m")

    query = select(
        Toilet,
        distance_expr,
        ST_Y(Toilet.geom).label("lat"),
        ST_X(Toilet.geom).label("lon"),
    ).where(
        and_(
            Toilet.is_deleted == False,
            ST_DWithin(
                ST_Transform(Toilet.geom, 3857),
                ST_Transform(user_point, 3857),
                radius,
            ),
        )
    )

    for key, value in filters.items():
        if value is not None and hasattr(Toilet, key):
            query = query.where(getattr(Toilet, key) == value)

    if filters.get("is_open_now"):
        query = query.where(Toilet.opening_hours.isnot(None))

    if filters.get("min_rating"):
        query = query.where(Toilet.rating_avg >= filters["min_rating"])

    decoded = _decode_cursor(cursor)
    if decoded:
        query = query.where(
            or_(
                distance_expr > decoded["distance_m"],
                and_(
                    distance_expr == decoded["distance_m"],
                    Toilet.id > decoded["id"],
                ),
            )
        )

    query = query.order_by(distance_expr, Toilet.id).limit(limit + 1)
    rows = (await db.execute(query)).all()

    items = []
    for row in rows[:limit]:
        toilet = row[0]
        distance = row[1]
        t_lat = row[2]
        t_lon = row[3]

        cache_key = f"is_open:{toilet.id}"
        cached = await redis.get(cache_key)
        is_open = None
        if cached is not None:
            is_open = cached == "true"
        else:
            is_open = _is_open_now(toilet.opening_hours)
            if is_open is not None:
                await redis.setex(cache_key, 300, "true" if is_open else "false")

        photo_result = await db.execute(
            select(ToiletPhoto.url).where(ToiletPhoto.toilet_id == toilet.id).limit(1)
        )
        photo_urls = [get_url(r[0]) for r in photo_result.all()]

        items.append({
            "id": str(toilet.id),
            "name": toilet.name,
            "distance_m": round(distance, 1),
            "lat": float(t_lat) if t_lat else 0.0,
            "lon": float(t_lon) if t_lon else 0.0,
            "address": toilet.address,
            "floor": toilet.floor,
            "gender": toilet.gender,
            "is_free": toilet.is_free,
            "is_open_now": is_open,
            "rating_avg": float(toilet.rating_avg) if toilet.rating_avg else None,
            "reviews_count": toilet.reviews_count,
            "last_confirmed_at": toilet.last_confirmed_at,
            "photo_urls": photo_urls,
        })

    next_cursor = None
    if len(rows) > limit:
        last = items[-1]
        next_cursor = _encode_cursor({"distance_m": last["distance_m"], "id": last["id"]})

    count_query = select(func.count()).select_from(Toilet).where(
        and_(
            Toilet.is_deleted == False,
            ST_DWithin(
                ST_Transform(Toilet.geom, 3857),
                ST_Transform(user_point, 3857),
                radius,
            ),
        )
    )
    total = (await db.execute(count_query)).scalar()

    return {"items": items, "next_cursor": next_cursor, "total": total}


async def search(
    db: AsyncSession,
    q: str,
    lat: float | None = None,
    lon: float | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> dict:
    if len(q) < 3:
        raise BadRequestError("Search query must be at least 3 characters")

    query = select(
        Toilet,
        ST_Y(Toilet.geom).label("lat"),
        ST_X(Toilet.geom).label("lon"),
    ).where(
        and_(
            Toilet.is_deleted == False,
            or_(
                Toilet.name.ilike(f"%{q}%"),
                Toilet.address.ilike(f"%{q}%"),
            ),
        )
    )

    if lat is not None and lon is not None:
        user_point = WKTElement(f"POINT({lon} {lat})", srid=4326)
        distance_expr = ST_Distance(
            ST_Transform(Toilet.geom, 3857),
            ST_Transform(user_point, 3857),
        )
        query = query.order_by(distance_expr)
    else:
        query = query.order_by(Toilet.created_at.desc())

    decoded = _decode_cursor(cursor)
    if decoded:
        query = query.where(Toilet.created_at < decoded.get("created_at", ""))

    query = query.limit(limit + 1)
    rows = (await db.execute(query)).all()

    items = []
    for row in rows[:limit]:
        toilet = row[0]
        t_lat = row[1]
        t_lon = row[2]
        items.append({
            "id": str(toilet.id),
            "name": toilet.name,
            "distance_m": None,
            "lat": float(t_lat) if t_lat else 0.0,
            "lon": float(t_lon) if t_lon else 0.0,
            "address": toilet.address,
            "floor": toilet.floor,
            "gender": toilet.gender,
            "is_free": toilet.is_free,
            "is_open_now": None,
            "rating_avg": float(toilet.rating_avg) if toilet.rating_avg else None,
            "reviews_count": toilet.reviews_count,
            "last_confirmed_at": toilet.last_confirmed_at,
            "photo_urls": [],
        })

    next_cursor = None
    if len(rows) > limit:
        last_toilet = rows[limit - 1][0]
        next_cursor = _encode_cursor({"created_at": last_toilet.created_at.isoformat()})

    total = len(items)

    return {"items": items, "next_cursor": next_cursor, "total": total}


async def verify_toilet(db: AsyncSession, toilet_id: str) -> Toilet:
    result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    toilet = result.scalar_one_or_none()
    if not toilet:
        raise NotFoundError("Toilet not found")
    toilet.is_verified = True
    await db.flush()
    return toilet


async def confirm_toilet(db: AsyncSession, toilet_id: str, user_id: str, is_actual: bool) -> Confirmation:
    result = await db.execute(
        select(Confirmation).where(
            and_(Confirmation.toilet_id == toilet_id, Confirmation.user_id == user_id)
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.is_actual = is_actual
        await db.flush()
        return existing

    confirmation = Confirmation(toilet_id=toilet_id, user_id=user_id, is_actual=is_actual)
    db.add(confirmation)

    if is_actual:
        await db.execute(
            update(Toilet)
            .where(Toilet.id == toilet_id)
            .values(last_confirmed_at=datetime.now(timezone.utc))
        )

    await db.flush()
    return confirmation
