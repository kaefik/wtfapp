from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import JSONResponse
import redis.asyncio as aioredis
import os

from app.config import get_settings
from app.middleware import (
    RequestIdMiddleware,
    LoggingMiddleware,
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    setup_logging,
)
from app.exceptions import register_exception_handlers
from app.routers import auth, toilets, reviews, reports, users
from app.database import dispose_engine

settings = get_settings()

redis_client: aioredis.Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    setup_logging()
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    yield
    await redis_client.close()
    await dispose_engine()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(toilets.router)
app.include_router(reviews.router)
app.include_router(reports.router)
app.include_router(users.router)

os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")


@app.get("/health")
async def health():
    db_ok = False
    redis_ok = False
    try:
        from app.database import engine
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    try:
        if redis_client:
            await redis_client.ping()
            redis_ok = True
    except Exception:
        pass
    return JSONResponse(
        {"status": "ok" if db_ok and redis_ok else "degraded", "db": db_ok, "redis": redis_ok}
    )
