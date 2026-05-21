### L6-01 — Error handling + exception handlers

**Goal:** Unified error response format + custom exception classes + FastAPI exception handlers.
**Input:** Design doc "Формат ошибок" section.
**Output:** `app/exceptions.py`
**Done when:** All errors returned in unified format, custom exceptions for business logic.
**Acceptance criteria:**
- [x] AppError base class (status_code, detail, code, fields)
- [x] Specific exceptions: NotFoundError, ForbiddenError, ConflictError, GoneError, RateLimitError, ValidationError
- [x] FastAPI exception handler for AppError → unified JSON response
- [x] Handler for RequestValidationError (Pydantic) → same format
- [x] Handler for SQLAlchemy IntegrityError → 409 Conflict
- [x] All handlers registered in app setup
**depends_on:** [L0/01]
**impact:** 4
**complexity:** 2
**risk:** 1
**priority_score:** 4.5
**Est. effort:** S
