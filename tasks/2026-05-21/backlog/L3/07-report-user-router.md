### L3-07 — Report + User routers

**Goal:** FastAPI routers for reports and user admin endpoints.
**Input:** Report service (L2-05), schemas (L3-03).
**Output:** `app/routers/reports.py`, `app/routers/users.py`
**Done when:** Report and user admin endpoints functional.
**Acceptance criteria:**
- [x] POST /api/v1/reports/ → user+
- [x] GET /api/v1/reports/ → mod/admin, filter by status
- [x] PATCH /api/v1/reports/{id} → mod/admin
- [x] GET /api/v1/users/ → mod/admin, paginated
- [x] GET /api/v1/users/{id} → mod/admin
- [x] GET /api/v1/users/{id}/toilets → anonymous
- [x] GET /api/v1/users/{id}/reviews → anonymous
- [x] PATCH /api/v1/users/{id}/role → admin
- [x] PATCH /api/v1/users/{id}/status → mod/admin
- [x] DELETE /api/v1/users/{id} → admin
**depends_on:** [L2/05, L3/03]
**impact:** 3
**complexity:** 2
**risk:** 1
**priority_score:** 3.5
**Est. effort:** S
