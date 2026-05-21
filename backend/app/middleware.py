import time
import uuid
import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.config import get_settings

settings = get_settings()


def setup_logging():
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]
    if settings.is_production:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    structlog.configure(processors=processors)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        self.logger = structlog.get_logger("app.request")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000
        log_method = self.logger.warning if duration_ms > 1000 else self.logger.info
        log_method(
            "request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            request_id=getattr(request.state, "request_id", None),
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        self.redis_url = settings.REDIS_URL

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        import redis.asyncio as aioredis
        redis = aioredis.from_url(self.redis_url, decode_responses=True)

        try:
            user_id = None
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                try:
                    from app.utils.auth import verify_access_token
                    payload = verify_access_token(auth_header[7:])
                    user_id = payload.get("sub")
                except Exception:
                    pass

            if user_id:
                key = f"rate_limit:{user_id}"
                limit = 300
            else:
                forwarded = request.headers.get("x-forwarded-for", "")
                ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else "unknown"
                key = f"rate_limit:{ip}"
                limit = 100

            current = await redis.incr(key)
            if current == 1:
                await redis.expire(key, 60)

            ttl = await redis.ttl(key)

            if current > limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded", "code": "RATE_LIMIT_EXCEEDED"},
                    headers={
                        "Retry-After": str(max(ttl, 1)),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(ttl),
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current))
            response.headers["X-RateLimit-Reset"] = str(ttl)
            return response
        finally:
            await redis.close()
