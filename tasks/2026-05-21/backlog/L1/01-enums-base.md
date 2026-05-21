### L1-01 — Enums + base mixins

**Goal:** Define all ENUM types and reusable column mixins.
**Input:** Design document "Сущности и схема БД".
**Output:** `app/models/enums.py`, `app/models/base.py`
**Done when:** All ENUMs importable, Base class ready.
**Acceptance criteria:**
- [x] UserRole enum (admin, moderator, user)
- [x] Gender enum (male, female, unisex, family)
- [x] ToiletType enum (indoor, outdoor, portable)
- [x] PaperType enum (unknown, none, in_cabin, dispenser, both)
- [x] ReportTargetType enum (toilet, review, user)
- [x] ReportReason enum (fake, inappropriate, spam, outdated, other)
- [x] ReportStatus enum (pending, resolved, rejected)
- [x] TimestampMixin (created_at, updated_at with server defaults)
- [x] SQLAlchemy PostGIS Geometry type configured
**depends_on:** [L0/03]
**impact:** 5
**complexity:** 1
**risk:** 1
**priority_score:** 11.0
**Est. effort:** S
