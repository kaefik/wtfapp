### L0-02 — Config module (app/config.py)

**Goal:** Pydantic Settings-based configuration loading from env vars.
**Input:** Design document "Environment Variables" section.
**Output:** `app/config.py`
**Done when:** `from app.config import settings` works, all env vars mapped.
**Acceptance criteria:**
- [x] Pydantic BaseSettings class with all env vars from .env.example
- [x] DATABASE_URL, REDIS_URL parsed
- [x] JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH support (file loading)
- [x] CORS_ORIGINS parsed as list
- [x] RATE_LIMIT_ANONYMOUS / RATE_LIMIT_AUTHENTICATED
- [x] MEDIA_ROOT / MEDIA_URL
- [x] SMTP settings
- [x] ENVIRONMENT field (development/production)
**depends_on:** [L0/01]
**impact:** 5
**complexity:** 1
**risk:** 1
**priority_score:** 11.0
**Est. effort:** S
