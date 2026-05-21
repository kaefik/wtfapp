### L0-01 — Project structure + pyproject.toml + dependencies

**Goal:** Initialize Python project with all required dependencies.
**Input:** Design document section "Стек технологий" and "Структура проекта".
**Output:** `pyproject.toml`, `requirements.txt`, empty `app/` package structure.
**Done when:** `pip install -e .` succeeds, all directories created.
**Acceptance criteria:**
- [x] pyproject.toml with all dependencies (fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, geoalchemy2, alembic, pydantic, python-jose[cryptography], bcrypt, redis, pillow, structlog, aiosmtplib, python-multipart)
- [x] requirements.txt generated from pyproject.toml
- [x] Directory structure matches design doc
- [x] All __init__.py files created
**depends_on:** []
**impact:** 5
**complexity:** 1
**risk:** 1
**priority_score:** 11.0
**Est. effort:** S
