# WTFApp — Where To Find (Toilet)

Поиск ближайшего туалета с использованием текущего местоположения пользователя.

> **Версия 2** — исправлена по результатам критического разбора
> (`plan/2026-05-20-wtfapp-backend-critique.md`).
> Синхронизирована с фронтенд-дизайном v3.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | Python 3.12+, FastAPI |
| БД | PostgreSQL 16 + PostGIS |
| Кэш / Токены | Redis (AOF persistence включён) |
| Миграции | Alembic |
| Валидация | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) + GeoAlchemy2 |
| Аутентификация | JWT RS256 (access в памяти клиента, refresh через httpOnly cookie + Redis) |
| Rate Limiting | Custom middleware на Redis INCR + TTL (async-friendly) |
| Тестирование | pytest + pytest-asyncio + httpx (AsyncClient) + testcontainers (PostGIS) + fakeredis |
| Логирование | structlog (JSON structured logs) |
| Контейнеризация | Docker + docker-compose (app + postgres + redis) |

> **POC до реализации:** spike для проверки GeoAlchemy2 + async SQLAlchemy 2.0 (ST_DWithin, ST_Y, ST_X в async session). Если обнаружатся проблемы — рассмотреть raw SQL через `session.execute(text(...))`.

---

## Сущности и схема БД

### users — Пользователи

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| nickname | VARCHAR(50), UNIQUE | Никнейм |
| full_name | VARCHAR(150), NULL | ФИО |
| email | VARCHAR(255), UNIQUE | Электронная почта |
| birth_date | DATE, NULL | Дата рождения |
| password_hash | VARCHAR(255) | Хеш пароля (bcrypt) |
| role | ENUM (admin, moderator, user) | Роль в системе |
| is_active | BOOLEAN, DEFAULT true | Активен ли аккаунт |
| is_email_verified | BOOLEAN, DEFAULT false | Подтверждён ли email |
| avatar_url | VARCHAR(500), NULL | URL аватара (загружается через API) |
| created_at | TIMESTAMP | Дата регистрации |
| updated_at | TIMESTAMP | Дата последнего обновления |

**Роли:**
- **admin** — полный доступ: CRUD всех сущностей, управление пользователями, модерация
- **moderator** — CRUD туалетов, модерация отзывов, просмотр пользователей
- **user** — добавление туалетов, создание/редактирование/удаление своих отзывов, просмотр данных

---

### toilets — Туалеты (MVP — координаты прямо в туалете)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| name | VARCHAR(255) | Название ("Туалет на вокзале", "Мужской 1 этаж ТЦ Мега") |
| address | VARCHAR(500), NULL | Адрес |
| geom | GEOMETRY(Point, 4326) | Географические координаты (PostGIS) |
| floor | VARCHAR(50), NULL | Этаж / уровень ("1", "-1", "B2") |
| description | TEXT, NULL | Как найти внутри здания |
| location_hint | TEXT, NULL | Описание входа в здание |
| gender | ENUM (male, female, unisex, family) | Пол |
| toilet_type | ENUM (indoor, outdoor, portable) | Тип туалета |
| is_free | BOOLEAN, DEFAULT true | Бесплатный |
| price | DECIMAL(10,2), NULL | Стоимость если платный |
| currency | VARCHAR(3), DEFAULT 'RUB' | Валюта (ISO 4217) |
| has_water | BOOLEAN, DEFAULT false | Есть вода |
| has_hot_water | BOOLEAN, DEFAULT false | Есть горячая вода |
| has_soap | BOOLEAN, DEFAULT false | Есть мыло |
| has_dryer | BOOLEAN, DEFAULT false | Есть сушилка для рук |
| paper_type | ENUM (unknown, none, in_cabin, dispenser, both), DEFAULT unknown | Наличие и расположение туалетной бумаги |
| has_child_toilet | BOOLEAN, DEFAULT false | Есть детский унитаз/писуар |
| has_changing_table | BOOLEAN, DEFAULT false | Есть пеленальный столик |
| is_accessible | BOOLEAN, DEFAULT false | Доступен для маломобильных |
| cabin_count | INTEGER, NULL | Количество кабинок |
| opening_hours | JSONB, NULL | Часы работы (формат: `{"mon": ["09:00","21:00"], ...}`). Валидируется через Pydantic-схему: ключи — дни недели (`mon`–`sun`, `hol` для праздников), значения — массив из 2 или 4 строк `"HH:MM"` (1 или 2 интервала). `"00:00","00:00"` = круглосуточно, `null` = выходной. |
| is_verified | BOOLEAN, DEFAULT false | Проверен модератором |
| is_deleted | BOOLEAN, DEFAULT false | Soft delete (для модератора — hard delete) |
| rating_avg | DECIMAL(2,1), DEFAULT NULL | Средний рейтинг (пересчитывается триггером при изменении отзывов) |
| reviews_count | INTEGER, DEFAULT 0 | Количество отзывов (пересчитывается триггером) |
| last_confirmed_at | TIMESTAMP, NULL | Когда последний раз подтвердили |
| created_by | UUID, FK → users.id, NULL ON DELETE SET NULL | Кто добавил (NULL если пользователь удалён) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

> `is_open_now` — **не хранится в БД**, вычисляется на лету из `opening_hours`. Кэшируется в Redis на 5 минут. Ключ: `is_open:{toilet_id}`, значение: `true`/`false`.

> `paper_type` заменяет отдельное поле `has_paper`: `unknown` = не указано, `none` = нет бумаги, остальные значения = есть.

> **Все запросы к туалетам автоматически фильтруют `is_deleted = false`**, если явно не запрошено иное (модерация).

---

### toilet_photos — Фотографии туалетов

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| toilet_id | UUID, FK → toilets.id, ON DELETE CASCADE | Туалет |
| url | VARCHAR(500) | URL фотографии |
| description | VARCHAR(255), NULL | Подпись к фото |
| uploaded_by | UUID, FK → users.id | Кто загрузил |
| created_at | TIMESTAMP | Дата загрузки |

**Ограничения:**
- Макс. 10 фото на один туалет
- Макс. размер файла: 5 МБ
- Допустимые форматы: JPEG, PNG, WebP (проверяется по magic bytes, не по расширению)

---

### reviews — Отзывы

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| toilet_id | UUID, FK → toilets.id, ON DELETE CASCADE | Туалет |
| user_id | UUID, FK → users.id | Автор |
| rating | SMALLINT, CHECK(1-5) | Оценка от 1 до 5 |
| text | TEXT, NULL | Текст отзыва (может быть только оценка без текста) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата последнего обновления |

**Ограничения:**
- UNIQUE(toilet_id, user_id) — один отзыв на туалет от пользователя
- Макс. длина текста: 2000 символов

---

### review_photos — Фотографии к отзывам

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| review_id | UUID, FK → reviews.id, ON DELETE CASCADE | Отзыв |
| url | VARCHAR(500) | URL фотографии |
| created_at | TIMESTAMP | Дата загрузки |

**Ограничения:**
- Макс. 5 фото на один отзыв
- Макс. размер файла: 5 МБ
- Допустимые форматы: JPEG, PNG, WebP

---

### confirmations — Подтверждения актуальности

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| toilet_id | UUID, FK → toilets.id, ON DELETE CASCADE | Туалет |
| user_id | UUID, FK → users.id | Кто подтвердил |
| is_actual | BOOLEAN | true = всё на месте, false = туалета нет |
| created_at | TIMESTAMP | Дата подтверждения |

**Ограничения:**
- UNIQUE(toilet_id, user_id) — один пользователь подтверждает один туалет один раз
- При повторном подтверждении — UPDATE существующей записи

---

### reports — Жалобы

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| target_type | ENUM (toilet, review, user) | Тип объекта жалобы |
| target_id | UUID | ID объекта |
| reporter_id | UUID, FK → users.id | Кто пожаловался |
| reason | ENUM (fake, inappropriate, spam, outdated, other) | Причина |
| description | TEXT, NULL | Описание жалобы |
| status | ENUM (pending, resolved, rejected), DEFAULT pending | Статус обработки |
| resolved_by | UUID, FK → users.id, NULL | Кто обработал (модератор) |
| created_at | TIMESTAMP | Дата создания |
| resolved_at | TIMESTAMP, NULL | Дата обработки |

---

### refresh_tokens — Refresh-токены (хранятся в Redis)

| Ключ Redis | Значение | TTL |
|------------|----------|-----|
| `refresh:{user_id}:{token_jti}` | JSON: `{"device": "..."}` | 30 дней |

> При logout — токен удаляется из Redis + httpOnly cookie очищается (`Set-Cookie: refresh_token=; Max-Age=0`).

> Максимум 5 одновременных refresh-токенов на пользователя. При превышении — самый старый токен удаляется (FIFO).

> **Refresh token rotation:** при каждом `POST /auth/refresh` старый refresh_token инвалидируется в Redis, новый записывается. Это предотвращает replay-атаки. Если обнаружен повторное использование инвалидированного токена — все refresh-токены пользователя удаляются (принудительный logout на всех устройствах).

---

### Индексы БД

| Таблица | Индекс | Тип | Назначение |
|---------|--------|-----|------------|
| toilets | `idx_toilets_geom` | GiST | Гео-поиск `ST_DWithin` |
| toilets | `idx_toilets_created_at` | B-tree | Сортировка по дате |
| toilets | `idx_toilets_created_by` | B-tree | Туалеты пользователя |
| toilets | `idx_toilets_gender` | B-tree | Фильтр по полу |
| toilets | `idx_toilets_toilet_type` | B-tree | Фильтр по типу |
| toilets | `idx_toilets_is_deleted` | B-tree | Исключение удалённых |
| toilets | `idx_toilets_is_verified` | B-tree | Фильтр верификации |
| reviews | `idx_reviews_toilet_id` | B-tree | Отзывы туалета |
| reviews | `idx_reviews_user_id` | B-tree | Отзывы пользователя |
| reviews | `uniq_review_toilet_user` | UNIQUE | Один отзыв на туалет от пользователя |
| confirmations | `uniq_confirmation_toilet_user` | UNIQUE | Одно подтверждение на туалет от пользователя |
| reports | `idx_reports_status` | B-tree | Фильтр по статусу |
| users | `idx_users_email` | UNIQUE | Поиск по email |
| users | `idx_users_nickname` | UNIQUE | Поиск по никнейму |

---

## REST API

### OpenAPI спецификация

FastAPI автоматически генерирует OpenAPI-спецификацию:
- JSON: `GET /openapi.json`
- Swagger UI: `GET /docs`
- ReDoc: `GET /redoc`

Фронтенд использует `openapi-typescript` для генерации TypeScript-типов из `/openapi.json`. При изменении API-контракта — фронтенд перегенерирует типы.

### Общие правила

- **Анонимный доступ** — поиск туалетов (`/nearby`, `/search`, `GET /toilets/{id}`) и просмотр отзывов доступны без авторизации
- **Rate limiting** — 100 запросов/мин для анонимов, 300 для авторизованных. Реализация: custom async middleware на Redis `INCR` + `EXPIRE` (атомарный, не блокирует event loop)
- **Пагинация** — cursor-based:
  - Для `/nearby` — курсор на `(distance_m, id)` (см. параметры)
  - Для остальных — курсор на `(created_at, id)`, `limit` (по умолч. 20)
  - Формат курсора: base64-кодированный JSON
- **Soft delete** — удаление туалетов через `is_deleted = true` (hard delete только для модератора). При запросе soft-deleted туалета по `GET /toilets/{id}` → `410 Gone`
- **Анти-спам** — лимит 10 туалетов и 20 отзывов в день на пользователя

### Формат ошибок

Все ошибки возвращаются в едином формате:

```json
{
  "detail": "Краткое описание ошибки",
  "code": "VALIDATION_ERROR",
  "fields": [
    {"field": "email", "message": "Invalid email format"}
  ]
}
```

Коды HTTP: `400` (валидация), `401` (не авторизован), `403` (нет прав), `404` (не найдено), `409` (конфликт, напр. дубликат), `410` (удалено, soft-deleted ресурс), `422` (ошибка схемы Pydantic), `429` (rate limit).

### CORS и Security

- CORS: разрешённые origins настраиваются через `CORS_ORIGINS` в `.env` (для разработки — `*`). При credentials (cookie) — `allow_credentials=True` + конкретные origins (не `*`).
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`
- JWT access-токен: RS256, TTL 15 минут. Приватный ключ: `JWT_PRIVATE_KEY` env var (PEM-формат) или `JWT_PRIVATE_KEY_PATH` (путь к файлу)
- JWT refresh-токен: httpOnly cookie, хранится в Redis, TTL 30 дней
- Ротация JWT секретов через версию ключа в payload (`kid`)
- **Фронтенд и API должны быть на одном домене** (same-origin) для корректной работы httpOnly cookie. Nginx проксирует `/api/` на бэкенд.

### Health Check

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/health` | Проверка доступности API + БД + Redis. Возвращает `{"status": "ok", "db": true, "redis": true}` |

### Аутентификация

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/auth/register` | Регистрация → `Set-Cookie: refresh_token` + JSON `{ access_token, user }` | Аноним |
| POST | `/api/v1/auth/login` | Вход → `Set-Cookie: refresh_token` + JSON `{ access_token, user }` | Аноним |
| POST | `/api/v1/auth/refresh` | Обновление access-токена (читает refresh_token из cookie, rotation: старый инвалидируется, новый cookie) | По refresh cookie |
| POST | `/api/v1/auth/logout` | Выход (инвалидирует refresh в Redis, очищает cookie) | Авторизованный |
| POST | `/api/v1/auth/verify-email` | Подтверждение email (`{ token }`) | По токену из письма |
| POST | `/api/v1/auth/forgot-password` | Запрос сброса пароля (отправляет письмо с токеном через background task) | Аноним |
| POST | `/api/v1/auth/reset-password` | Сброс пароля (`{ token, new_password }`) | По токену из письма |
| GET | `/api/v1/auth/me` | Текущий пользователь | Авторизованный |
| PATCH | `/api/v1/auth/me` | Обновить профиль | Авторизованный |
| POST | `/api/v1/auth/me/avatar` | Загрузить аватар (`multipart/form-data`, поле `file`) | Авторизованный |

**httpOnly cookie параметры:**
```
Set-Cookie: refresh_token={value}; HttpOnly; SameSite=Lax; Path=/api/v1/auth; Secure
```
- `Secure` — только в production (определяется по `ENVIRONMENT` env var)
- `SameSite=Lax` — позволяет навигацию по ссылкам, но защищает от CSRF
- `Path=/api/v1/auth` — cookie отправляется только на auth-эндпоинты

**Email отправка:**
- MVP: FastAPI `BackgroundTasks` + SMTP (aiosmtplib)
- Retry: при ошибке SMTP — логировать warning, не блокировать запрос (токен уже создан)
- Production: рассмотреть Celery + очередь

---

### Туалеты (Toilets) — основной ресурс

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/api/v1/toilets/nearby` | Поиск ближайших с фильтрами | **Аноним** |
| GET | `/api/v1/toilets/search` | Текстовый поиск по названию/адресу | **Аноним** |
| GET | `/api/v1/toilets/{id}` | Детали туалета + последние отзывы | **Аноним** |
| POST | `/api/v1/toilets/` | Добавить туалет | user+ |
| PATCH | `/api/v1/toilets/{id}` | Обновить данные | owner, mod, admin |
| DELETE | `/api/v1/toilets/{id}` | Soft delete | owner, mod, admin |
| DELETE | `/api/v1/toilets/{id}/hard` | Hard delete | mod, admin |
| POST | `/api/v1/toilets/{id}/confirm` | Подтвердить актуальность | user+ |
| PATCH | `/api/v1/toilets/{id}/verify` | Верифицировать (модерация) | mod, admin |

**Параметры `/nearby`:**
- `lat`, `lon` (обязательные) — координаты пользователя
- `radius` — радиус в метрах (по умолч. 1000, макс. 10000)
- `gender` — male / female / unisex / family
- `is_free` — true / false
- `has_water`, `has_hot_water`, `has_soap`, `has_dryer`
- `paper_type` — none / in_cabin / dispenser / both
- `has_child_toilet`, `has_changing_table`, `is_accessible`
- `toilet_type` — indoor / outdoor / portable
- `is_open_now` — true (показать только открытые сейчас)
- `min_rating` — минимальный средний рейтинг
- `limit` — количество результатов (по умолч. 20, макс. 50)
- `cursor` — курсор для пагинации: base64 `{"distance_m": 150.5, "id": "uuid"}`

**Параметры `/search`:**
- `q` (обязательное, мин. 3 символа) — поисковый запрос (PostgreSQL `ts_vector` полнотекстовый поиск с fallback на `ILIKE`)
- `lat`, `lon` (опциональные) — если указаны, результаты сортируются по расстоянию
- `limit` — количество результатов (по умолч. 20, макс. 50)
- `cursor` — курсор для пагинации

**Ответ `/nearby`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Мужской 1 этаж ТЦ Мега",
      "distance_m": 150.5,
      "lat": 55.75,
      "lon": 37.61,
      "address": "ул. Ленина, 15",
      "floor": "1",
      "gender": "male",
      "is_free": true,
      "is_open_now": true,
      "rating_avg": 4.2,
      "reviews_count": 15,
      "last_confirmed_at": "2026-05-18T10:00:00Z",
      "photo_urls": ["https://..."]
    }
  ],
  "next_cursor": "eyJpZCI6IjEyMyJ9",
  "total": 5
}
```

> `lat`/`lon` в ответе вычисляются из `geom` через `ST_Y(geom)` / `ST_X(geom)`.

**Request body `POST /api/v1/toilets/`:**
```json
{
  "name": "Туалет на вокзале",
  "lat": 55.7558,
  "lon": 37.6173,
  "address": "ул. Ленина, 15",
  "floor": "1",
  "description": "Направо от главного входа, 20 метров",
  "location_hint": "Вход со стороны платформы 3",
  "gender": "male",
  "toilet_type": "indoor",
  "is_free": true,
  "price": null,
  "has_water": true,
  "has_hot_water": false,
  "has_soap": true,
  "has_dryer": false,
  "paper_type": "dispenser",
  "has_child_toilet": false,
  "has_changing_table": false,
  "is_accessible": true,
  "cabin_count": 3,
  "opening_hours": {
    "mon": ["06:00", "23:00"],
    "tue": ["06:00", "23:00"],
    "wed": ["06:00", "23:00"],
    "thu": ["06:00", "23:00"],
    "fri": ["06:00", "23:00"],
    "sat": ["08:00", "22:00"],
    "sun": ["08:00", "22:00"]
  }
}
```

> Координаты передаются как `lat`/`lon`, бэкенд конвертирует в `geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)`.

**Ответ `GET /api/v1/toilets/{id}`:**
```json
{
  "id": "uuid",
  "name": "Туалет на вокзале",
  "lat": 55.7558,
  "lon": 37.6173,
  "address": "ул. Ленина, 15",
  "floor": "1",
  "description": "Направо от главного входа, 20 метров",
  "location_hint": "Вход со стороны платформы 3",
  "gender": "male",
  "toilet_type": "indoor",
  "is_free": true,
  "price": null,
  "currency": "RUB",
  "has_water": true,
  "has_hot_water": false,
  "has_soap": true,
  "has_dryer": false,
  "paper_type": "dispenser",
  "has_child_toilet": false,
  "has_changing_table": false,
  "is_accessible": true,
  "cabin_count": 3,
  "opening_hours": { "mon": ["06:00", "23:00"], "..." },
  "is_open_now": true,
  "is_verified": false,
  "rating_avg": 4.2,
  "reviews_count": 15,
  "last_confirmed_at": "2026-05-18T10:00:00Z",
  "photo_urls": ["https://..."],
  "created_by": "uuid",
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-15T12:00:00Z",
  "reviews": {
    "items": [
      {
        "id": "uuid",
        "user": { "id": "uuid", "nickname": "ivan", "avatar_url": null },
        "rating": 5,
        "text": "Чисто, есть бумага",
        "photo_urls": [],
        "created_at": "2026-05-10T08:00:00Z"
      }
    ],
    "next_cursor": "eyJ...",
    "total": 15
  }
}
```

> Вложенные отзывы: первые 5 (по `created_at` DESC). Полный список — через `GET /toilets/{id}/reviews/`.

---

### Отзывы (Reviews)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/api/v1/toilets/{toilet_id}/reviews/` | Список отзывов (cursor пагинация) | **Аноним** |
| POST | `/api/v1/toilets/{toilet_id}/reviews/` | Создать отзыв | user+ |
| PATCH | `/api/v1/reviews/{id}` | Редактировать отзыв | owner |
| DELETE | `/api/v1/reviews/{id}` | Удалить отзыв | owner, mod, admin |

**Request body `POST /reviews/`:**
```json
{
  "rating": 4,
  "text": "Нормально, но нет сушилки"
}
```

> Фото к отзыву загружаются отдельно через `POST /reviews/{id}/photos`.

---

### Фотографии

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/toilets/{id}/photos` | Загрузить фото туалета (макс. 10). Один файл за запрос: `multipart/form-data`, поле `file` | user+ |
| DELETE | `/api/v1/toilets/photos/{id}` | Удалить фото | owner, mod, admin |
| POST | `/api/v1/reviews/{id}/photos` | Загрузить фото к отзыву (макс. 5). Один файл: `multipart/form-data`, поле `file` | owner |
| DELETE | `/api/v1/reviews/photos/{id}` | Удалить фото отзыва | owner, mod, admin |

**Обработка изображений на сервере:**
1. Валидация: magic bytes (Pillow `Image.open()`) — не доверять расширению
2. Валидация: макс. размер 5 МБ (проверять до загрузки в память — `UploadFile.size` или header `Content-Length`)
3. Конвертация: если формат не WebP → конвертировать в WebP (Pillow)
4. Ресайз: если любая сторона > 1920px → пропорциональный ресайз
5. Thumbnail: генерировать 300x200 для списков (хранить как `thumb_{filename}`)
6. Сохранить оригинал + thumbnail

---

### Жалобы (Reports)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/reports/` | Подать жалобу | user+ |
| GET | `/api/v1/reports/` | Список жалоб (фильтры по status) | mod, admin |
| PATCH | `/api/v1/reports/{id}` | Обработать жалобу | mod, admin |

---

### Пользователи (admin/moderator)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/api/v1/users/` | Список (пагинация, поиск) | mod, admin |
| GET | `/api/v1/users/{id}` | Профиль пользователя | mod, admin |
| GET | `/api/v1/users/{id}/toilets` | Туалеты пользователя | **Аноним** |
| GET | `/api/v1/users/{id}/reviews` | Отзывы пользователя | **Аноним** |
| PATCH | `/api/v1/users/{id}/role` | Изменить роль | admin |
| PATCH | `/api/v1/users/{id}/status` | Заблокировать/разблокировать | mod, admin |
| DELETE | `/api/v1/users/{id}` | Удалить пользователя | admin |

---

### Хранение файлов

- **MVP:** локальная файловая система (`/media/photos/`), раздача через FastAPI static files. Docker volume mount: `./media:/app/media` (данные переживают перезапуск контейнера).
- **Production:** S3-совместимое хранилище (MinIO в Docker / внешний S3)
- Путь файла: `/{entity_type}/{entity_id}/{uuid}.{ext}` (напр. `/toileets/abc123/def456.webp`)
- Путь thumbnail: `/{entity_type}/{entity_id}/thumb_{uuid}.{ext}`
- Формат URL: `{BASE_URL}/media/{path}`
- **Очистка orphaned файлов:** cron task (Priority 3) — удалять файлы, на которые нет ссылок в БД

---

### Удаление аккаунта

При удалении пользователя (admin или сам пользователь):
- Туалеты, созданные пользователем: `created_by` → `NULL` (туалеты остаются)
- Отзывы пользователя: удаляются (cascade), `rating_avg` / `reviews_count` пересчитываются триггером
- Фото туалетов пользователя: остаются (туалет не должен терять фото)
- Фото отзывов пользователя: удаляются вместе с отзывами (cascade)

---

## Тестирование

### Стек

| Компонент | Инструмент |
|-----------|-----------|
| Test runner | pytest + pytest-asyncio |
| HTTP client | httpx AsyncClient (FastAPI TestClient async) |
| БД | testcontainers-python (PostGIS контейнер) — для geo-запросов. Альтернатива: локальный PostGIS в docker-compose test profile |
| Redis | fakeredis (async) |
| Фикстуры | factory-boy или ручные fixtures |
| Покрытие | pytest-cov, минимальный порог: 70% |

### Что тестировать

| Модуль | Приоритет | Что проверять |
|--------|-----------|---------------|
| Auth flow | P1 | Регистрация, логин (cookie!), refresh (rotation), logout, 401/403 |
| CRUD туалетов | P1 | Создание (lat/lon → geom), обновление, soft delete, 410 Gone |
| `/nearby` | P1 | Гео-поиск, фильтры, cursor-пагинация, is_deleted=false |
| `/search` | P1 | Полнотекстовый поиск, мин. длина q, сортировка |
| Отзывы | P1 | CRUD, UNIQUE constraint, триггер rating_avg |
| Фото upload | P1 | Формат, размер, magic bytes, лимит |
| Роли | P2 | admin/moderator/user доступ к эндпоинтам |
| Rate limiting | P2 | Redis INCR, 429 при превышении |
| Триггер rating | P2 | INSERT/UPDATE/DELETE отзыва → пересчёт |

### CI

```yaml
# .github/workflows/test.yml (минимальный)
test:
  - lint: ruff check
  - typecheck: mypy (опционально)
  - test: pytest --cov=app --cov-fail-under=70
  - services: postgres (postgis/postgis:16-3.4) + redis
```

---

## Логирование

- **structlog** — JSON structured logs для production, dev-friendly console для разработки
- Каждый запрос логируется: `method`, `path`, `status_code`, `duration_ms`, `request_id` (UUID, генерируется middleware)
- `request_id` пробрасывается в Sentry (фронтенд) для корреляции ошибок
- Медленные запросы (> 1 сек): WARNING с полным query info
- Уровни: `app.routers` = INFO, `app.services` = DEBUG, `sqlalchemy.engine` = WARNING (production)

---

## Структура проекта (бэкенд)

```
wtfapp/
├── alembic/
│   ├── versions/
│   └── env.py
├── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── toilet.py
│   │   ├── review.py
│   │   ├── confirmation.py
│   │   └── report.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── toilet.py
│   │   ├── review.py
│   │   └── report.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── toilets.py
│   │   ├── reviews.py
│   │   ├── reports.py
│   │   └── users.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── toilet.py
│   │   └── review.py
│   ├── dependencies.py
│   ├── middleware.py
│   └── utils/
│       ├── __init__.py
│       ├── geo.py
│       ├── storage.py
│       ├── image.py
│       └── email.py
├── scripts/
│   └── seed_demo.py
├── tests/
│   ├── conftest.py
│   ├── factories.py
│   ├── test_auth.py
│   ├── test_toilets.py
│   ├── test_reviews.py
│   ├── test_photos.py
│   └── test_reports.py
├── .github/
│   └── workflows/
│       └── test.yml
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## Environment Variables

### `.env.example`

```env
# Application
APP_NAME=WTFApp
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=change-me-in-production

# Database
DATABASE_URL=postgresql+asyncpg://wtfapp:wtfapp@localhost:5432/wtfapp

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_TTL_MINUTES=15
JWT_REFRESH_TOKEN_TTL_DAYS=30

# CORS (comma-separated origins, * for dev)
CORS_ORIGINS=*

# SMTP (email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@wtfapp.com

# Storage
MEDIA_ROOT=./media
MEDIA_URL=/media/
# S3 (production)
# S3_ENDPOINT=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_BUCKET=wtfapp

# Rate Limiting
RATE_LIMIT_ANONYMOUS=100/minute
RATE_LIMIT_AUTHENTICATED=300/minute
```

---

## Docker

### docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./media:/app/media
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: wtfapp
      POSTGRES_USER: wtfapp
      POSTGRES_PASSWORD: wtfapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wtfapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

> Redis: `appendonly yes` — AOF persistence для сохранения refresh-токенов при перезапуске.

---

## Приоритеты

> Синхронизировано с фронтенд-дизайном v3.

### Приоритет 1 — MVP

- [ ] Проект: FastAPI + структура папок + docker-compose + .env.example
- [ ] БД: SQLAlchemy модели + Alembic миграции + PostGIS + GiST индекс
- [ ] Auth: регистрация, логин (httpOnly cookie refresh), refresh (rotation), logout
- [ ] Auth: email-верификация (`verify-email`), password reset (`forgot-password` + `reset-password`)
- [ ] CRUD туалетов: создание (lat/lon → geom), чтение, обновление, soft delete (410 Gone)
- [ ] Поиск ближайших туалетов: `/nearby` с фильтрами + cursor-пагинация (PostGIS `ST_DWithin`)
- [ ] Текстовый поиск: `/search` (ts_vector + ILIKE fallback, мин. 3 символа)
- [ ] Отзывы: CRUD + UNIQUE constraint + триггер rating_avg/reviews_count
- [ ] Загрузка фотографий: валидация (magic bytes + размер) + Pillow (WebP конвертация + ресайз + thumbnail)
- [ ] Роли (admin, moderator, user) + `dependencies.py` (get_current_user, get_optional_user)
- [ ] Анонимный доступ к поиску и просмотру
- [ ] Rate limiting: custom async middleware на Redis
- [ ] Обработка ошибок: единый формат + HTTP коды (400-429)
- [ ] Логирование: structlog JSON + request_id middleware
- [ ] Скрипт `seed_demo.py` — 20 тестовых туалетов (SQL INSERT, не OSM импорт)

### Приоритет 2

- [ ] Сущность `locations` (здания) — группировка туалетов в одном здании
- [ ] Подтверждение актуальности туалетов (`/confirm`)
- [ ] Модерация туалетов (верификация, `/verify`)
- [ ] Жалобы на точки/отзывы/пользователей
- [ ] Upload аватара (`POST /auth/me/avatar`)
- [ ] CI: GitHub Actions (lint + test + coverage)
- [ ] Тесты: роли, rate limiting, триггер rating

### Приоритет 3

- [ ] Геймификация (бейджи, статистика вклада)
- [ ] Офлайн-кэш (Service Worker)
- [ ] Построение маршрута до туалета
- [ ] QR-коды для проверки/отзыва
- [ ] Тёмная тема
- [ ] i18n (мультиязычность)
- [ ] Soft delete → Hard delete по расписанию (cleanup cron)
- [ ] Очистка orphaned файлов (cron task)
- [ ] S3 storage для production
- [ ] Skript `seed_osm.py` — импорт из OpenStreetMap (Overpass API)
