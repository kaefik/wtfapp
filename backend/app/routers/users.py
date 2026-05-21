from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.dependencies import get_db, get_optional_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.report import UserRoleUpdate, UserStatusUpdate, UserListResponse, UserListItem
from app.services.report import list_users, get_user, change_role, change_status, delete_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/")
async def list_users_endpoint(
    search: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await list_users(db, search, limit, cursor)


@router.get("/{user_id}")
async def get_user_endpoint(
    user_id: str,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await get_user(db, user_id)
    return UserListItem.model_validate(result)


@router.get("/{user_id}/toilets")
async def get_user_toilets_endpoint(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    from app.services.toilet import search
    return await search(db, "", limit=limit, cursor=cursor)


@router.get("/{user_id}/reviews")
async def get_user_reviews_endpoint(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    from app.services.review import list_reviews
    return await list_reviews(db, "", limit, cursor)


@router.patch("/{user_id}/role")
async def change_role_endpoint(
    user_id: str,
    data: UserRoleUpdate,
    user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await change_role(db, user_id, data.role)
    return UserListItem.model_validate(result)


@router.patch("/{user_id}/status")
async def change_status_endpoint(
    user_id: str,
    data: UserStatusUpdate,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await change_status(db, user_id, data.is_active)
    return UserListItem.model_validate(result)


@router.delete("/{user_id}", status_code=204)
async def delete_user_endpoint(
    user_id: str,
    user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await delete_user(db, user_id)
