### L1-04 — Review + ReviewPhoto + Confirmation + Report models

**Goal:** Remaining models: Review, ReviewPhoto, Confirmation, Report.
**Input:** Design doc sections for each entity.
**Output:** `app/models/review.py`, `app/models/confirmation.py`, `app/models/report.py`
**Done when:** All models map correctly, constraints in place.
**Acceptance criteria:**
- [x] Review: rating CHECK(1-5), UNIQUE(toilet_id, user_id), FK cascades
- [x] ReviewPhoto: FK to review (CASCADE), max 5 constraint in app logic
- [x] Confirmation: UNIQUE(toilet_id, user_id), FK cascades
- [x] Report: all columns, FK to reporter and resolver
- [x] Proper indexes per design doc
- [x] Updated __init__.py exporting all models
**depends_on:** [L1/01]
**impact:** 5
**complexity:** 2
**risk:** 1
**priority_score:** 5.5
**Est. effort:** S
