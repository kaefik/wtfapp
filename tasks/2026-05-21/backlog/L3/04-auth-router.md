### L3-04 — Auth router

**Goal:** FastAPI router for all auth endpoints.
**Input:** Auth service (L2-01), auth schemas (L3-01), auth dependencies (L4-02).
**Output:** `app/routers/auth.py`
**Done when:** All auth endpoints work: register, login, refresh, logout, verify, reset, profile.
**Acceptance criteria:**
- [x] POST /api/v1/auth/register → set refresh cookie + return access_token
- [x] POST /api/v1/auth/login → same
- [x] POST /api/v1/auth/refresh → rotate refresh token, new cookie
- [x] POST /api/v1/auth/logout → clear cookie, invalidate Redis
- [x] POST /api/v1/auth/verify-email
- [x] POST /api/v1/auth/forgot-password
- [x] POST /api/v1/auth/reset-password
- [x] GET /api/v1/auth/me → current user profile
- [x] PATCH /api/v1/auth/me → update profile
- [x] POST /api/v1/auth/me/avatar → upload avatar
- [x] Cookie params: HttpOnly, SameSite=Lax, Secure in prod, Path=/api/v1/auth
**depends_on:** [L2/01, L3/01, L4/02, L5/01, L5/02]
**impact:** 5
**complexity:** 3
**risk:** 2
**priority_score:** 4.0
**Est. effort:** M
