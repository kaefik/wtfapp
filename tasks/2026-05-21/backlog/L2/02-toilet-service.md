### L2-02 — Toilet service

**Goal:** Business logic for toilet CRUD, nearby search, text search, verify, confirm.
**Input:** Toilet model, geo utility, storage utility.
**Output:** `app/services/toilet.py`
**Done when:** All toilet operations work including geo queries and filters.
**Acceptance criteria:**
- [x] create_toilet(data, user_id) → lat/lon → geom, save
- [x] get_toilet(id) → full details + last 5 reviews + is_open_now computed
- [x] update_toilet(id, data, user) → check ownership/role, update
- [x] soft_delete_toilet(id, user) → is_deleted=True (owner/mod/admin)
- [x] hard_delete_toilet(id) → actual DELETE (mod/admin only)
- [x] nearby(lat, lon, radius, filters, cursor, limit) → ST_DWithin + filters + pagination
- [x] search(q, lat, lon, cursor, limit) → ts_vector + ILIKE fallback
- [x] verify_toilet(id) → is_verified=True (mod/admin)
- [x] confirm_toilet(id, user_id, is_actual) → upsert confirmation
- [x] is_open_now computed from opening_hours (cached in Redis 5 min)
- [x] Soft-deleted toilet access → 410 Gone
- [x] Cursor-based pagination for nearby (distance_m, id) and list (created_at, id)
**depends_on:** [L1/03, L5/04, L5/01, L4/02]
**impact:** 5
**complexity:** 4
**risk:** 4
**priority_score:** 3.5
**Est. effort:** L
