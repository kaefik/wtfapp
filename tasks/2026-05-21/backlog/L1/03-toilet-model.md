### L1-03 — Toilet + ToiletPhoto models

**Goal:** SQLAlchemy Toilet and ToiletPhoto models with PostGIS geometry.
**Input:** Design document "toilets" and "toilet_photos" tables.
**Output:** `app/models/toilet.py`
**Done when:** Models map to tables, GiST index on geom, all fields present.
**Acceptance criteria:**
- [x] Toilet: all columns including geom (Geometry Point 4326)
- [x] GiST index on geom column
- [x] B-tree indexes: created_at, created_by, gender, toilet_type, is_deleted, is_verified
- [x] opening_hours as JSONB
- [x] relationship to photos, reviews, confirmations
- [x] ToiletPhoto: all columns, FK to toilet (CASCADE), FK to user
- [x] lat/lon not stored — computed from geom via ST_Y/ST_X in queries
**depends_on:** [L1/01]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
