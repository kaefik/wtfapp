### L8-01 — Seed demo script

**Goal:** Script to populate DB with 20 demo toilets for testing.
**Input:** All models, database connection.
**Output:** `scripts/seed_demo.py`
**Done when:** Script creates 20 toilets with varied data around Moscow center.
**Acceptance criteria:**
- [x] Creates 3 demo users (admin, moderator, regular)
- [x] Creates 20 toilets with varied locations in Moscow center area
- [x] Varied attributes: different genders, types, free/paid, amenities
- [x] Creates some reviews with ratings
- [x] Uses async SQLAlchemy session
- [x] Idempotent: checks if data exists before inserting
- [x] Can be run: `python -m scripts.seed_demo`
**depends_on:** [L1/05, L0/02]
**impact:** 3
**complexity:** 1
**risk:** 1
**priority_score:** 7.0
**Est. effort:** S
