### L2-04 — Photo service

**Goal:** Business logic for photo upload to toilets and reviews with validation.
**Input:** ToiletPhoto/ReviewPhoto models, storage, image utils.
**Output:** `app/services/photo.py`
**Done when:** Photos upload with validation, WebP conversion, thumbnail generation.
**Acceptance criteria:**
- [x] upload_toilet_photo(toilet_id, user_id, file) → validate + process + save
- [x] upload_review_photo(review_id, user_id, file) → same
- [x] Max 10 photos per toilet, max 5 per review
- [x] Validate: magic bytes (JPEG/PNG/WebP), max 5MB
- [x] Convert to WebP, resize if >1920px, generate thumbnail 300x200
- [x] Delete photo (owner/mod/admin for toilet, owner for review)
- [x] Returns photo URL
**depends_on:** [L1/03, L1/04, L5/01, L5/02, L4/02]
**impact:** 4
**complexity:** 3
**risk:** 2
**priority_score:** 3.3
**Est. effort:** S
