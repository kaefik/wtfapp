### L0-04 — Docker + .env.example

**Goal:** Dockerfile, docker-compose.yml, .env.example for development.
**Input:** Design document "Docker" and "Environment Variables" sections.
**Output:** `Dockerfile`, `docker-compose.yml`, `.env.example`, `keys/` directory.
**Done when:** `docker-compose up` starts app + postgres + redis.
**Acceptance criteria:**
- [x] Dockerfile: Python 3.12-slim, install deps, copy app
- [x] docker-compose: app + postgres (postgis:16-3.4) + redis (7-alpine, appendonly yes)
- [x] Healthchecks for postgres and redis
- [x] Volumes for pgdata, redisdata, media
- [x] .env.example with all vars from design doc
- [x] .env.example added to .gitignore (actual .env)
- [x] Generate RSA key pair for JWT in keys/ directory
**depends_on:** [L0/01]
**impact:** 4
**complexity:** 1
**risk:** 1
**priority_score:** 9.0
**Est. effort:** S
