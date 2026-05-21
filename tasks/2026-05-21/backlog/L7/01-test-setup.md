### L7-01 — Test setup + conftest + factories

**Goal:** Test infrastructure: fixtures, async test client, DB setup, fakeredis.
**Input:** All models, app configuration.
**Output:** `tests/conftest.py`, `tests/factories.py`
**Done when:** Tests can run with `pytest`, async client works, test DB isolated.
**Acceptance criteria:**
- [x] conftest.py: async test client (httpx AsyncClient with app)
- [x] Test DB: use testcontainers PostGIS or separate test database
- [x] fakeredis for Redis mocking
- [x] Fixtures: db_session, client, test_user, admin_user, auth_headers
- [x] Each test runs in transaction that rolls back (test isolation)
- [x] factories.py: helper functions to create test entities
- [x] pytest.ini or pyproject.toml pytest config
**depends_on:** [L0/05]
**impact:** 4
**complexity:** 3
**risk:** 2
**priority_score:** 3.3
**Est. effort:** M
