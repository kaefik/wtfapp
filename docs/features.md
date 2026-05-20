# WTFApp — Where To Find (Toilet)

Поиск ближайшего туалета с использованием текущего местоположения пользователя.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | Python 3.12+, FastAPI |
| БД | PostgreSQL 16 + PostGIS |
| Кэш / Токены | Redis |
| Миграции | Alembic |
| Валидация | Pydantic v2 |
| Аутентификация | JWT (access + refresh токены, refresh хранятся в Redis) |
| Rate Limiting | slowapi |
| Фронтенд | Веб-приложение (планируется) |
| Карты | Leaflet / Mapbox GL JS (планируется) |
| Контейнеризация | Docker + docker-compose (app + postgres + redis) |

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
| paper_type | ENUM (none, in_cabin, dispenser, both), DEFAULT none | Наличие и расположение туалетной бумаги |
| has_child_toilet | BOOLEAN, DEFAULT false | Есть детский унитаз/писуар |
| has_changing_table | BOOLEAN, DEFAULT false | Есть пеленальный столик |
| is_accessible | BOOLEAN, DEFAULT false | Доступен для маломобильных |
| cabin_count | INTEGER, NULL | Количество кабинок |
| opening_hours | JSONB, NULL | Часы работы (формат: `{"mon": ["09:00","21:00"], ...}`) |
| is_verified | BOOLEAN, DEFAULT false | Проверен модератором |
| last_confirmed_at | TIMESTAMP, NULL | Когда последний раз подтвердили |
| created_by | UUID, FK → users.id | Кто добавил |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

> `is_open_now` — **не хранится в БД**, вычисляется на лету из `opening_hours`. Кэшируется в Redis на 5 минут.

> `paper_type` заменяет отдельное поле `has_paper`: `none` = нет бумаги, остальные значения = есть.

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
- Допустимые форматы: JPEG, PNG, WebP

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

> Позволяет пользователям сообщать о фейковых точках, оскорбительном контенте, спаме.

---

### refresh_tokens — Refresh-токены (хранятся в Redis)

| Ключ Redis | Значение | TTL |
|------------|----------|-----|
| `refresh:{user_id}:{token_jti}` | JSON: `{"device": "..."}` | 30 дней |

> При logout — токен удаляется из Redis. Это гарантирует инвалидацию refresh-токена.

---

## REST API

### Общие правила

- **Анонимный доступ** — поиск туалетов (`/nearby`, `GET /toilets/{id}`) и просмотр отзывов доступны без авторизации
- **Rate limiting** — 100 запросов/мин для анонимов, 300 для авторизованных
- **Пагинация** — cursor-based (используется `cursor` + `limit`, а не `offset`)
- **Soft delete** — удаление туалетов через `is_deleted` (не物理 удаление), для модератора — hard delete

### Аутентификация

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/auth/register` | Регистрация | Аноним |
| POST | `/api/v1/auth/login` | Вход (возвращает access + refresh) | Аноним |
| POST | `/api/v1/auth/refresh` | Обновление access-токена | По refresh |
| POST | `/api/v1/auth/logout` | Выход (инвалидирует refresh) | Авторизованный |
| POST | `/api/v1/auth/verify-email` | Подтверждение email | По токену из письма |
| GET | `/api/v1/auth/me` | Текущий пользователь | Авторизованный |
| PATCH | `/api/v1/auth/me` | Обновить профиль | Авторизованный |
| POST | `/api/v1/auth/me/avatar` | Загрузить аватар | Авторизованный |

### Туалеты (Toilets) — основной ресурс

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/api/v1/toilets/nearby` | Поиск ближайших с фильтрами | **Аноним** |
| GET | `/api/v1/toilets/{id}` | Детали туалета + отзывы | **Аноним** |
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

### Отзывы (Reviews)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/api/v1/toilets/{toilet_id}/reviews/` | Список отзывов | **Аноним** |
| POST | `/api/v1/toilets/{toilet_id}/reviews/` | Создать отзыв | user+ |
| PATCH | `/api/v1/reviews/{id}` | Редактировать отзыв | owner |
| DELETE | `/api/v1/reviews/{id}` | Удалить отзыв | owner, mod, admin |

### Фотографии

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/toilets/{id}/photos` | Загрузить фото туалета (макс. 10) | user+ |
| DELETE | `/api/v1/toilets/photos/{id}` | Удалить фото | owner, mod, admin |
| POST | `/api/v1/reviews/{id}/photos` | Загрузить фото к отзыву (макс. 5) | owner |
| DELETE | `/api/v1/reviews/photos/{id}` | Удалить фото отзыва | owner, mod, admin |

### Жалобы (Reports)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/reports/` | Подать жалобу | user+ |
| GET | `/api/v1/reports/` | Список жалоб (фильтры по status) | mod, admin |
| PATCH | `/api/v1/reports/{id}` | Обработать жалобу | mod, admin |

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

## Структура проекта (бэкенд)

```
wtfapp/
├── alembic/                  # Миграции БД
│   ├── versions/
│   └── env.py
├── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py               # Точка входа FastAPI
│   ├── config.py             # Настройки (pydantic-settings)
│   ├── database.py           # Подключение к БД (SQLAlchemy async)
│   ├── models/               # SQLAlchemy модели
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── toilet.py
│   │   ├── review.py
│   │   ├── confirmation.py
│   │   └── report.py
│   ├── schemas/              # Pydantic схемы (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── toilet.py
│   │   ├── review.py
│   │   └── report.py
│   ├── routers/              # API-роутеры
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── toilets.py
│   │   ├── reviews.py
│   │   ├── reports.py
│   │   └── users.py
│   ├── services/             # Бизнес-логика (создавать по мере необходимости)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── toilet.py
│   │   └── review.py
│   ├── dependencies.py       # Зависимости (get_db, get_current_user, get_optional_user)
│   ├── middleware.py         # Rate limiting
│   └── utils/
│       ├── __init__.py
│       ├── geo.py            # Гео-утилиты (расчёт расстояний)
│       └── storage.py        # Загрузка и хранение файлов
├── scripts/
│   └── seed_osm.py           # Импорт демо-данных из OpenStreetMap
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_toilets.py
│   ├── test_reviews.py
│   └── test_reports.py
├── docker-compose.yml        # app + postgres (PostGIS) + redis
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## Функциональные требования

### Приоритет 1 — MVP

- [ ] Регистрация и авторизация (JWT, refresh в Redis)
- [ ] CRUD туалетов (координаты в самой записи)
- [ ] Поиск ближайших туалетов с фильтрами (PostGIS `ST_DWithin`)
- [ ] Отзывы: создание, редактирование, удаление (только свои)
- [ ] Загрузка фотографий (с лимитами)
- [ ] Роли (admin, moderator, user)
- [ ] Анонимный доступ к поиску и просмотру
- [ ] Rate limiting
- [ ] docker-compose для локальной разработки
- [ ] Скрипт импорта демо-данных из OSM

### Приоритет 2

- [ ] Сущность `locations` (здания) — группировка туалетов в одном здании
- [ ] Подтверждение актуальности туалетов
- [ ] Модерация туалетов (верификация)
- [ ] Жалобы на точки/отзывы/пользователей
- [ ] Часы работы и статус "открыто сейчас" (вычисляемый, кэш в Redis)
- [ ] Средний рейтинг туалета (вычисляемый, materialized view или кэш)
- [ ] Email-верификация

### Приоритет 3

- [ ] Геймификация (бейджи, статистика вклада)
- [ ] Офлайн-кэш (Service Worker)
- [ ] Построение маршрута до туалета
- [ ] QR-коды для проверки/отзыва
- [ ] Тёмная тема
- [ ] i18n (мультиязычность)
- [ ] Soft delete → Hard delete по расписанию (cleanup cron)
