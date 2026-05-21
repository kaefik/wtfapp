### L1-05 — Alembic setup + initial migration

**Goal:** Configure Alembic for async migrations, generate initial migration.
**Input:** All models from L1-02 to L1-04.
**Output:** `alembic.ini`, `alembic/env.py`, `alembic/versions/001_initial.py`
**Done when:** `alembic upgrade head` creates all tables with PostGIS extension.
**Acceptance criteria:**
- [x] alembic.ini configured with async database URL
- [x] alembic/env.py: async engine, import all models, create PostGIS extension
- [x] Initial migration: CREATE EXTENSION postgis, all tables, all indexes
- [x] Migration includes GiST index on toilets.geom
- [x] Seed: create ENUM types in PostgreSQL
- [x] rating_avg/reviews_count trigger function (after insert/update/delete on reviews)
**depends_on:** [L1/02, L1/03, L1/04]
**impact:** 5
**complexity:** 3
**risk:** 3
**priority_score:** 4.3
**Est. effort:** M
