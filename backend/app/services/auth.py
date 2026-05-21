import secrets
from datetime import datetime, timezone
from uuid import UUID

from passlib.context import CryptContext
from redis.asyncio import Redis
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.exceptions import BadRequestError, ConflictError, UnauthorizedError, NotFoundError
from app.models.user import User
from app.models.enums import UserRole
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_refresh_tokens,
    store_email_token,
    verify_email_token,
    store_password_reset_token,
    verify_password_reset_token,
)
from app.utils.email import send_verification_email, send_password_reset_email
from app.utils.storage import save_file, get_url

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def register(
    db: AsyncSession,
    redis: Redis,
    nickname: str,
    email: str,
    password: str,
    birth_date=None,
) -> dict:
    existing = await db.execute(
        select(User).where((User.email == email) | (User.nickname == nickname))
    )
    if existing.scalar_one_or_none():
        raise ConflictError("User with this email or nickname already exists")

    user = User(
        nickname=nickname,
        email=email,
        password_hash=hash_password(password),
        birth_date=birth_date,
        role=UserRole.USER,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_jti = await create_refresh_token(redis, str(user.id))

    token = secrets.token_urlsafe(32)
    await store_email_token(redis, token, str(user.id))
    await send_verification_email(email, token)

    return {
        "access_token": access_token,
        "refresh_jti": refresh_jti,
        "user": user,
    }


async def login(db: AsyncSession, redis: Redis, email: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials")
    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_jti = await create_refresh_token(redis, str(user.id))

    return {
        "access_token": access_token,
        "refresh_jti": refresh_jti,
        "user": user,
    }


async def refresh(db: AsyncSession, redis: Redis, user_id: str, old_jti: str) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("User not found")

    new_jti = await rotate_refresh_token(redis, str(user.id), old_jti)
    access_token = create_access_token(str(user.id), user.role.value)

    return {
        "access_token": access_token,
        "refresh_jti": new_jti,
        "user": user,
    }


async def logout(redis: Redis, user_id: str, jti: str) -> None:
    await revoke_refresh_token(redis, user_id, jti)


async def verify_email(redis: Redis, token: str, db: AsyncSession) -> User:
    user_id = await verify_email_token(redis, token)
    if not user_id:
        raise BadRequestError("Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    user.is_email_verified = True
    await db.flush()
    return user


async def forgot_password(redis: Redis, db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return
    token = secrets.token_urlsafe(32)
    await store_password_reset_token(redis, token, str(user.id))
    await send_password_reset_email(email, token)


async def reset_password(redis: Redis, db: AsyncSession, token: str, new_password: str) -> User:
    user_id = await verify_password_reset_token(redis, token)
    if not user_id:
        raise BadRequestError("Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    user.password_hash = hash_password(new_password)
    await db.flush()
    return user


async def get_profile(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


async def update_profile(db: AsyncSession, user_id: str, **data) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)
    await db.flush()
    return user


async def upload_avatar(db: AsyncSession, user_id: str, content: bytes, ext: str = "webp") -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    path = save_file("avatars", str(user.id), content, ext)
    user.avatar_url = get_url(path)
    await db.flush()
    return user
