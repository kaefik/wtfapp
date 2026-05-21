from fastapi import APIRouter, Depends, Response, Request, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.dependencies import get_db, get_redis, get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, AuthResponse, UserResponse,
    ProfileUpdate, VerifyEmailRequest, ForgotPasswordRequest,
    ResetPasswordRequest, TokenResponse,
)
from app.services.auth import (
    register, login, refresh, logout, verify_email,
    forgot_password, reset_password, get_profile, update_profile, upload_avatar,
)
from app.utils.image import process_upload
from app.config import get_settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


def _set_refresh_cookie(response: Response, jti: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=jti,
        httponly=True,
        samesite="lax",
        path="/api/v1/auth",
        secure=settings.is_production,
        max_age=settings.JWT_REFRESH_TOKEN_TTL_DAYS * 86400,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        samesite="lax",
        path="/api/v1/auth",
        max_age=0,
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register_endpoint(
    data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await register(db, redis, data.nickname, data.email, data.password, data.birth_date)
    _set_refresh_cookie(response, result["refresh_jti"])
    return AuthResponse(
        access_token=result["access_token"],
        user=UserResponse.model_validate(result["user"]),
    )


@router.post("/login", response_model=AuthResponse)
async def login_endpoint(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await login(db, redis, data.email, data.password)
    _set_refresh_cookie(response, result["refresh_jti"])
    return AuthResponse(
        access_token=result["access_token"],
        user=UserResponse.model_validate(result["user"]),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_endpoint(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    jti = request.cookies.get("refresh_token")
    if not jti:
        from app.exceptions import UnauthorizedError
        raise UnauthorizedError("No refresh token")

    payload_parts = jti.split(":")
    if len(payload_parts) < 2:
        from app.exceptions import UnauthorizedError
        raise UnauthorizedError("Invalid refresh token")

    result = await refresh(db, redis, "placeholder", jti)
    _set_refresh_cookie(response, result["refresh_jti"])
    return TokenResponse(access_token=result["access_token"])


@router.post("/logout", status_code=204)
async def logout_endpoint(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
):
    jti = request.cookies.get("refresh_token")
    if jti:
        await logout(redis, str(user.id), jti)
    _clear_refresh_cookie(response)


@router.post("/verify-email", response_model=UserResponse)
async def verify_email_endpoint(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    user = await verify_email(redis, data.token, db)
    return UserResponse.model_validate(user)


@router.post("/forgot-password", status_code=204)
async def forgot_password_endpoint(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    background_tasks.add_task(forgot_password, redis, db, data.email)


@router.post("/reset-password", response_model=UserResponse)
async def reset_password_endpoint(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    user = await reset_password(redis, db, data.token, data.new_password)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await update_profile(db, str(user.id), **data.model_dump(exclude_unset=True))
    return UserResponse.model_validate(updated)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    try:
        original_bytes, _ = process_upload(content, file.content_type or "")
    except ValueError:
        from app.exceptions import BadRequestError
        raise BadRequestError("Invalid image file")
    updated = await upload_avatar(db, str(user.id), original_bytes)
    return UserResponse.model_validate(updated)
