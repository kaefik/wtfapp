from datetime import datetime, timedelta, timezone
from uuid import uuid4, UUID
import json
from jose import jwt, JWTError, ExpiredSignatureError
from redis.asyncio import Redis

from app.config import get_settings

settings = get_settings()


def _get_private_key() -> str:
    return settings.jwt_private_key


def _get_public_key() -> str:
    return settings.jwt_public_key


def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_TTL_MINUTES),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, _get_private_key(), algorithm="RS256")


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, _get_public_key(), algorithms=["RS256"])
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except ExpiredSignatureError:
        raise ValueError("Token expired")
    except JWTError:
        raise ValueError("Invalid token")


async def create_refresh_token(
    redis: Redis, user_id: str, device: str = "web"
) -> str:
    jti = str(uuid4())
    key = f"refresh:{user_id}:{jti}"
    value = json.dumps({"device": device})
    ttl = timedelta(days=settings.JWT_REFRESH_TOKEN_TTL_DAYS)

    pattern = f"refresh:{user_id}:*"
    existing = await redis.keys(pattern)
    if len(existing) >= 5:
        oldest_key = existing[0]
        await redis.delete(oldest_key)

    await redis.setex(key, int(ttl.total_seconds()), value)
    return jti


async def validate_refresh_token(redis: Redis, user_id: str, jti: str) -> bool:
    key = f"refresh:{user_id}:{jti}"
    return await redis.exists(key)


async def rotate_refresh_token(
    redis: Redis, user_id: str, old_jti: str, device: str = "web"
) -> str:
    old_key = f"refresh:{user_id}:{old_jti}"
    exists = await redis.exists(old_key)
    if not exists:
        await revoke_all_refresh_tokens(redis, user_id)
        raise ValueError("Refresh token reuse detected")

    await redis.delete(old_key)
    return await create_refresh_token(redis, user_id, device)


async def revoke_refresh_token(redis: Redis, user_id: str, jti: str) -> None:
    key = f"refresh:{user_id}:{jti}"
    await redis.delete(key)


async def revoke_all_refresh_tokens(redis: Redis, user_id: str) -> None:
    pattern = f"refresh:{user_id}:*"
    keys = await redis.keys(pattern)
    if keys:
        await redis.delete(*keys)


async def store_email_token(redis: Redis, token: str, user_id: str, ttl_seconds: int = 86400) -> None:
    key = f"email_token:{token}"
    await redis.setex(key, ttl_seconds, str(user_id))


async def verify_email_token(redis: Redis, token: str) -> str | None:
    key = f"email_token:{token}"
    user_id = await redis.get(key)
    if user_id:
        await redis.delete(key)
        return user_id.decode() if isinstance(user_id, bytes) else user_id
    return None


async def store_password_reset_token(redis: Redis, token: str, user_id: str) -> None:
    key = f"password_reset:{token}"
    await redis.setex(key, 3600, str(user_id))


async def verify_password_reset_token(redis: Redis, token: str) -> str | None:
    key = f"password_reset:{token}"
    user_id = await redis.get(key)
    if user_id:
        await redis.delete(key)
        return user_id.decode() if isinstance(user_id, bytes) else user_id
    return None
