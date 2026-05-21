### L5-02 — Image processing utility

**Goal:** Image validation, WebP conversion, resize, thumbnail generation using Pillow.
**Input:** Design doc "Фотографии" processing pipeline.
**Output:** `app/utils/image.py`
**Done when:** Upload validated (magic bytes, size), converted to WebP, resized, thumb generated.
**Acceptance criteria:**
- [x] validate_image(UploadFile): check magic bytes (JPEG/PNG/WebP), max 5MB
- [x] convert_to_webp(image_data) → WebP bytes
- [x] resize_if_needed(image_data, max_dim=1920) → resized if needed
- [x] generate_thumbnail(image_data, 300x200) → thumbnail bytes
- [x] Invalid format → raise ValidationError
- [x] Uses Pillow Image.open() for validation (not file extension)
**depends_on:** [L0/01]
**impact:** 4
**complexity:** 2
**risk:** 1
**priority_score:** 4.5
**Est. effort:** S
