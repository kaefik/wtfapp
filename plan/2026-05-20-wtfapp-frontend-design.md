# WTFApp — Frontend Design

Мобильный-first PWA для поиска ближайших туалетов. React + Leaflet + Tailwind.

> **Версия 3** — исправлена по результатам критических разборов v1 и v2
> (`plan/2026-05-20-wtfapp-frontend-critique.md`,
> `plan/2026-05-20-wtfapp-frontend-critique-v2.md`).

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Фреймворк | React 18 + TypeScript |
| Сборка | Vite 6 |
| Стили | Tailwind CSS 4 (`@tailwindcss/vite` плагин, конфигурация через CSS) |
| State | Zustand |
| Карты | React Leaflet + OpenStreetMap |
| HTTP-клиент | ky |
| Роутинг | React Router 7 (library mode) |
| PWA | vite-plugin-pwa (Service Worker, manifest, offline) |
| Формы | React Hook Form + Zod (валидация) |
| UI-примитивы | shadcn/ui (Radix primitives + Tailwind) |
| BottomSheet | vaul (Radix-based, совместим с shadcn/ui) |
| Иконки | Lucide React |
| Типы API | openapi-typescript (генерация из OpenAPI-спецификации бэкенда) |
| Тестирование | Vitest + Testing Library |
| E2E | Playwright |
| Mock API | MSW (Mock Service Worker) — для разработки без бэкенда |
| Мониторинг | Sentry (`@sentry/vite-plugin` для source maps) |
| Контейнеризация | Nginx (production), Vite dev server (development) |

---

## Требования к бэкенду

> Изменения бэкенд-дизайна, необходимые для работы фронтенда.

1. **Auth: httpOnly cookie для refresh_token.**
   - `POST /api/v1/auth/login` и `POST /api/v1/auth/register` должны устанавливать refresh_token через `Set-Cookie` вместо возврата в JSON-ответе.
   - Cookie параметры: `HttpOnly; SameSite=Strict; Path=/api/v1/auth; Secure` (Secure только в production).
   - JSON-ответ: `{ access_token, user }` — без refresh_token.
   - `POST /api/v1/auth/refresh` читает refresh_token из cookie, возвращает новый access_token и обновляет cookie.
   - `POST /api/v1/auth/logout` удаляет cookie (`Set-Cookie: refresh_token=; Max-Age=0`).

2. **Фото: уточнить формат загрузки.**
   - `POST /api/v1/toilets/{id}/photos` — один файл за запрос, `Content-Type: multipart/form-data`, поле `file`.
   - `POST /api/v1/reviews/{id}/photos` — аналогично.

3. **API-ответ `GET /api/v1/toilets/{id}`** — должен включать все поля туалета + `photo_urls` + первые 5 отзывов (или ссылка на пагинированный список).

---

## Архитектура UX

**Подход:** Карта — главный экран. Карта занимает весь экран, сверху — SearchBar, снизу — свайпаемый BottomSheet со списком туалетов. Навигация — NavBar внизу (3 таба).

**Поддерживаемые платформы:** Android Chrome, Desktop Chrome/Firefox, iOS Safari (с ограничениями: нет push-уведомций, ограниченный Service Worker, 7-дневный лимит IndexedDB). Тестировать на iOS Safari обязательно.

**Развёртывание:** Фронтенд и API обязаны быть на одном домене (same-origin) для корректной работы httpOnly cookie. Nginx проксирует `/api/` и `/media/` на бэкенд.

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
| `/forgot-password` | ForgotPasswordPage | Аноним | Запрос сброса пароля |
| `/reset-password` | ResetPasswordPage | Аноним | Сброс пароля по токену из email |
| `/verify-email` | VerifyEmailPage | Аноним | Подтверждение email по токену из письма |
| `/profile` | ProfilePage | user+ | Профиль + мои туалеты + мои отзывы |
| `/profile/edit` | ProfileEditPage | user+ | Редактировать профиль + аватар |
| `*` | NotFoundPage | — | 404 |

### NavBar (нижняя навигация)

1. **Карта** (`/`) — иконка map-pin
2. **Избранное** (Priority 2, пока заглушка) — иконка heart
3. **Профиль** (`/profile` или `/login` если не авторизован) — иконка user

### Потоки пользователя

**Найти туалет рядом:**
```
Открыл приложение → Geolocation API
  → Если разрешение дано: GET /api/v1/toilets/nearby?lat=X&lon=Y
  → Если отказ: показать «Введите адрес» prominently → /search с ручным вводом
→ Маркеры на карте + список в BottomSheet
→ Тап на маркер/карточку → /toilets/:id
→ Фото, удобства, часы, отзывы, рейтинг
```

**Добавить туалет:**
```
FAB "+" на карте → /toilets/new
→ Координаты: текущая геолокация + поля lat/lon (редактируемые)
→ Форма: название, адрес, тип, удобства, фото
→ POST /api/v1/toilets/ → редирект на /toilets/:id
```

**Оставить отзыв:**
```
На странице туалета → «Написать отзыв»
→ Если не авторизован → /login?redirect=/toilets/:id
→ Форма: рейтинг (звёзды), текст, фото
→ POST /api/v1/toilets/:id/reviews/
```

---

## Компоненты карты

### MapView.tsx

- Leaflet контейнер на весь экран
- Слои: тайлы OSM + маркеры + кластеры + геолокация
- Реагирует на `mapStore` (центр, зум, фильтры)
- При перемещении карты → debounce 500ms → `GET /api/v1/toilets/nearby` с координатами центра
- FAB-кнопки: геолокация (левый нижний угол), добавить туалет (правый нижний угол)
- Дедупликация маркеров: хранить `Map<toiletId, marker>`, при новом запросе — обновлять только изменившиеся

### ToiletMarker.tsx

- Иконка зависит от `toilet_type` (indoor / outdoor / portable) — SVG через `L.divIcon` с Lucide иконкой внутри
- Цвет по рейтингу: зелёный (≥4), жёлтый (3–3.9), красный (<3), серый (нет отзывов)
- Цвет дублируется иконкой для accessibility (зелёный = check, жёлтый = alert, красный = x, серый = ?)
- Popup при тапе: мини-карточка (название, рейтинг, расстояние, «Открыто»/«Закрыто»)
- Тап по popup → `/toilets/:id`
- `aria-label`: «Туалет: {name}, рейтинг {rating}, {distance} м»

### ClusterMarkers.tsx

- `react-leaflet-cluster` для группировки при зуме < 14
- Число внутри = количество туалетов
- Тап → зум к области
- Максимальный зум кластеризации: 14 (выше — показать все маркеры)

### UserLocation.tsx

- `navigator.geolocation.watchPosition` → синяя точка + круг точности
- Кнопка «центрировать» → анимация к текущей позиции
- Если геолокация недоступна:
  1. Запросить разрешение
  2. При отказе → Toast «Включите геолокацию или введите адрес вручную» + кнопка → `/search`
  3. Fallback: `VITE_DEFAULT_LAT` / `VITE_DEFAULT_LON` из конфига

### BottomSheet — состояния

> **MVP: 2 состояния.** HALF добавляется в Priority 2.

| Состояние | Описание |
|-----------|----------|
| **COLLAPSED** | Только заголовок «Рядом: N туалетов». Свайп вверх → EXPANDED. |
| **EXPANDED** (по умолч.) | Полный список + cursor-пагинация. Свайп вниз → COLLAPSED. |

**Библиотека:** `vaul` (Radix-based Drawer). Причины выбора:
- Активно поддерживается, совместим с React 18 strict mode
- Использует Radix primitives (уже в зависимостях через shadcn/ui)
- Встроенная поддержка snap-точек и gesture boundary

**Решение конфликта жестов Leaflet + BottomSheet:**
- `vaul` рендерит drawer в overlay-слое, Leaflet получает события только вне drawer
- CSS `touch-action: none` на drawer-контенте предотвращает конфликт вертикального свайпа

**Пагинация в BottomSheet:**
- Infinite scroll через `IntersectionObserver` на последней карточке
- При появлении последней карточки в viewport → `loadMore()`
- Внизу списка: spinner при загрузке / «Больше нет» при `hasNextPage = false`

### FilterPanel

Slide-up модалка (Drawer из shadcn/ui), вызывается из SearchBar (иконка фильтра):

- **Радиус поиска:** кнопки-пресеты [500м] [1км] [3км] [10км]. По умолчанию 1км. Отправляется как `radius` параметр.
- **Пол:** [Все] [М] [Ж] [Унисекс] [Семейный]
- **Бесплатный:** toggle
- **Удобства:** отдельные toggle: вода, горячая вода, мыло, сушилка, доступный, детский, пеленальный
- **Бумага:** [Не важно] [Нет] [В кабинке] [В диспенсере] [Оба]. «Не важно» = параметр не отправляется.
- **Открыто сейчас:** toggle
- **Мин. рейтинг:** звёзды (1-5)
- **Тип:** [Все] [Внутри] [Снаружи] [Портативный]

Фильтры → `mapStore.filters` → `useNearbyToilets` → новый запрос к API.

---

## Страницы — детальный дизайн

### MapPage (`/`)

Главный экран. Карта + SearchBar + BottomSheet + NavBar.

**Loading-состояния:**
- Загрузка геолокации → Skeleton-заглушка BottomSheet «Определение местоположения...»
- Загрузка туалетов → Skeleton-карточки в BottomSheet
- 0 результатов → EmptyState «Туалетов поблизости нет» + кнопка «Расширить поиск» (увеличить radius) / «Добавить туалет»
- Есть результаты → список ToiletCard с расстоянием и рейтингом
- Обновление маркеров при перемещении карты → Spinner в SearchBar

### SearchPage (`/search`)

- Роут: `/search?q=...&lat=&lon=`
- `q` → debounce 300ms → `GET /api/v1/toilets/search`
- Если `lat/lon` переданы — сортировка по расстоянию, иначе — по релевантности
- Недавние запросы из localStorage
- **Ручной ввод адреса:** поле ввода адреса prominently при отказе геолокации. Геокодер: Nominatim (бесплатный, OSM-based).
  - Rate limit Nominatim: 1 req/sec. Debounce 1 сек на запросы + кэширование результатов на клиенте (`Map<query, result>` в памяти).
  - При ошибке геокодирования → «Не удалось найти адрес. Уточните запрос.»

### ToiletPage (`/toilets/:id`)

**Loading:** Skeleton всей страницы.
**Ошибка 404 / 410 (удалён):** «Туалет не найден» + кнопка «На карту».

- Фото-галерея (горизонтальный свайп, тап → fullscreen)
- Название, адрес, этаж, статус «Открыто/Закрыто»
- Рейтинг + количество отзывов
- Бейджи удобств (AmenitiesBadges)
- Часы работы (OpeningHours)
- Описание «как найти» (`description`) + «описание входа» (`location_hint`)
- Кнопка «Подтвердить актуальность»
- Список отзывов с пагинацией + фото
- Кнопка «Написать отзыв» (только для авторизованных)
- Кнопки «Редактировать» / «Удалить» (только для owner/moderator/admin)
- Удаление: confirm-диалог «Удалить туалет? Это действие можно отменить только модератору.»

### AddToiletPage (`/toilets/new`, `/toilets/:id/edit`)

- **Координаты:** автозаполнение из текущей геолокации + поля `lat` / `lon` (редактируемые). В MVP — без мини-карты.
- Форма: название, адрес, этаж, пол (male/female/unisex/family), тип (indoor/outdoor/portable), платный/бесплатный, цена, валюта
- Чекбоксы удобств: вода, горячая вода, мыло, сушилка, доступный, детский, пеленальный
- Выпадающий список `paper_type`: неизвестно / нет / в кабинке / в диспенсере / оба
- Текстовое поле «Как найти внутри здания» (`description`)
- Текстовое поле «Описание входа» (`location_hint`)
- Загрузка фото (макс. 5 для MVP): автозагрузка при выборе файла (отдельный `POST /api/v1/toilets/{id}/photos` для каждого). Превью + прогресс-бар. Валидация размера на клиенте (до 5 МБ) + сжатие через Canvas (fallback: JPEG для браузеров без WebP поддержки).
- Валидация через Zod (схемы сверяются со сгенерированными типами из openapi-typescript)
- При редактировании — форма предзаполнена
- **Защита от потери данных:** React Router `useBlocker` при уходе с несохранённой формой → confirm-диалог

### LoginPage (`/login`)

- Email + пароль + кнопка «Войти»
- Ссылка «Забыли пароль?» → `/forgot-password`
- Ссылка «Зарегистрироваться» → `/register`
- После успешного логина → redirect по параметру `?redirect=` (whitelist: только внутренние пути, начинающиеся с `/`, без внешних доменов)

### RegisterPage (`/register`)

- Никнейм, email, пароль (мин. 8 символов)
- Ссылка «Уже есть аккаунт? Войти»
- После регистрации → redirect на `/verify-email?pending=1` с подсказкой «Проверьте почту»

### ForgotPasswordPage (`/forgot-password`)

- Email → `POST /api/v1/auth/forgot-password`
- Успех → «Письмо отправлено» + ссылка «Вернуться ко входу»
- Priority 2 — в MVP заглушка с текстом «Функция будет доступна скоро»

### ResetPasswordPage (`/reset-password`)

- Роут: `/reset-password?token=...`
- Новый пароль + подтверждение пароля
- `POST /api/v1/auth/reset-password` с `{ token, new_password }`
- Успех → redirect `/login` с Toast «Пароль сброшен. Войдите с новым паролем.»

### VerifyEmailPage (`/verify-email`)

- Роут: `/verify-email?token=...`
- Автоматически вызвать `POST /api/v1/auth/verify-email` с `{ token }`
- Успех → Toast «Email подтверждён» + redirect на `/`
- Ошибка → «Ссылка устарела. Запросите новую.» + кнопка → `/login`

### ProfilePage (`/profile`)

- Аватар + никнейм + email
- Статистика вклада: туалетов добавлено, отзывов, подтверждений
- «Мои туалеты» → `GET /api/v1/auth/me` → `user.id` → `GET /api/v1/users/{id}/toilets`
- «Мои отзывы» → `GET /api/v1/users/{id}/reviews`
- Кнопка «Выйти»

### ProfileEditPage (`/profile/edit`)

- Редактирование никнейма, полного имени, email, даты рождения
- Загрузка аватара: `POST /api/v1/auth/me/avatar` (компонент AvatarUploader)
- Предпросмотр аватара перед сохранением

---

## API-клиент

### ky instance (src/api/client.ts)

- `prefixUrl`: `VITE_API_URL` или `/api/v1`
- `timeout`: 10000ms
- `credentials: 'include'` — отправлять cookie (httpOnly refresh_token) при каждом запросе. При same-origin (production через nginx) — избыточно, но не вредит. При кросс-domain dev (если `VITE_API_URL` внешний) — обязательно.
- `beforeRequest`: добавляет `Authorization: Bearer {accessToken}` (из Zustand, не из localStorage)
- `afterResponse`: при 401 → попытка refresh → повтор запроса → при неудаче logout

**Дедупликация refresh-запросов:** если два API-запроса одновременно получают 401, только один выполняет `POST /auth/refresh`, второй ждёт результат (promise-based mutex: одна глобальная переменная `refreshPromise`).

### Генерация типов

```bash
# Генерация TypeScript-типов из OpenAPI-спецификации бэкенда
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api-generated.d.ts
```

**Процесс обновления:**
- Скрипт `package.json`: `"types:generate": "openapi-typescript ..."`
- Запускается вручную при изменении API + в CI (проверка что типы не устарели)
- Сгенерированный файл `api-generated.d.ts` добавлен в `.gitignore` (генерируется при каждой сборке)

Типы в `src/types/` реэкспортируют из сгенерированных. Zod-схемы для форм пишутся вручную, но поля сверяются со сгенерированными типами.

### Auth-поток

```
Login/Register
  → POST /api/v1/auth/login или /api/v1/auth/register
  → Response: { access_token, user }
  → Set-Cookie: refresh_token (httpOnly, SameSite=Strict, Path=/api/v1/auth, Secure)
  → accessToken → Zustand authStore (только в памяти, НЕ persist)
  → user → authStore

При загрузке приложения (App.tsx):
  → Вызвать refreshAuth()
  → POST /api/v1/auth/refresh (cookie отправляется автоматически)
  → Успех → новый accessToken → authStore
  → Неудача → пользователь не авторизован
  → ProtectedRoute проверяет isAuthenticated:
    → Если false после refreshAuth → redirect /login?redirect={currentPath}

Каждый API-запрос:
  → Authorization: Bearer {accessToken}
  → 401? → refreshAuth() (с дедупликацией) → повтор запроса
  → Refresh тоже истёк? → logout → redirect /login

Logout:
  → POST /api/v1/auth/logout (инвалидирует refresh в Redis, очищает cookie)
  → Очистить authStore
  → Redirect /
```

### authStore (Zustand)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

> **Важно:** `accessToken` хранится только в Zustand (в памяти). При перезагрузке страницы — вызывается `refreshAuth()` через httpOnly cookie. Никакие токены не попадают в localStorage.

### Защищённые роуты

`ProtectedRoute` компонент оборачивает `/toilets/new`, `/profile`, `/toilets/:id/edit`:
1. При монтировании — вызвать `refreshAuth()` если `isAuthenticated === false`
2. Если после refresh `isAuthenticated` всё ещё false → redirect `/login?redirect={currentPath}`
3. Параметр `redirect` валидируется: только внутренние пути, начинающиеся с `/`, без внешних доменов
4. После логина → redirect обратно

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

| Ресурс | Стратегия | Лимиты кэша |
|--------|-----------|------------|
| API-запросы | NetworkFirst | maxEntries: 50, maxAge: 1 час |
| Статика (JS/CSS/шрифты) | StaleWhileRevalidate | maxEntries: 30 |
| Тайлы OSM | CacheFirst | maxEntries: 500, maxAge: 7 дней, purge на 50MB |

### Offline-режим

**MVP (Priority 1) — статика только:**
- Service Worker кэширует JS/CSS/шрифты/тайлы — приложение открывается оффлайн
- API-запросы: NetworkFirst, при отсутствии сети → Toast «Нет подключения»
- Баннер: «Оффлайн-режим. Данные могут быть устаревшими.»

**Priority 3 — полноценный offline:**
- Кэш `/nearby` результатов + `/toilets/:id` посещённых страниц
- Скрыть кнопки: «Добавить туалет», «Написать отзыв»
- Очередь действий: сохранить → отправить при восстановлении связи

### iOS-подсказка

При первом визите с iOS Safari → баннер «Добавьте WTFApp на главный экран» с инструкцией (Share → Add to Home Screen). Показывается однократно (localStorage флаг). Priority 2.

---

## Хуки

### useGeolocation
```typescript
interface GeolocationState {
  position: [number, number] | null;
  error: string | null;
  isLoading: boolean;
}
// navigator.geolocation.watchPosition
// При ошибке: установить error, MapPage покажет «Введите адрес»
// Fallback: VITE_DEFAULT_LAT/VITE_DEFAULT_LON из .env
```

### useNearbyToilets
```typescript
interface NearbyToiletsResult {
  toilets: Toilet[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasNextPage: boolean;
  refresh: () => void;
}
// Подписан на mapStore.center + mapStore.filters
// Debounce 500ms при перемещении карты
// Дедупликация: новые туалеты мержатся с существующими по id
```

### useAuth
Обёртка над authStore: `isAuthenticated`, `user`, `login()`, `logout()`, `register()`

---

## Accessibility (a11y)

**Минимум для MVP:**

- Все интерактивные элементы имеют `aria-label` (маркеры карты, FAB-кнопки, иконки NavBar)
- NavBar: `role="navigation"`, `aria-current="page"` на активном табе
- BottomSheet: `role="dialog"`, `aria-label="Список туалетов поблизости"`
- FilterPanel: `role="dialog"`, `aria-label="Фильтры"`, focus trap при открытии
- Фокус-менеджмент: при открытии модалки → фокус на первый элемент, при закрытии → возврат на триггер
- Контрастность: минимум WCAG AA (4.5:1 для текста, 3:1 для крупных элементов)
- Цветовое кодирование маркеров (зелёный/жёлтый/красный) дублируется иконкой (check / alert / x / ?)

---

## Code Splitting

Все страницы загружаются лениво через `React.lazy` + `Suspense`:

```typescript
const MapPage = React.lazy(() => import('./pages/MapPage'));
const ToiletPage = React.lazy(() => import('./pages/ToiletPage'));
// ...
```

Leaflet (~200KB) импортируется динамически только в MapPage и AddToiletPage:
```typescript
const MapView = React.lazy(() => import('./components/map/MapView'));
```

`Suspense` fallback — `<Loader />` (центрированный спиннер).

---

## Тестирование

### Unit-тесты (Vitest + Testing Library)

| Что тестировать | Приоритет |
|----------------|-----------|
| API-клиент: interceptors, refresh-поток, дедупликация refresh, обработка ошибок | P1 |
| authStore: login/logout/refresh | P1 |
| Zod-схемы валидации форм | P1 |
| Хуки: useGeolocation, useDebounce | P1 |
| Утилиты: distance, openingHours, coordinates | P1 |
| Компоненты: ToiletCard, ReviewCard, RatingStars, AmenitiesBadges | P2 |

### E2E-тесты (Playwright)

| Сценарий | Приоритет |
|----------|-----------|
| Аноним: открыть карту → увидеть маркеры → тап → детали туалета | P2 |
| Регистрация → логин → профиль | P2 |
| Добавить туалет → увидеть на карте | P2 |
| Оставить отзыв → увидеть в списке | P2 |

### Mock API (MSW)

- `src/mocks/handlers.ts` — обработчики для всех API-эндпоинтов
- `src/mocks/browser.ts` — MSW setup для dev-режима
- Включается автоматически при `VITE_API_MOCKING=true`
- Позволяет разрабатывать фронтенд без запущенного бэкенда

---

## Мониторинг

- **Sentry** — захват клиентских ошибок (JS exceptions, unhandled promise rejections)
- Sentry DSN через `VITE_SENTRY_DSN` (опционально, не блокирует запуск)
- **Source maps:** `@sentry/vite-plugin` — генерация + загрузка source maps в Sentry при `vite build`
  - `vite.config.ts`: `sentryVitePlugin({ authToken, org, project })`
  - `build.sourcemap: true` включён в Vite конфигурации
- Performance: Sentry Web Vitals (LCP, FID, CLS)

---

## Обработка ошибок — UI

| Сценарий | UI-реакция |
|----------|-----------|
| Сеть недоступна | Toast: «Нет подключения к интернету» |
| 401 Unauthorized | Авто-refresh → при неудаче redirect /login |
| 403 Forbidden | Toast: «Недостаточно прав» |
| 404 Не найден | Страница 404 с кнопкой «На карту» |
| 410 Gone (туалет удалён) | «Туалет больше не существует» + кнопка «На карту» |
| 409 Дубликат отзыва | Toast: «Вы уже оставили отзыв» |
| 422 Валидация | Подсветка полей формы с текстом ошибки |
| 429 Rate limit | Toast: «Слишком много запросов. Подождите.» |
| 500 Server error | Toast: «Ошибка сервера. Попробуйте позже.» |
| Geolocation denied | Toast «Включите геолокацию» + кнопка «Ввести адрес» → /search |
| Лимит: макс. туалетов/отзывов за день | Toast: «Вы добавили максимальное количество. Попробуйте завтра.» |
| Фото > 5 МБ | Toast: «Файл слишком большой (макс. 5 МБ)» — валидация ДО отправки |
| Геокодирование не удалось | Toast: «Не удалось найти адрес. Уточните запрос.» |

---

## Stores

### uiStore (Zustand)

```typescript
interface UIState {
  bottomSheetState: 'collapsed' | 'expanded';
  setBottomSheetState: (state: 'collapsed' | 'expanded') => void;
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

### mapStore (Zustand)

```typescript
interface NearbyFilters {
  radius: number;
  gender?: 'male' | 'female' | 'unisex' | 'family';
  is_free?: boolean;
  has_water?: boolean;
  has_hot_water?: boolean;
  has_soap?: boolean;
  has_dryer?: boolean;
  is_accessible?: boolean;
  has_child_toilet?: boolean;
  has_changing_table?: boolean;
  paper_type?: 'none' | 'in_cabin' | 'dispenser' | 'both';
  is_open_now?: boolean;
  min_rating?: number;
  toilet_type?: 'indoor' | 'outdoor' | 'portable';
}

interface MapState {
  center: [number, number];
  zoom: number;
  filters: NearbyFilters;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setFilters: (filters: Partial<NearbyFilters>) => void;
  resetFilters: () => void;
}
```

---

## Environment Variables

### `.env.example`

```env
# API
VITE_API_URL=/api/v1

# Mock API (разработка без бэкенда)
VITE_API_MOCKING=false

# Геолокация (fallback при отказе)
VITE_DEFAULT_LAT=55.7558
VITE_DEFAULT_LON=37.6173
VITE_DEFAULT_CITY=Москва

# Sentry (опционально)
VITE_SENTRY_DSN=

# Nominatim (для геокодирования адресов)
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org
```

### Vite Dev Proxy (для обхода CORS при разработке)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    vitePWA({ /* ... */ }),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'wtfapp',
      project: 'frontend',
    }),
  ],
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

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
│   │   │   ├── AvatarUploader.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── Skeleton.tsx
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
│   │   └── useDebounce.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   ├── browser.ts
│   │   └── data/
│   │       ├── toilets.ts
│   │       └── users.ts
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
│   │   ├── ResetPasswordPage.tsx
│   │   ├── VerifyEmailPage.tsx
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
│   │   └── openingHours.ts
│   └── styles/
│       └── globals.css
├── tests/
│   ├── unit/
│   │   ├── api-client.test.ts
│   │   ├── authStore.test.ts
│   │   ├── validation.test.ts
│   │   ├── hooks.test.ts
│   │   └── utils.test.ts
│   └── e2e/
│       ├── anonymous-flow.spec.ts
│       ├── auth-flow.spec.ts
│       └── toilet-crud.spec.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
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

    client_max_body_size 6m;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

### Приоритет 1 — MVP (12 задач)

- [ ] Проект: Vite + React + TS + Tailwind + shadcn/ui + структура папок + code splitting
- [ ] Типы API: openapi-typescript генерация + MSW mock-сервер для разработки без бэкенда
- [ ] API-клиент: ky + interceptors + refresh через httpOnly cookie + дедупликация refresh
- [ ] Auth: LoginPage, RegisterPage, authStore (access token в памяти), refresh-поток, ProtectedRoute
- [ ] MapPage: Leaflet + геолокация + маркеры (L.divIcon) + кластеризация + дедупликация
- [ ] BottomSheet: vaul drawer, 2 состояния + infinite scroll (IntersectionObserver) + ToiletCard
- [ ] ToiletPage: детали + отзывы + фото-галерея (макс. 5 фото)
- [ ] AddToiletPage: форма (Zod) + координаты через поля lat/lon + фото (автозагрузка + сжатие) + useBlocker
- [ ] Отзывы: ReviewForm + ReviewCard
- [ ] NavBar: табы (карта / избранное / профиль)
- [ ] FilterPanel: фильтры (radius пресеты, пол, удобства, тип) + NearbyFilters тип
- [ ] Обработка ошибок: Toast + ErrorBoundary + 404 + 410 + Skeleton loading

### Приоритет 2

- [ ] ProfilePage: профиль + мои туалеты + мои отзывы
- [ ] ProfileEditPage: редактирование + AvatarUploader
- [ ] SearchPage: текстовый поиск с debounce + Nominatim геокодер (кэш + rate limit)
- [ ] ForgotPasswordPage + ResetPasswordPage (полный flow)
- [ ] VerifyEmailPage
- [ ] BottomSheet: HALF-состояние (3 snap-точки)
- [ ] ConfirmButton: «Подтвердить актуальность»
- [ ] OpeningHours: рендер часов + статус «Открыто/Закрыто»
- [ ] Reports: кнопка жалобы + форма
- [ ] Модерация: админ-панель (список жалоб, пользователи)
- [ ] Избранное: закладка туалетов (localStorage)
- [ ] iOS-подсказка: баннер «Добавьте на главный экран»
- [ ] Accessibility: полный аудит + keyboard navigation
- [ ] Unit-тесты: компоненты ToiletCard, ReviewCard, RatingStars, AmenitiesBadges
- [ ] E2E-тесты: Playwright (4 сценария)
- [ ] PWA: manifest + Service Worker (статика: JS/CSS/шрифты/тайлы)

### Приоритет 3

- [ ] Офлайн-режим: кэш API + очередь действий + sync
- [ ] Геймификация: бейджи в профиле
- [ ] Построение маршрута до туалета (OSRM)
- [ ] QR-коды: сканирование → страница туалета
- [ ] Тёмная тема (Tailwind dark mode)
- [ ] i18n (react-i18next)
- [ ] SEO: prerender для `/toilets/:id` (для шаринга в соцсетях)
- [ ] Sentry: production мониторинг + source maps
