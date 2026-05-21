### L5-01 — Storage utility (local filesystem)

**Goal:** File storage abstraction for saving/retrieving/deleting uploaded files.
**Input:** Design doc "Хранение файлов" section.
**Output:** `app/utils/storage.py`
**Done when:** Can save file to disk, generate URL, delete file, create thumbnails.
**Acceptance criteria:**
- [x] save_file(entity_type, entity_id, filename, content) → relative path
- [x] Path format: /{entity_type}/{entity_id}/{uuid}.{ext}
- [x] delete_file(path) → removes from disk
- [x] get_url(path) → full URL with MEDIA_URL prefix
- [x] Creates directories as needed
- [x] Thumbnail path: /{entity_type}/{entity_id}/thumb_{uuid}.{ext}
**depends_on:** [L0/02]
**impact:** 4
**complexity:** 1
**risk:** 1
**priority_score:** 9.0
**Est. effort:** XS
