### L9-01 — Structlog + request_id middleware

**Goal:** Structured JSON logging with request_id correlation.
**Input:** Design doc "Логирование" section.
**Output:** `app/middleware.py` (request_id + logging middleware)
**Done when:** Every request logged with method, path, status, duration, request_id.
**Acceptance criteria:**
- [x] structlog configured: JSON in production, console in development
- [x] RequestIdMiddleware: generates UUID request_id per request
- [x] LoggingMiddleware: logs method, path, status_code, duration_ms, request_id
- [x] request_id added to response headers (X-Request-ID)
- [x] Slow requests (>1s) logged as WARNING
- [x] Log levels per module as per design doc
**depends_on:** [L0/02]
**impact:** 3
**complexity:** 2
**risk:** 1
**priority_score:** 3.5
**Est. effort:** S
