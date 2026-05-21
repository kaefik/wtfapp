### L0-05 — Main app (wire everything together)

**Goal:** Create app/main.py that wires all routers, middleware, exception handlers, startup/shutdown.
**Input:** All routers, middleware, exceptions, config.
**Output:** `app/main.py`
**Done when:** `uvicorn app.main:app` starts, /health works, /docs shows Swagger.
**Acceptance criteria:**
- [x] FastAPI app with title, version, openapi_url
- [x] CORS middleware configured from settings
- [x] Security headers middleware (X-Content-Type-Options, X-Frame-Options)
- [x] RequestIdMiddleware + LoggingMiddleware registered
- [x] RateLimitMiddleware registered
- [x] Exception handlers registered
- [x] All routers included with /api/v1 prefix
- [x] Static files mount for /media
- [x] Startup: connect to Redis, run any init
- [x] Shutdown: dispose DB engine, close Redis
- [x] GET /health → check DB + Redis connectivity
- [x] Include router for avatar upload in auth router
**depends_on:** [L3/04, L3/05, L3/06, L3/07, L6/01, L9/01, L4/03]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
