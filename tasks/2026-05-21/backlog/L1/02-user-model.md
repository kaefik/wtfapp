### L1-02 — User model

**Goal:** SQLAlchemy User model with all fields from design doc.
**Input:** Design document "users" table, L1-01 enums.
**Output:** `app/models/user.py`, updated `app/models/__init__.py`
**Done when:** Model maps to users table, all fields + indexes defined.
**Acceptance criteria:**
- [x] All columns from design doc (id UUID PK, nickname, email, password_hash, role, etc.)
- [x] Proper indexes (email UNIQUE, nickname UNIQUE)
- [x] relationships: toilets (created_by), reviews, confirmations, reports
- [x] password_hash uses bcrypt via passlib context
**depends_on:** [L1/01]
**impact:** 5
**complexity:** 1
**risk:** 1
**priority_score:** 11.0
**Est. effort:** S
