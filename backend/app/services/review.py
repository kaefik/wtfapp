from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError, ConflictError, ForbiddenError
from app.models.review import Review, ReviewPhoto
from app.models.toilet import Toilet
from app.models.user import User
from app.models.enums import UserRole
from app.utils.storage import get_url


async def create_review(db: AsyncSession, toilet_id: str, user_id: str, rating: int, text: str | None = None) -> Review:
    result = await db.execute(
        select(Review).where(and_(Review.toilet_id == toilet_id, Review.user_id == user_id))
    )
    if result.scalar_one_or_none():
        raise ConflictError("You already reviewed this toilet")

    toilet_result = await db.execute(select(Toilet).where(Toilet.id == toilet_id))
    if not toilet_result.scalar_one_or_none():
        raise NotFoundError("Toilet not found")

    review = Review(toilet_id=toilet_id, user_id=user_id, rating=rating, text=text)
    db.add(review)
    await db.flush()

    await _update_toilet_rating(db, toilet_id)
    return review


async def update_review(db: AsyncSession, review_id: str, user_id: str, rating: int | None = None, text: str | None = None) -> Review:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review not found")
    if review.user_id != user_id:
        raise ForbiddenError("You can only edit your own reviews")

    if rating is not None:
        review.rating = rating
    if text is not None:
        review.text = text
    await db.flush()

    await _update_toilet_rating(db, str(review.toilet_id))
    return review


async def delete_review(db: AsyncSession, review_id: str, user: User) -> None:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review not found")

    if user.role == UserRole.USER and review.user_id != str(user.id):
        raise ForbiddenError("You can only delete your own reviews")

    toilet_id = str(review.toilet_id)
    await db.delete(review)
    await db.flush()

    await _update_toilet_rating(db, toilet_id)


async def list_reviews(db: AsyncSession, toilet_id: str, limit: int = 20, cursor: str | None = None) -> dict:
    query = select(Review).where(Review.toilet_id == toilet_id).order_by(Review.created_at.desc())

    if cursor:
        query = query.where(Review.created_at < cursor)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    reviews = result.scalars().all()

    items = []
    for r in reviews[:limit]:
        user_result = await db.execute(select(User).where(User.id == r.user_id))
        review_user = user_result.scalar_one_or_none()

        photo_result = await db.execute(
            select(ReviewPhoto.url).where(ReviewPhoto.review_id == r.id)
        )
        photo_urls = [get_url(row[0]) for row in photo_result.all()]

        items.append({
            "id": str(r.id),
            "rating": r.rating,
            "text": r.text,
            "photo_urls": photo_urls,
            "user_nickname": review_user.nickname if review_user else "deleted",
            "user_avatar_url": review_user.avatar_url if review_user else None,
            "created_at": r.created_at,
        })

    next_cursor = None
    if len(reviews) > limit:
        next_cursor = reviews[limit - 1].created_at.isoformat()

    count_result = await db.execute(
        select(func.count()).select_from(Review).where(Review.toilet_id == toilet_id)
    )
    total = count_result.scalar()

    return {"items": items, "next_cursor": next_cursor, "total": total}


async def _update_toilet_rating(db: AsyncSession, toilet_id: str) -> None:
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.toilet_id == toilet_id)
    )
    avg, count = result.one()
    await db.execute(
        Toilet.__table__.update()
        .where(Toilet.id == toilet_id)
        .values(rating_avg=avg, reviews_count=count)
    )
    await db.flush()
