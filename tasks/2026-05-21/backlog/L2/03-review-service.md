### L2-03 — Review service

**Goal:** Business logic for review CRUD with UNIQUE constraint and rating trigger.
**Input:** Review model, ReviewPhoto model.
**Output:** `app/services/review.py`
**Done when:** Reviews CRUD works, UNIQUE(toilet_id, user_id) enforced, trigger fires.
**Acceptance criteria:**
- [x] create_review(toilet_id, user_id, rating, text) → check UNIQUE, create
- [x] update_review(id, user_id, rating, text) → owner only, update updated_at
- [x] delete_review(id, user_id, role) → owner/mod/admin
- [x] list_reviews(toilet_id, cursor, limit) → paginated list
- [x] Duplicate review → 409 Conflict
- [x] Text max 2000 chars
- [x] Rating trigger: on insert/update/delete → recalculate toilet.rating_avg, reviews_count
**depends_on:** [L1/04, L4/02]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
