### L3-05 — Toilet router

**Goal:** FastAPI router for toilet CRUD, nearby, search, verify, confirm.
**Input:** Toilet service (L2-02), schemas (L3-02).
**Output:** `app/routers/toilets.py`
**Done when:** All toilet endpoints functional.
**Acceptance criteria:**
- [x] GET /api/v1/toilets/nearby → anonymous, with all filters
- [x] GET /api/v1/toilets/search → anonymous, text search
- [x] GET /api/v1/toilets/{id} → anonymous, include reviews
- [x] POST /api/v1/toilets/ → user+
- [x] PATCH /api/v1/toilets/{id} → owner/mod/admin
- [x] DELETE /api/v1/toilets/{id} → soft delete, owner/mod/admin
- [x] DELETE /api/v1/toilets/{id}/hard → mod/admin
- [x] POST /api/v1/toilets/{id}/confirm → user+
- [x] PATCH /api/v1/toilets/{id}/verify → mod/admin
- [x] Proper status codes: 201 for create, 410 for soft-deleted, 204 for delete
**depends_on:** [L2/02, L3/02]
**impact:** 5
**complexity:** 3
**risk:** 2
**priority_score:** 4.0
**Est. effort:** M
