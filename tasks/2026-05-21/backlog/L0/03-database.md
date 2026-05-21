### L0-03 — Database connection (app/database.py)

**Goal:** Async SQLAlchemy engine + session factory + base class.
**Input:** Config from L0-02.
**Output:** `app/database.py`
**Done when:** AsyncSession can be created and connected to PostgreSQL.
**Acceptance criteria:**
- [x] create_async_engine with DATABASE_URL
- [x] async_sessionmaker configured
- [x] AsyncSession dependency (get_db) for FastAPI
- [x] DeclarativeBase with UUID mixin
- [x] Common columns mixin (id, created_at, updated_at)
- [x] Proper engine disposal on shutdown
**depends_on:** [L0/02]
**impact:** 5
**complexity:** 2
**risk:** 2
**priority_score:** 6.0
**Est. effort:** S
