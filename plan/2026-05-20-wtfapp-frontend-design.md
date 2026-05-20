# WTFApp — Frontend Design

Мобильный-first PWA для поиска ближайших туалетов. React + Leaflet + Tailwind.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Фреймворк | React 18 + TypeScript |
| Сборка | Vite 6 |
| Стили | Tailwind CSS 4 |
| State | Zustand |
| Карты | React Leaflet + OpenStreetMap |
| HTTP-клиент | ky |
| Роутинг | React Router 7 |
| PWA | vite-plugin-pwa (Service Worker, manifest, offline) |
| Формы | React Hook Form + Zod (валидация) |
| UI-примитивы | Headless UI + кастомные на Tailwind |
| Иконки | Lucide React |
| Контейнеризация | Nginx (production), Vite dev server (development) |

---

## Архитектура UX

**Подход:** Карта — главный экран. Карта занимает весь экран, сверху — SearchBar, снизу — свайпаемый BottomSheet со списком туалетов. Навигация — NavBar внизу (3 таба).

---

## Страницы и навигация

### Роуты

| Роут | Страница | Доступ | Описание |
|------|----------|--------|----------|
| `/` | MapPage | Аноним | Главный экран — карта + BottomSheet |
| `/search` | SearchPage | Аноним | Текстовый поиск по названию/адресу |
| `/toilets/:id` | ToiletPage | Аноним | Детали туалета + отзывы + фото |
| `/toilets/new` | AddToiletPage | user+ | Добавить туалет |
| `/toilets/:id/edit` | AddToiletPage | owner/mod | Редактировать туалет |
| `/login` | LoginPage | Аноним | Вход |
| `/register` | RegisterPage | Аноним | Регистрация |
| `/forgot-password` | ForgotPasswordPage | Аноним | Сброс пароля |
| `/profile` | ProfilePage | user+ | Профиль + мои туалеты + мои отзывы |
| `/profile/edit` | ProfileEditPage | user+ | Редактировать профиль |
| `*` | NotFoundPage | — | 404 |

### NavBar (нижняя навигация)

1. **Карта** (`/`) — иконка map-pin
2. **Избранное** (Priority 2, пока заглушка) — иконка heart
3. **Профиль** (`/profile` или `/login` если не авторизован) — иконка user

### Потоки пользователя

**Найти туалет рядом:**
```
Открыл приложение → Geolocation API → GET /nearby?lat=X&lon=Y
→ Маркеры на карте + список в BottomSheet
→ Тап на маркер/карточку → /toilets/:id
→ Фото, удобства, часы, отзывы, рейтинг
```

**Добавить туалет:**
```
FAB "+" на карте → /toilets/new
→ Мини-карта для выбора точки (тап по карте)
→ Форма: название, адрес, тип, удобства, фото
→ POST /api/v1/toilets/ → редирект на /toilets/:id
```

**Оставить отзыв:**
```
На странице туалета → «Написать отзыв»
→ Если не авторизован → /login → обратно на /toilets/:id
→ Форма: рейтинг (звёзды), текст, фото
→ POST /api/v1/toilets/:id/reviews/
```

---

## Компоненты карты

### MapView.tsx
- Leaflet контейнер на весь экран
- Слои: тайлы OSM + маркеры + кластеры + геолокация
- Реагирует на `mapStore` (центр, зум, фильтры)
- При перемещении карты → debounce 500ms → `/nearby` с координатами центра
- FAB-кнопки: геолокация (левый нижний угол), добавить туалет (правый нижний угол)

### ToiletMarker.tsx
- Иконка зависит от `toilet_type` (indoor / outdoor / portable)
- Цвет по рейтингу: зелёный (≥4), жёлтый (3–3.9), красный (<3), серый (нет отзывов)
- Popup при тапе: мини-карточка (название, рейтинг, расстояние, «Открыто»/«Закрыто»)
- Тап по popup → `/toilets/:id`

### ClusterMarkers.tsx
- `react-leaflet-cluster` для группировки при зуме < 14
- Число внутри = количество туалетов
- Тап → зум к области

### UserLocation.tsx
- `navigator.geolocation.watchPosition` → синяя точка + круг точности
- Кнопка «центрировать» → анимация к текущей позиции
- Если геолокация недоступна → запросить разрешение, fallback: город по умолчанию

### BottomSheet — состояния

| Состояние | Описание |
|-----------|----------|
| **COLLAPSED** | Только заголовок «Рядом: N туалетов». Свайп вверх → HALF. |
| **HALF** (по умолч.) | Заголовок + 2–3 карточки видны. Свайп вверх → FULL, вниз → COLLAPSED. |
| **FULL** | Полный список + cursor-пагинация. Свайп вниз → HALF. |

### FilterPanel

Slide-up модалка, вызывается из SearchBar (иконка фильтра):

- Пол: [Все] [М] [Ж] [Унисекс]
- Бесплатный: toggle
- Удобства: вода, мыло, сушилка, бумага, доступный, детский, пеленальный
- Открыто сейчас: toggle
- Мин. рейтинг: звёзды
- Тип: [Все] [Внутри] [Снаружи] [Портативный]

Фильтры → `mapStore.filters` → `useNearbyToilets` → новый запрос к API.

---

## Страницы — детальный дизайн

### MapPage (`/`)

Главный экран. Карта + SearchBar + BottomSheet + NavBar.

**Состояния BottomSheet:**
- Загрузка геолокации → «Определение location...»
- 0 результатов → «Туалетов поблизости нет» + кнопка «Добавить туалет»
- Есть результаты → список ToiletCard с расстоянием и рейтингом

### SearchPage (`/search`)

- Роут: `/search?q=...&lat=&lon=`
- `q` → debounce 300ms → `GET /api/v1/toilets/search`
- Если `lat/lon` переданы — сортировка по расстоянию, иначе — по релевантности
- Недавние запросы из localStorage

### ToiletPage (`/toilets/:id`)

- Фото-галерея (горизонтальный свайп, тап → fullscreen)
- Название, адрес, этаж, статус «Открыто/Закрыто»
- Рейтинг + количество отзывов
- Бейджи удобств (AmenitiesBadges)
- Часы работы (OpeningHours)
- Описание «как найти»
- Кнопка «Подтвердить актуальность»
- Список отзывов с пагинацией + фото
- Кнопка «Написать отзыв» (только для авторизованных)
- Кнопки «Редактировать» / «Удалить» (только для owner/moderator/admin)

### AddToiletPage (`/toilets/new`, `/toilets/:id/edit`)

- Мини-карта (Leaflet) для выбора координат — тап = маркер
- Форма: название, адрес, этаж, пол, тип, платный/бесплатный, цена
- Чекбоксы удобств, выпадающий список `paper_type`
- Текстовое поле «Описание (как найти)»
- Загрузка фото (макс. 10) с превью
- Валидация через Zod (схема = Pydantic-схема бэкенда)
- При редактировании — форма предзаполнена

### LoginPage (`/login`)

- Email + пароль + кнопка «Войти»
- Ссылка «Забыли пароль?» → `/forgot-password`
- Ссылка «Зарегистрироваться» → `/register`

### RegisterPage (`/register`)

- Никнейм, email, пароль (мин. 8 символов)
- Ссылка «Уже есть аккаунт? Войти»

### ProfilePage (`/profile`)

- Аватар + никнейм + email
- Статистика вклада: туалетов добавлено, отзывов, подтверждений
- «Мои туалеты» → `GET /api/v1/users/:id/toilets`
- «Мои отзывы» → `GET /api/v1/users/:id/reviews`
- Кнопка «Выйти»

---

## API-клиент

### ky instance (src/api/client.ts)

- `prefixUrl`: `VITE_API_URL` или `/api/v1`
- `timeout`: 10000ms
- `beforeRequest`: добавляет `Authorization: Bearer {accessToken}`
- `afterResponse`: при 401 → попытка refresh → повтор запроса → при неудаче logout

### Auth-поток

```
Login/Register
  → POST /auth/login или /auth/register
  → { access_token, refresh_token, user }
  → accessToken + refreshToken → localStorage
  → user → authStore (Zustand)

Каждый API-запрос:
  → Authorization: Bearer {accessToken}
  → 401? → POST /auth/refresh → новые tokens → повтор запроса
  → Refresh тоже истёк? → logout → redirect /login

Logout:
  → POST /auth/logout (инвалидирует refresh в Redis)
  → Очистить localStorage + authStore
  → Redirect /
```

### authStore (Zustand)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

### Защищённые роуты

`ProtectedRoute` компонент оборачивает `/toilets/new`, `/profile`, `/toilets/:id/edit`:
1. Проверить `isAuthenticated`
2. Если нет → redirect `/login?redirect=/toilets/new`
3. После логина → redirect обратно

---

## PWA

### manifest.json

```json
{
  "name": "WTFApp — Где туалет?",
  "short_name": "WTFApp",
  "description": "Поиск ближайшего туалета",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1E40AF",
  "background_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker стратегии

| Ресурс | Стратегия | TTL кэша |
|--------|-----------|----------|
| API-запросы | NetworkFirst | — |
| Статика (JS/CSS/шрифты) | StaleWhileRevalidate | — |
| Тайлы OSM | CacheFirst | 7 дней |

### Offline-режим (MVP — базовый)

- `/nearby` → кэш последних результатов из Service Worker
- `/toilets/:id` → кэш посещённых страниц
- Баннер: «Оффлайн-режим. Данные могут быть устаревшими.»
- Скрыть кнопки: «Добавить туалет», «Написать отзыв»
- Очередь действий: сохранить → отправить при восстановлении связи

---

## Хуки

### useGeolocation
```typescript
interface GeolocationState {
  position: [number, number] | null; // [lat, lon]
  error: string | null;
  isLoading: boolean;
}
// navigator.geolocation.watchPosition
// Fallback: город по умолчанию из config
```

### useNearbyToilets
```typescript
interface NearbyToiletsResult {
  toilets: Toilet[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;    // cursor-пагинация
  hasNextPage: boolean;
  refresh: () => void;
}
// Подписан на mapStore.center + mapStore.filters
// Debounce 500ms при перемещении карты
```

### useAuth
Обёртка над authStore: `isAuthenticated`, `user`, `login()`, `logout()`, `register()`

---

## Обработка ошибок — UI

| Сценарий | UI-реакция |
|----------|-----------|
| Сеть недоступна | Toast: «Нет подключения к интернету» |
| 401 Unauthorized | Авто-refresh → при неудаче redirect /login |
| 403 Forbidden | Toast: «Недостаточно прав» |
| 404 Не найден | Страница 404 с кнопкой «На карту» |
| 409 Дубликат отзыва | Toast: «Вы уже оставили отзыв» |
| 422 Валидация | Подсветка полей формы с текстом ошибки |
| 429 Rate limit | Toast: «Слишком много запросов. Подождите.» |
| 500 Server error | Toast: «Ошибка сервера. Попробуйте позже.» |
| Geolocation denied | Toast + кнопка «Ввести адрес вручную» → /search |

---

## Структура проекта

```
frontend/
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── toilets.ts
│   │   ├── reviews.ts
│   │   └── users.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MapLayout.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── NavBar.tsx
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── ToiletMarker.tsx
│   │   │   ├── UserLocation.tsx
│   │   │   └── ClusterMarkers.tsx
│   │   ├── toilet/
│   │   │   ├── ToiletCard.tsx
│   │   │   ├── ToiletDetail.tsx
│   │   │   ├── ToiletForm.tsx
│   │   │   ├── OpeningHours.tsx
│   │   │   └── AmenitiesBadges.tsx
│   │   ├── review/
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   └── ReviewForm.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── common/
│   │   │   ├── PhotoUploader.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── EmptyState.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── Badge.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useNearbyToilets.ts
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   ├── pages/
│   │   ├── MapPage.tsx
│   │   ├── ToiletPage.tsx
│   │   ├── AddToiletPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ProfileEditPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── mapStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── toilet.ts
│   │   ├── review.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── distance.ts
│   │   ├── coordinates.ts
│   │   ├── tokens.ts
│   │   └── openingHours.ts
│   └── styles/
│       └── globals.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── nginx.conf
└── .env.example
```

---

## Docker

### Dockerfile (multi-stage)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000;
    }

    location /media/ {
        proxy_pass http://backend:8000;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Приоритеты

### Приоритет 1 — MVP

- [ ] Проект: Vite + React + TS + Tailwind + структура папок
- [ ] API-клиент: ky + interceptors + типы TypeScript
- [ ] Auth: LoginPage, RegisterPage, authStore, token refresh
- [ ] MapPage: Leaflet + геолокация + маркеры + кластеризация
- [ ] BottomSheet: список ToiletCard + cursor-пагинация
- [ ] SearchPage: текстовый поиск с debounce
- [ ] ToiletPage: детали + отзывы + фото-галерея
- [ ] AddToiletPage: форма + мини-карта для выбора координат
- [ ] Отзывы: ReviewForm + ReviewCard
- [ ] Фото: PhotoUploader + PhotoGallery
- [ ] ProfilePage: профиль + мои туалеты + мои отзывы
- [ ] NavBar: табы (карта / избранное / профиль)
- [ ] FilterPanel: фильтры на карте
- [ ] PWA: manifest + Service Worker (базовый offline)
- [ ] Обработка ошибок: Toast + ErrorBoundary + 404

### Приоритет 2

- [ ] ForgotPasswordPage
- [ ] ConfirmButton: «Подтвердить актуальность»
- [ ] OpeningHours: рендер часов + статус «Открыто/Закрыто»
- [ ] Reports: кнопка жалобы + форма
- [ ] Модерация: админ-панель (список жалоб, пользователи)
- [ ] Избранное: закладка туалетов (localStorage)

### Приоритет 3

- [ ] Офлайн-режим: очередь действий + sync
- [ ] Геймификация: бейджи в профиле
- [ ] Построение маршрута до туалета (OSRM)
- [ ] QR-коды: сканирование → страница туалета
- [ ] Тёмная тема (Tailwind dark mode)
- [ ] i18n (react-i18next)
