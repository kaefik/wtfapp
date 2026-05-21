### L4-01 — JWT utilities + Redis refresh tokens

**Goal:** JWT access token creation/verification (RS256) + refresh token management in Redis.
**Input:** Design doc "Аутентификация" and "refresh_tokens" sections.
**Output:** `app/utils/auth.py`
**Done when:** Can create/verify access tokens, create/store/rotate/delete refresh tokens in Redis.
**Acceptance criteria:**
- [x] create_access_token(user_id, role) → JWT RS256, TTL 15 min
- [x] verify_access_token(token) → payload or raise 401
- [x] create_refresh_token(user_id, device) → UUID jti, store in Redis
- [x] Redis key: `refresh:{user_id}:{jti}` → JSON {"device": "..."}, TTL 30 days
- [x] Max 5 refresh tokens per user (FIFO eviction)
- [x] rotate_refresh_token: invalidate old, create new
- [x] revoke_all_refresh_tokens(user_id): delete all user's tokens
- [x] Replay detection: if reused invalidated token → revoke all user tokens
- [x] Load RSA keys from file path (config)
**depends_on:** [L0/02]
**impact:** 5
**complexity:** 3
**risk:** 3
**priority_score:** 4.3
**Est. effort:** M
