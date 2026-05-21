### L3-01 — Auth schemas

**Goal:** Pydantic v2 schemas for auth request/response validation.
**Input:** Design doc auth endpoints and request/response examples.
**Output:** `app/schemas/auth.py`
**Done when:** All auth endpoint schemas defined.
**Acceptance criteria:**
- [x] RegisterRequest (nickname, email, password, birth_date?)
- [x] LoginRequest (email, password)
- [x] TokenResponse (access_token, user)
- [x] RefreshResponse (access_token)
- [x] VerifyEmailRequest (token)
- [x] ForgotPasswordRequest (email)
- [x] ResetPasswordRequest (token, new_password)
- [x] ProfileUpdate (nickname?, full_name?, birth_date?)
- [x] UserResponse (id, nickname, email, role, avatar_url, etc.)
- [x] Password validation: min 8 chars, at least 1 digit, 1 uppercase
- [x] Email validation via Pydantic EmailStr
**depends_on:** [L0/01]
**impact:** 5
**complexity:** 1
**risk:** 1
**priority_score:** 11.0
**Est. effort:** S
