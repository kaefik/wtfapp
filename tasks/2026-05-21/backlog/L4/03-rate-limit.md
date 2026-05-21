### L4-03 — Rate limiting middleware

**Goal:** Custom async rate limiting middleware using Redis INCR + TTL.
**Input:** Design doc "Rate limiting" section, Redis connection.
**Output:** Added to `app/middleware.py`
**Done when:** Anonymous: 100/min, authenticated: 300/min. Returns 429 when exceeded.
**Acceptance criteria:**
- [x] RateLimitMiddleware: extracts IP (anonymous) or user_id (authenticated)
- [x] Redis INCR + EXPIRE (atomic via pipeline)
- [x] Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- [x] Returns 429 with Retry-After header when exceeded
- [x] Configurable limits from settings
- [x] Does not block event loop (async)
**depends_on:** [L0/02, L4/02]
**impact:** 3
**complexity:** 3
**risk:** 2
**priority_score:** 2.7
**Est. effort:** S
