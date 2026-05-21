from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from typing import Optional

from app.dependencies import get_db, get_redis, get_current_user, get_optional_user, require_role
from app.models.user import User
from app.models.enums import UserRole, Gender, ToiletType, PaperType
from app.schemas.toilet import ToiletCreate, ToiletUpdate, NearbyResponse, ToiletDetail
from app.services.toilet import (
    create_toilet, get_toilet, update_toilet,
    soft_delete_toilet, hard_delete_toilet, nearby, search,
    verify_toilet, confirm_toilet,
)

router = APIRouter(prefix="/api/v1/toilets", tags=["toilets"])


@router.get("/nearby", response_model=NearbyResponse)
async def nearby_endpoint(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius: float = Query(1000, le=10000),
    gender: Optional[Gender] = None,
    is_free: Optional[bool] = None,
    has_water: Optional[bool] = None,
    has_hot_water: Optional[bool] = None,
    has_soap: Optional[bool] = None,
    has_dryer: Optional[bool] = None,
    paper_type: Optional[PaperType] = None,
    has_child_toilet: Optional[bool] = None,
    has_changing_table: Optional[bool] = None,
    is_accessible: Optional[bool] = None,
    toilet_type: Optional[ToiletType] = None,
    is_open_now: Optional[bool] = None,
    min_rating: Optional[float] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    filters = {
        "gender": gender,
        "is_free": is_free,
        "has_water": has_water,
        "has_hot_water": has_hot_water,
        "has_soap": has_soap,
        "has_dryer": has_dryer,
        "paper_type": paper_type,
        "has_child_toilet": has_child_toilet,
        "has_changing_table": has_changing_table,
        "is_accessible": is_accessible,
        "toilet_type": toilet_type,
        "is_open_now": is_open_now,
        "min_rating": min_rating,
    }
    return await nearby(db, redis, lat, lon, radius, limit, cursor, **filters)


@router.get("/search", response_model=NearbyResponse)
async def search_endpoint(
    q: str = Query(..., min_length=3),
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await search(db, q, lat, lon, limit, cursor)


@router.get("/{toilet_id}")
async def get_toilet_endpoint(
    toilet_id: str,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    user: Optional[User] = Depends(get_optional_user),
):
    return await get_toilet(db, redis, toilet_id, user)


@router.post("/", status_code=201)
async def create_toilet_endpoint(
    data: ToiletCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    toilet = await create_toilet(db, data.model_dump(exclude_unset=True), str(user.id))
    return {"id": str(toilet.id), "name": toilet.name}


@router.patch("/{toilet_id}")
async def update_toilet_endpoint(
    toilet_id: str,
    data: ToiletUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    toilet = await update_toilet(db, toilet_id, data.model_dump(exclude_unset=True, exclude_none=True), user)
    return {"id": str(toilet.id), "name": toilet.name}


@router.delete("/{toilet_id}", status_code=204)
async def delete_toilet_endpoint(
    toilet_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await soft_delete_toilet(db, toilet_id, user)


@router.delete("/{toilet_id}/hard", status_code=204)
async def hard_delete_toilet_endpoint(
    toilet_id: str,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await hard_delete_toilet(db, toilet_id)


@router.post("/{toilet_id}/confirm", status_code=201)
async def confirm_toilet_endpoint(
    toilet_id: str,
    is_actual: bool = True,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    confirmation = await confirm_toilet(db, toilet_id, str(user.id), is_actual)
    return {"id": str(confirmation.id)}


@router.patch("/{toilet_id}/verify")
async def verify_toilet_endpoint(
    toilet_id: str,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    toilet = await verify_toilet(db, toilet_id)
    return {"id": str(toilet.id), "is_verified": toilet.is_verified}
