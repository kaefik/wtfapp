### L5-03 — Email utility (SMTP)

**Goal:** Async email sending via aiosmtplib with token generation.
**Input:** Design doc "Email отправка" section.
**Output:** `app/utils/email.py`
**Done when:** Can send verification and password reset emails as background tasks.
**Acceptance criteria:**
- [x] send_verification_email(to, token): builds URL, sends HTML email
- [x] send_password_reset_email(to, token): builds URL, sends HTML email
- [x] Uses aiosmtplib for async sending
- [x] SMTP errors: log warning, don't block request
- [x] Token generation: secrets.token_urlsafe(32)
- [x] Email templates as simple HTML strings (no Jinja2 dependency)
- [x] Tokens stored in Redis with TTL (email verification: 24h, password reset: 1h)
**depends_on:** [L0/02]
**impact:** 3
**complexity:** 2
**risk:** 2
**priority_score:** 4.0
**Est. effort:** S
