### L3-02 — Toilet + Review schemas

**Goal:** Pydantic v2 schemas for toilet and review request/response.
**Input:** Design doc toilet and review endpoints.
**Output:** `app/schemas/toilet.py`, `app/schemas/review.py`
**Done when:** All toilet/review endpoint schemas defined with validation.
**Acceptance criteria:**
- [x] ToiletCreate (name, lat, lon, address?, floor?, gender, toilet_type, etc.)
- [x] ToiletUpdate (partial update — all optional except id)
- [x] ToiletResponse (full detail with reviews nested)
- [x] ToiletListItem (for nearby/search list)
- [x] NearbyResponse (items, next_cursor, total)
- [x] OpeningHoursSchema: days mon-sun+hol, array of 2 or 4 "HH:MM" strings
- [x] ReviewCreate (rating 1-5, text?)
- [x] ReviewUpdate (rating?, text?)
- [x] ReviewResponse (with user info, photo_urls)
- [x] Cursor pagination schemas
**depends_on:** [L0/01]
**impact:** 5
**complexity:** 2
**risk:** 1
**priority_score:** 5.5
**Est. effort:** S
