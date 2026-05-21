# Execution Guide — WTFApp Backend

Generated: 2026-05-21

## Project Context

REST API бэкенд для сервиса поиска ближайших туалетов. Пользователи могут искать туалеты по геолокации, добавлять новые точки, оставлять отзывы, загружать фото. Анонимный доступ к поиску. Роли: admin, moderator, user.

## Tech Stack

- Language: Python 3.12+
- Framework: FastAPI
- DB: PostgreSQL 16 + PostGIS + SQLAlchemy 2.0 (async) + GeoAlchemy2
- Cache/Tokens: Redis
- Migrations: Alembic
- Auth: JWT RS256 (access + refresh via httpOnly cookie)
- Validation: Pydantic v2
- Testing: pytest + pytest-asyncio + httpx + testcontainers + fakeredis
- Logging: structlog (JSON structured logs)
- Containers: Docker + docker-compose

## Execution Style

execution_style: careful

## Code Conventions

- Async everywhere (async def, await, AsyncSession)
- Type hints on all functions
- Pydantic v2 models for schemas (model_config = ConfigDict)
- SQLAlchemy 2.0 mapped_column style
- No comments unless requested
- Russian language for responses per AGENTS.md
- UUID primary keys
- snake_case for Python, camelCase for JSON fields (if needed)

## Output Format Rules (for LLM)

- Always return complete files, never diffs or partial code
- Always include all imports
- No TODO comments, no placeholders
- Follow the exact Output and Done-when from each task card

## Error Handling Convention

Unified error format:
```json
{
  "detail": "Error description",
  "code": "ERROR_CODE",
  "fields": [{"field": "name", "message": "issue"}]
}
```

HTTP codes: 400, 401, 403, 404, 409, 410, 422, 429

## Environment Variables

See `.env.example` in design document. Key vars:
- DATABASE_URL, REDIS_URL
- JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH
- CORS_ORIGINS, SECRET_KEY
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- MEDIA_ROOT, MEDIA_URL

## Design Document

Full design: `plan/2026-05-20-wtfapp-backend-design.md`
