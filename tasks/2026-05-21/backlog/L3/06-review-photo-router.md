### L3-06 — Review + Photo routers

**Goal:** FastAPI routers for reviews and photo upload/delete.
**Input:** Review service (L2-03), Photo service (L2-04), schemas (L3-02).
**Output:** `app/routers/reviews.py` (also handles photo endpoints)
**Done when:** All review and photo endpoints functional.
**Acceptance criteria:**
- [x] GET /api/v1/toilets/{toilet_id}/reviews/ → anonymous, paginated
- [x] POST /api/v1/toilets/{toilet_id}/reviews/ → user+
- [x] PATCH /api/v1/reviews/{id} → owner
- [x] DELETE /api/v1/reviews/{id} → owner/mod/admin
- [x] POST /api/v1/toilets/{id}/photos → user+, multipart
- [x] DELETE /api/v1/toilets/photos/{id} → owner/mod/admin
- [x] POST /api/v1/reviews/{id}/photos → owner, multipart
- [x] DELETE /api/v1/reviews/photos/{id} → owner/mod/admin
**depends_on:** [L2/03, L2/04, L3/02]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
