### L4-02 — Auth dependencies (get_current_user, get_optional_user)

**Goal:** FastAPI dependencies for auth: required auth, optional auth, role-based access.
**Input:** L4-01 JWT utils, User model.
**Output:** `app/dependencies.py`
**Done when:** Dependencies work in FastAPI routes for auth/role checks.
**Acceptance criteria:**
- [x] get_current_user: extract Bearer token, verify, load user from DB → 401 if invalid
- [x] get_optional_user: same but returns None if no token (anonymous access)
- [x] require_role(*roles): dependency factory for role-based access
- [x] get_db: async session dependency
- [x] get_redis: Redis connection dependency
- [x] User not found → 401
- [x] User is_active=False → 403
**depends_on:** [L4/01, L1/02]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
