### L5-04 — Geo utility

**Goal:** Geographic query helpers using PostGIS functions.
**Input:** Design doc toilet search and coordinate handling.
**Output:** `app/utils/geo.py`
**Done when:** Can build nearby query with ST_DWithin, extract lat/lon from geom.
**Acceptance criteria:**
- [x] build_nearby_query(lat, lon, radius_m) → ST_DWithin filter
- [x] compute_distance(lat, lon, geom) → distance in meters
- [x] make_point(lat, lon) → WKBElement for ST_SetSRID(ST_MakePoint)
- [x] extract_lat_lon(geom) → (lat, lon) tuple using ST_Y/ST_X
- [x] All using async-compatible SQLAlchemy/GeoAlchemy2 expressions
**depends_on:** [L0/03, L1/01]
**impact:** 5
**complexity:** 3
**risk:** 3
**priority_score:** 4.3
**Est. effort:** S
