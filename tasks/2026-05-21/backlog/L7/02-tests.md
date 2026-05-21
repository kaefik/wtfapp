### L7-02 — Auth + Toilet + Review tests

**Goal:** Integration tests for P1 features: auth flow, toilet CRUD, nearby, reviews.
**Input:** Test setup (L7-01), all services and routers.
**Output:** `tests/test_auth.py`, `tests/test_toilets.py`, `tests/test_reviews.py`, `tests/test_photos.py`, `tests/test_reports.py`
**Done when:** All P1 test scenarios pass.
**Acceptance criteria:**
- [x] test_auth: register, login (cookie!), refresh (rotation), logout, 401/403
- [x] test_toilets: create (lat/lon→geom), update, soft delete, 410 Gone, nearby with filters, search
- [x] test_reviews: CRUD, UNIQUE constraint, rating trigger
- [x] test_photos: upload format/size validation, magic bytes, limit
- [x] test_reports: create, list, resolve
- [x] Tests use async client and test DB
**depends_on:** [L7/01]
**impact:** 4
**complexity:** 3
**risk:** 2
**priority_score:** 3.3
**Est. effort:** L
