# План: Адаптивный десктоп-лейаут (Google Maps стиль)

## Брейкпоинты

| Зона | Диапазон | Поведение |
|------|----------|-----------|
| **Mobile** | < 1024px | Текущий лейаут (NavBar + BottomSheet) без изменений |
| **Desktop** | >= 1024px (`lg`) | SidePanel + Map |

> **Почему 1024px, а не 768px:** на 768px SidePanel (320px) + Map (448px) — карта слишком тесная.
> 1024px даёт SidePanel (320px) + Map (704px) — комфортный минимум.

## Десктоп-лейаут (>= 1024px):

```
┌──────────────────────────────────────────────────────────────┐
│  🚽 WTFApp    [Карта] [Избранное] [Профиль]        Avatar   │  ← DesktopHeader (z-20)
├──────────────────┬───────────────────────────────────────────┤
│  Side Panel      │                                           │
│  (w-80, 320px)   │                                           │
│  z-10            │                                           │
│  ┌─────────────┐ │                                           │
│  │ SearchBar   │ │                Map                        │
│  ├─────────────┤ │          (без оверлеев)                   │
│  │ Filters ▼   │ │                                           │
│  ├─────────────┤ │     zoom / locate / add / legend          │
│  │ Content:    │ │                                           │
│  │ · Nearby    │ │                                           │
│  │ · Detail    │ │                                           │
│  │ · Favorites │ │                                           │
│  │ · Profile   │ │                                           │
│  │ · Search    │ │                                           │
│  └─────────────┘ │                                           │
├──────────────────┴───────────────────────────────────────────┤
│  OfflineBar (под хедером)       Toast (top-right, z-[100])   │
└──────────────────────────────────────────────────────────────┘
```

## Z-index иерархия (десктоп)

| Уровень | Элемент | z-index |
|---------|---------|---------|
| Base | SidePanel | `z-10` (`position: relative`) |
| Base | Map wrapper | `z-0` (`overflow: hidden`) |
| Header | DesktopHeader | `z-20` |
| Map controls | Zoom/Locate/Add/Legend кнопки | `z-30` |
| Modals | Modal (Radix Dialog) | `z-50` |
| Overlay | ToastContainer | `z-[100]` |
| Overlay | OfflineBar | `z-[100]` |

> SidePanel требует `position: relative` + `z-index: 10` чтобы Leaflet map container
> не перекрывал панель (Leaflet создаёт агрессивный stacking context).

## Мобайл-лейаут (< 1024px): остаётся как есть

---

## Что нужно сделать:

### 1. Хук `useIsDesktop`

**Файл:** `src/hooks/useIsDesktop.ts`

```ts
window.matchMedia('(min-width: 1024px)')
```

- Подписка на `change` event `matchMedia`
- Начальное состояние из `window.matchMedia` (без задержки)
- Экспортирует `boolean`, не объект — минималистичный API

### 2. Nearby-хук → Zustand store (критический рефактор)

**Проблема:** `useNearbyToilets` вызывается из `BottomSheet` и `ToiletMarkers` — два
независимых инстанса, два API-вызова, два AbortController. На десктопе станет три
(+SidePanel list). AbortController в одном инстансе отменяет запросы другого.

**Решение:** заменить `useNearbyToilets` на Zustand store — единый источник данных.

**Файл:** `src/stores/nearbyStore.ts`

```ts
interface NearbyState {
  toilets: Toilet[]
  isLoading: boolean
  error: string | null
  nextCursor: string | null
  hasNextPage: boolean
  loadMore: () => void
  refresh: () => void
}
```

- Подписка на `mapStore.center` + `mapStore.filters` (через `subscribeWithSelector`)
- Один `AbortController` — нет конфликтов отмены
- Один API-вызов при изменении позиции/фильтров
- `loadMore()` — курсорная пагинация через `nextCursor`
- Компоненты подписываются через селекторы: `useNearbyStore(s => s.toilets)`

**Миграция (заменить вызовы):**
- `BottomSheet.tsx`: `const { toilets, ... } = useNearbyToilets()` → `useNearbyStore()`
- `ToiletMarker.tsx` → `ToiletMarkers()`: `const { toilets } = useNearbyToilets()` → `useNearbyStore(s => s.toilets)`
- `useNearbyToilets.ts` — удалить после миграции

**Потребители infinite scroll:**
- `BottomSheet` (mobile) — Drawer + scroll observer на последней карточке
- `ToiletListContent` (desktop SidePanel) — scrollable div + observer на последней карточке
- Оба вызывают `useNearbyStore(s => s.loadMore)` — один и тот же метод

### 3. Extract `ToiletListContent` из BottomSheet

**Файл:** `src/components/toilet/ToiletListContent.tsx`

Вынести из `BottomSheet.tsx` общий контент списка:
- Список `ToiletCard` (данные из `nearbyStore`)
- Infinite scroll: `IntersectionObserver` на последней карточке
- Принимает `containerRef?: RefObject` — опциональный ref для scroll-контейнера
- Состояния: loading (скелетоны), error, empty (с кнопками «Расширить поиск» / «Добавить туалет»)

**Потребители:**
- `BottomSheet.tsx` (mobile) — обёртка Drawer + `<ToiletListContent />`
- На десктопе — `MapPage` рендерит `<ToiletListContent />` внутри SidePanel Outlet

### 4. Реструктуризация роутинга + MapLayout (атомарное изменение)

**Важно:** шаги 1–7 выполняются как **один атомарный PR**.
Раздельная реструктуризация роутинга ломает мобайл (NavBar появляется на
ToiletPage/SearchPage).

**Файл:** `src/App.tsx` — новая структура роутов:

```tsx
<Routes>
  {/* ── Внутри MapLayout ── */}
  <Route element={<MapLayout />}>
    <Route index element={<MapPage />} />
    <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/toilets/:id" element={<ToiletPage />} />
    <Route path="/search" element={<SearchPage />} />
  </Route>

  {/* ── Вне MapLayout (полноэкранные) ── */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />
  <Route path="/toilets/new" element={<ProtectedRoute><AddToiletPage /></ProtectedRoute>} />
  <Route path="/toilets/:id/edit" element={<ProtectedRoute><AddToiletPage /></ProtectedRoute>} />
  <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

**Что меняется:**
- `/toilets/:id` и `/search` переносятся внутрь `<MapLayout>`
- На мобайле — NavBar скрывается на «детальных» роутах (см. ниже)
- На десктопе — рендерятся внутри SidePanel через вложенный `<Outlet />`

### 5. Модификация `MapLayout` (атомарно с п.4)

**Файл:** `src/components/layout/MapLayout.tsx`

MapLayout — единая точка переключения mobile/desktop:

```
if (isDesktop):
  <div className="flex h-full flex-col">
    <DesktopHeader />
    {isOffline && <OfflineBar />}
    <div className="flex flex-1 overflow-hidden">
      <SidePanel>                  ← z-10, position: relative
        <Outlet />                 ← контент текущего роута
      </SidePanel>
      <div className="flex-1 relative overflow-hidden">  ← z-0
        <MapView />                ← карта всегда видна
      </div>
    </div>
    <ToastContainer position="top-right" />
  </div>

else (mobile):
  <div className="relative h-full w-full">
    <Outlet />
    {hideNavBar ? null : <NavBar />}    ← скрыт на /toilets/:id и /search
    {isOffline && <OfflineBar />}
    <ToastContainer />
  </div>
```

**NavBar на мобайле — скрытие на детальных роутах:**

Определить, нужно ли скрывать NavBar на мобайле:

```ts
const location = useLocation()
const hideNavBar = !isDesktop && (
  location.pathname.startsWith('/toilets/') && !location.pathname.includes('/new') && !location.pathname.includes('/edit')
  || location.pathname === '/search'
)
```

- `/`, `/favorites`, `/profile` → NavBar виден
- `/toilets/:id` → NavBar скрыт (полноэкранная детальная страница)
- `/search` → NavBar скрыт (полноэкранный поиск)
- `/toilets/new`, `/toilets/:id/edit` → вне MapLayout, NavBar не рендерится

**Ключевые моменты:**
- `MapView` монтируется **здесь** (а не внутри MapPage), чтобы карта
  не перемонтировалась при навигации между роутами
- Map wrapper: `overflow: hidden` — предотвращает выход Leaflet за границы
- `MapView` не содержит `useEffect` для `setCenter(geo.position)` — геолокация
  обрабатывается один раз при маунте (см. п.7)

### 6. Новый компонент `DesktopHeader`

**Файл:** `src/components/layout/DesktopHeader.tsx`

- Хедер: `h-14`, `border-b`, `bg-white`, `z-20`
- Содержимое: логотип (ссылка на `/`) + NavLinks (Карта/Избранное/Профиль) + Avatar/Login
- NavLink активного роута подсвечивается (`text-primary-600`) через `useLocation`
- Заменяет NavBar на десктопе (NavBar не рендерится)

### 7. Адаптация `MapView`

**Файл:** `src/components/map/MapView.tsx`

На десктопе **не рендерит:**
- `SearchBar` → перемещён в SidePanel
- `BottomSheet` → заменён на ToiletListContent в SidePanel
- `FilterPanel` → заменён на inline-секцию в SidePanel

**Рендерит всегда:**
- `MapContainer` + `TileLayer` + `MapEvents` + `UserLocation` + `ToiletMarkers`
- Кнопки: zoom (+/-), locate, add-toilet, legend

**Leaflet `invalidateSize()`:**

```tsx
function MapResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
```

- Вызывается при монтировании и при каждом resize контейнера
- Размещается как дочерний компонент внутри `MapContainer`

**Геолокация — убрать setCenter side-effect:**

Текущий `useEffect(() => setCenter(geo.position), [geo.position])` вызывает
постоянный repeat карты. При постоянном маунте MapView в MapLayout это недопустимо.

Заменить на: **однократный flyTo** при первом получении позиции:

```tsx
function UserLocation({ position, error }: Props) {
  const map = useMap()
  const hasFlown = useRef(false)

  useEffect(() => {
    if (position && !hasFlown.current) {
      map.flyTo(position, 15)
      hasFlown.current = true
    }
  }, [position, map])

  // ...рендер маркера и круга
}
```

Координаты геолокации больше не пишут в `mapStore.center` автоматически —
только при первом flyTo. Последующие обновления позиции обновляют только маркер.

### 8. Адаптация `ToiletMarker` — клик на десктопе

**Файл:** `src/components/map/ToiletMarker.tsx`

На десктопе при клике на маркер:
- **НЕ** показывать Leaflet Popup (перекрывается SidePanel)
- Вместо этого: `navigate(/toilets/${toilet.id})` — детали откроются в SidePanel

```tsx
const isDesktop = useIsDesktop()

if (isDesktop) {
  return (
    <Marker
      position={...}
      icon={icon}
      eventHandlers={{ click: () => navigate(`/toilets/${toilet.id}`) }}
    />
  )
}

// mobile: текущее поведение с Popup
return (
  <Marker ...>
    <Popup>...</Popup>
  </Marker>
)
```

### 9. Компонент `SidePanel`

**Файл:** `src/components/layout/SidePanel.tsx`

Контейнер:
- Фиксированная ширина `w-80` (320px) — единый размер, без адаптивных вариантов
  (можно добавить `xl:w-96` позже как Phase 2)
- `overflow-y-auto` для внутреннего скролла
- `border-r` разделитель
- `position: relative; z-index: 10` — чтобы не перекрывался Leaflet

**Структура:**
```
SidePanel
├── SearchBar (inline, не absolute, position: static)
├── FilterBar (inline collapsible, см. пункт 10)
└── <Outlet />  ← контент роута (ToiletListContent / ToiletPage / SearchPage / ...)
```

**SearchBar в SidePanel — изменения:**
- `className` — не `absolute`, а `static`/`sticky top-0`
- При submit: `navigate(/search?q=...)` — SearchPage рендерится в том же SidePanel
- Кнопка фильтров: `setDesktopFilterOpen(true)` — раскрывает inline-фильтры

### 10. Доработка страниц

**Общий паттерн:** страницы внутри SidePanel должны корректно работать при 320px.

- `MapPage` на десктопе рендерит `<ToiletListContent />` (без карты, без оверлеев).
  На мобайле — `<MapView />` (текущее поведение)
- `ToiletPage` — убрать `pb-20` на десктопе; `ToiletDetail` — скрыть back-button
- `SearchPage` — убрать `pb-20` на десктопе; SearchBar в SidePanel навигирует
  на `/search?q=...`, SearchPage рендерится в Outlet SidePanel
- `ProfilePage`, `FavoritesPage` — убрать `pb-20` и `min-h-screen` на десктопе
- `PhotoGallery` — проверить при 320px (ограничить размер превью)
- Модальные окна (ToiletForm, ReviewForm) — z-index `z-50` выше SidePanel

### 11. FilterPanel на десктопе

**Файл:** `src/components/layout/FilterPanel.tsx`

На десктопе — inline collapsible секция внутри SidePanel:
- Заголовок «Фильтры» с chevron-иконкой (toggle)
- Содержимое: те же фильтры (радиус, пол, тип, удобства)
- НЕ `fixed inset-0 z-50` overlay — раскрывается/сворачивается inline
- Управление через `uiStore.desktopFilterOpen`
- На мобайле — текущее поведение (overlay)

### 12. Адаптация `uiStore`

**Файл:** `src/stores/uiStore.ts`

Добавить:
```ts
desktopFilterOpen: boolean
setDesktopFilterOpen: (open: boolean) => void
```

- `bottomSheetState`, `isFilterPanelOpen` — игнорируются на десктопе
- `sidePanelRoute` — **НЕ добавлять**, `useLocation` даёт текущий путь

### 13. Обработка ресайза окна

- `useIsDesktop` через `matchMedia` — мгновенное переключение
- Desktop → mobile: карта сохраняет centre/zoom (mapStore)
- Mobile → desktop: SidePanel монтируется, Leaflet получает `invalidateSize()` через
  ResizeObserver
- Состояние фильтров сохраняется (mapStore.filters не зависит от лейаута)
- Данные nearby-toilets сохраняются (nearbyStore)

### 14. NotFoundPage на десктопе

Сейчас `* → NotFoundPage` вне MapLayout. На десктопе — белый экран.
Решение: NotFoundPage остаётся вне MapLayout, но получает `min-h-screen`
и `flex items-center justify-center` для центрирования. Альтернативно —
перенести внутрь MapLayout (показывать в SidePanel), но это добавляет
сложность. Оставить как есть — 404 случается редко.

---

## Порядок реализации:

**Фаза 1: Подготовка (не ломает мобайл)**

1. **`useIsDesktop` хук** — `src/hooks/useIsDesktop.ts`
2. **`nearbyStore`** — заменить `useNearbyToilets` на Zustand store
3. **Миграция потребителей** — `BottomSheet.tsx`, `ToiletMarker.tsx` → `nearbyStore`
4. **Extract `ToiletListContent`** из `BottomSheet.tsx` — `src/components/toilet/ToiletListContent.tsx`
5. **`DesktopHeader`** — `src/components/layout/DesktopHeader.tsx`
6. **`SidePanel`** — `src/components/layout/SidePanel.tsx`
7. **Адаптация `MapView`** — условное скрытие оверлеев + `MapResizeHandler` + геолокация fix

**Фаза 2: Переключение (атомарный коммит — всё или ничего)**

8. **Роутинг + MapLayout + MapPage** — всё в одном коммите:
   - `App.tsx`: `/toilets/:id`, `/search` внутрь MapLayout
   - `MapLayout.tsx`: условный рендер desktop/mobile, NavBar hiding
   - `MapPage.tsx`: `isDesktop ? <ToiletListContent /> : <MapView />`

**Фаза 3: Доработка (после переключения)**

9. **Адаптация `ToiletMarker`** — navigate вместо popup на десктопе
10. **Правки страниц** — pb-20, min-h-screen, back-button
11. **`FilterPanel`** — inline режим для десктопа + `uiStore.desktopFilterOpen`
12. **Финальная полировка:**
    - Z-index проверка (SidePanel z-10 vs Leaflet)
    - Toast position: top-right на десктопе
    - OfflineBar: под DesktopHeader на десктопе
    - Тестирование: 1024px, 1280px, 1920px
    - Тестирование ресайза окна при открытых страницах
    - Тестирование прямых URL (`/toilets/123` на десктопе)
    - Тестирование `/favorites` неавторизованным → редирект на `/login` (вне MapLayout)
