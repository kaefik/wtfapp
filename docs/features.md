# WTFApp Features

## Backend (MVP — Priority 1)

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
- Registration without email verification (auto is_email_verified=True)
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
- Bcrypt password hashing (direct bcrypt, no passlib)
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

### Initial Migration
- Alembic initial migration with all tables (users, toilets, reviews, photos, reports, favorites)

---

## Frontend (MVP — Priority 1)

### Infrastructure
- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4 with @tailwindcss/vite plugin
- Code splitting (React.lazy + Suspense) для всех страниц
- PWA: vite-plugin-pwa (Service Worker, manifest, offline статики)
- Docker: multi-stage build (node -> nginx)
- MSW (Mock Service Worker) для разработки без бэкенда

### State Management
- Zustand stores: authStore, mapStore, uiStore
- Access token хранится только в памяти (Zustand), не в localStorage
- Refresh через httpOnly cookie (безопасный auth flow)

### API Client
- ky HTTP-клиент с interceptors
- Автоматический refresh при 401 с дедупликацией (promise-based mutex)
- Bearer token авторизация

### Страницы (13 роутов)
- MapPage — карта (Leaflet) + BottomSheet (vaul) + SearchBar + FilterPanel
- ToiletPage — детали туалета + фото-галерея + отзывы
- AddToiletPage — форма добавления/редактирования (Zod валидация)
- SearchPage — текстовый поиск с debounce + недавние запросы
- LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage
- ProfilePage, ProfileEditPage
- FavoritesPage — список избранных туалетов (защищённый роут)
- NotFoundPage (404)

### Компоненты карты
- MapView — Leaflet с OSM тайлами + обработка перемещений
- ToiletMarker — L.divIcon с цветом по рейтингу + иконка по статусу
- ClusterMarkers — кластеризация маркеров при удалении (Supercluster)
- UserLocation — синяя точка + круг точности
- ZoomButtons — кастомные кнопки зума (ZoomIn/ZoomOut) через mapStore
- MapLegend — всплывающая легенда цветов маркеров
- BottomSheet (vaul) — свайпаемый drawer с infinite scroll

### Компоненты туалетов/отзывов
- ToiletCard, ToiletDetail, ToiletForm (react-hook-form + Zod)
- ReviewList (cursor-пагинация), ReviewCard, ReviewForm
- AmenitiesBadges, OpeningHours, RatingStars
- PhotoUploader, PhotoGallery, AvatarUploader

### UI-примитивы
- Button, Input, Select, Modal (Radix Dialog), Toast, Badge
- Loader, Skeleton, EmptyState, ErrorBoundary
- NavBar — нижняя навигация (3 таба: карта, избранное, профиль)

### Избранное
- Добавление/удаление туалета из избранного (toggle)
- Список избранных туалетов с пагинацией
- FavoritesPage — защищённый роут в MapLayout с NavBar

### Desktop Adaptive Layout
- useIsDesktop hook (min-width: 1024px breakpoint)
- DesktopHeader — top nav bar with logo, navigation links, auth state
- SidePanel — left sidebar (w-80) with search, filters, outlet content
- MapLayout desktop mode: header + sidebar + map side-by-side
- FilterPanel compact mode for desktop sidebar
- ToiletListContent — extracted reusable toilet list with infinite scroll
- nearbyStore (Zustand) — shared nearby toilet state (replaces useNearbyToilets hook)
- MapResizeHandler — ResizeObserver to invalidate map on container changes
- Desktop-specific marker click navigation (no popup)
- Hide NavBar on mobile when viewing toilet detail or search page

### Фильтры
- FilterPanel — slide-up модалка (mobile) / compact panel (desktop)
- Фильтры → mapStore → nearbyStore → API запрос

### Обработка ошибок
- Toast-уведомления для всех сценариев (сеть, 401, 403, 404, 410, 429, 500)
- ErrorBoundary для непредвиденных ошибок
- Skeleton loading для всех loading-состояний
