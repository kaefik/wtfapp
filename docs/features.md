# WTFApp Backend Features

## MVP (Priority 1)

### Infrastructure
- FastAPI + uvicorn async web framework
- PostgreSQL 16 + PostGIS for geospatial queries
- Redis for caching, refresh tokens, rate limiting
- Docker + docker-compose (app + postgres + redis)
- Alembic async migrations
- structlog JSON structured logging
- Request ID middleware for correlation

### Authentication
- JWT RS256 (access token 15 min, refresh token 30 days via httpOnly cookie)
- Registration with email verification
- Login / Logout with refresh token rotation
- Password reset via email token
- Profile management (nickname, full_name, birth_date, avatar upload)
- Role-based access: admin, moderator, user

### Toilet Management
- CRUD with PostGIS geometry (lat/lon → POINT)
- Soft delete (410 Gone for deleted)
- Hard delete (moderator/admin only)
- Verification by moderator/admin
- Confirmation of actuality by users
- Photo upload (max 10 per toilet, WebP conversion, thumbnails)

### Search
- `/nearby` — geospatial search with ST_DWithin + cursor pagination
- `/search` — text search (ILIKE) with optional distance sorting
- Filters: gender, free/paid, amenities, accessibility, open now
- `is_open_now` computed from opening_hours (cached in Redis 5 min)

### Reviews
- CRUD with UNIQUE(toilet, user) constraint
- Rating 1-5, optional text (max 2000 chars)
- Photo upload (max 5 per review)
- Automatic rating_avg/reviews_count recalculation

### Reports
- Report toilets, reviews, users (fake, inappropriate, spam, outdated, other)
- Moderation queue (list, resolve, reject)

### User Admin
- List users with search
- Change role (admin only)
- Block/unblock users (moderator/admin)
- Delete user with cascade (admin only)

### Security
- Rate limiting: 100/min anonymous, 300/min authenticated (Redis INCR)
- CORS configurable
- Security headers (X-Content-Type-Options, X-Frame-Options)
- Bcrypt password hashing
- httpOnly + SameSite=Lax + Secure cookies

### API
- REST API under `/api/v1/`
- OpenAPI spec at `/openapi.json`, Swagger UI at `/docs`
- Unified error format with error codes
- Anonymous access to search and view
- Cursor-based pagination
- Health check endpoint (`/health`)

### Seed Data
- Demo script with 3 users and 20 toilets in Moscow
