from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.dependencies import get_db, get_current_user, get_optional_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.services.review import create_review, update_review, delete_review, list_reviews
from app.services.photo import (
    upload_toilet_photo, delete_toilet_photo,
    upload_review_photo, delete_review_photo,
)

router = APIRouter(tags=["reviews"])


@router.get("/api/v1/toilets/{toilet_id}/reviews/")
async def list_reviews_endpoint(
    toilet_id: str,
    limit: int = 20,
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await list_reviews(db, toilet_id, limit, cursor)


@router.post("/api/v1/toilets/{toilet_id}/reviews/", status_code=201)
async def create_review_endpoint(
    toilet_id: str,
    data: ReviewCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    review = await create_review(db, toilet_id, str(user.id), data.rating, data.text)
    return {"id": str(review.id), "rating": review.rating}


@router.patch("/api/v1/reviews/{review_id}")
async def update_review_endpoint(
    review_id: str,
    data: ReviewUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    review = await update_review(db, review_id, str(user.id), data.rating, data.text)
    return {"id": str(review.id), "rating": review.rating}


@router.delete("/api/v1/reviews/{review_id}", status_code=204)
async def delete_review_endpoint(
    review_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_review(db, review_id, user)


@router.post("/api/v1/toilets/{toilet_id}/photos", status_code=201)
async def upload_toilet_photo_endpoint(
    toilet_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    photo = await upload_toilet_photo(db, toilet_id, str(user.id), content, file.content_type or "")
    return {"id": str(photo.id), "url": photo.url}


@router.delete("/api/v1/toilets/photos/{photo_id}", status_code=204)
async def delete_toilet_photo_endpoint(
    photo_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_toilet_photo(db, photo_id, user)


@router.post("/api/v1/reviews/{review_id}/photos", status_code=201)
async def upload_review_photo_endpoint(
    review_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    photo = await upload_review_photo(db, review_id, str(user.id), content, file.content_type or "")
    return {"id": str(photo.id), "url": photo.url}


@router.delete("/api/v1/reviews/photos/{photo_id}", status_code=204)
async def delete_review_photo_endpoint(
    photo_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_review_photo(db, photo_id, user)
