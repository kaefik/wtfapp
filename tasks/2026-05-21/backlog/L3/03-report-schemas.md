### L3-03 — Report schemas

**Goal:** Pydantic v2 schemas for report and user admin endpoints.
**Input:** Design doc report and user endpoints.
**Output:** `app/schemas/report.py`, `app/schemas/user.py`
**Done when:** All report/user endpoint schemas defined.
**Acceptance criteria:**
- [x] ReportCreate (target_type, target_id, reason, description?)
- [x] ReportResponse (full report data)
- [x] ReportResolve (status: resolved/rejected)
- [x] UserListResponse (paginated)
- [x] UserRoleUpdate (role)
- [x] UserStatusUpdate (is_active)
- [x] PhotoResponse (id, url, description?)
**depends_on:** [L0/01]
**impact:** 3
**complexity:** 1
**risk:** 1
**priority_score:** 7.0
**Est. effort:** XS
