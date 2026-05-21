from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.toilet import ToiletPhoto
from app.models.review import ReviewPhoto, Review
from app.models.user import User
from app.models.enums import UserRole
from app.utils.storage import save_file, delete_file, get_url
from app.utils.image import process_upload


async def upload_toilet_photo(
    db: AsyncSession, toilet_id: str, user_id: str, content: bytes, content_type: str
) -> ToiletPhoto:
    count_result = await db.execute(
        select(func.count()).select_from(ToiletPhoto).where(ToiletPhoto.toilet_id == toilet_id)
    )
    if count_result.scalar() >= 10:
        raise BadRequestError("Maximum 10 photos per toilet")

    try:
        original_bytes, thumbnail_bytes = process_upload(content, content_type)
    except ValueError as e:
        raise BadRequestError(str(e))

    original_path = save_file("toilets", toilet_id, original_bytes, "webp")
    save_file("toilets", toilet_id, thumbnail_bytes, "webp", is_thumbnail=True)

    photo = ToiletPhoto(
        toilet_id=toilet_id,
        uploaded_by=user_id,
        url=original_path,
    )
    db.add(photo)
    await db.flush()
    return photo


async def delete_toilet_photo(db: AsyncSession, photo_id: str, user: User) -> None:
    result = await db.execute(select(ToiletPhoto).where(ToiletPhoto.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise NotFoundError("Photo not found")

    if user.role == UserRole.USER and photo.uploaded_by != str(user.id):
        raise ForbiddenError("You can only delete your own photos")

    delete_file(photo.url)
    await db.delete(photo)
    await db.flush()


async def upload_review_photo(
    db: AsyncSession, review_id: str, user_id: str, content: bytes, content_type: str
) -> ReviewPhoto:
    review_result = await db.execute(select(Review).where(Review.id == review_id))
    review = review_result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review not found")
    if review.user_id != user_id:
        raise ForbiddenError("You can only add photos to your own reviews")

    count_result = await db.execute(
        select(func.count()).select_from(ReviewPhoto).where(ReviewPhoto.review_id == review_id)
    )
    if count_result.scalar() >= 5:
        raise BadRequestError("Maximum 5 photos per review")

    try:
        original_bytes, thumbnail_bytes = process_upload(content, content_type)
    except ValueError as e:
        raise BadRequestError(str(e))

    original_path = save_file("reviews", review_id, original_bytes, "webp")

    photo = ReviewPhoto(review_id=review_id, url=original_path)
    db.add(photo)
    await db.flush()
    return photo


async def delete_review_photo(db: AsyncSession, photo_id: str, user: User) -> None:
    result = await db.execute(select(ReviewPhoto).where(ReviewPhoto.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise NotFoundError("Photo not found")

    review_result = await db.execute(select(Review).where(Review.id == photo.review_id))
    review = review_result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review not found")

    if user.role == UserRole.USER and review.user_id != str(user.id):
        raise ForbiddenError("You can only delete photos from your own reviews")

    delete_file(photo.url)
    await db.delete(photo)
    await db.flush()
