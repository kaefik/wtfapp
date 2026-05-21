### L2-05 — Report + User admin services

**Goal:** Business logic for reports and user management (admin/mod).
**Input:** Report model, User model.
**Output:** `app/services/report.py`
**Done when:** Reports CRUD works, user management works.
**Acceptance criteria:**
- [x] create_report(target_type, target_id, reporter_id, reason, description)
- [x] list_reports(status, cursor, limit) → for mod/admin
- [x] resolve_report(id, resolver_id, status) → set resolved_by, resolved_at
- [x] User admin: list_users(search, cursor, limit), get_user(id)
- [x] change_role(user_id, role) → admin only
- [x] change_status(user_id, is_active) → mod/admin
- [x] delete_user(user_id) → admin, cascade as per design doc
**depends_on:** [L1/02, L1/04, L4/02]
**impact:** 3
**complexity:** 2
**risk:** 1
**priority_score:** 3.5
**Est. effort:** S
