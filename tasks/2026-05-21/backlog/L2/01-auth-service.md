### L2-01 — Auth service

**Goal:** Business logic for registration, login, refresh, logout, profile.
**Input:** User model, JWT utils, Redis refresh tokens.
**Output:** `app/services/auth.py`
**Done when:** All auth operations work: register, login, refresh, logout, get/update profile.
**Acceptance criteria:**
- [x] register(nickname, email, password) → user, access_token, refresh_token cookie
- [x] login(email, password) → verify bcrypt hash, create tokens
- [x] refresh_token(old_jti) → rotate: invalidate old, create new (rotation)
- [x] logout(user_id, jti) → delete from Redis, clear cookie
- [x] verify_email(token) → lookup in Redis, set is_email_verified=True
- [x] forgot_password(email) → generate token, store in Redis, send email (background)
- [x] reset_password(token, new_password) → lookup in Redis, update hash
- [x] get_profile(user_id) → user data
- [x] update_profile(user_id, data) → update allowed fields (nickname, full_name, birth_date)
- [x] Antispam: 10 toilets/day, 20 reviews/day limits (Redis INCR)
- [x] Password hashing: bcrypt via passlib
**depends_on:** [L4/01, L1/02, L5/03]
**impact:** 5
**complexity:** 3
**risk:** 3
**priority_score:** 4.3
**Est. effort:** M
