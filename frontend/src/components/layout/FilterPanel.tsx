import { useUIStore } from '@/stores/uiStore'
import { useMapStore, type NearbyFilters } from '@/stores/mapStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { Button } from '@/components/ui/Button'
import { X, ChevronUp } from 'lucide-react'

const RADIUS_PRESETS = [
  { label: '500м', value: 500 },
  { label: '1км', value: 1000 },
  { label: '3км', value: 3000 },
  { label: '10км', value: 10000 },
]

const GENDER_OPTIONS: { label: string; value: NearbyFilters['gender'] }[] = [
  { label: 'Все', value: undefined },
  { label: 'М', value: 'male' },
  { label: 'Ж', value: 'female' },
  { label: 'Унисекс', value: 'unisex' },
  { label: 'Семейный', value: 'family' },
]

const TOILET_TYPE_OPTIONS: { label: string; value: NearbyFilters['toilet_type'] }[] = [
  { label: 'Все', value: undefined },
  { label: 'Внутри', value: 'indoor' },
  { label: 'Снаружи', value: 'outdoor' },
  { label: 'Портативный', value: 'portable' },
]

const AMENITY_TOGGLES: { key: keyof NearbyFilters; label: string }[] = [
  { key: 'has_water', label: 'Вода' },
  { key: 'has_hot_water', label: 'Горячая вода' },
  { key: 'has_soap', label: 'Мыло' },
  { key: 'has_dryer', label: 'Сушилка' },
  { key: 'is_accessible', label: 'Доступный' },
  { key: 'has_child_toilet', label: 'Детский' },
  { key: 'has_changing_table', label: 'Пеленальный' },
]

export function FilterPanel() {
  const isDesktop = useIsDesktop()
  const { isFilterPanelOpen, setFilterPanelOpen, desktopFilterOpen, setDesktopFilterOpen } = useUIStore()
  const { filters, setFilters, resetFilters } = useMapStore()

  if (isDesktop) {
    if (!desktopFilterOpen) return null

    return (
      <div className="border-b border-gray-100 px-3 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Фильтры</span>
          <button onClick={() => setDesktopFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
            <ChevronUp size={18} />
          </button>
        </div>

        <FilterContent filters={filters} setFilters={setFilters} resetFilters={resetFilters} onClose={() => setDesktopFilterOpen(false)} compact />
      </div>
    )
  }

  if (!isFilterPanelOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setFilterPanelOpen(false)}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Фильтры"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Фильтры</h2>
          <button onClick={() => setFilterPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <FilterContent filters={filters} setFilters={setFilters} resetFilters={resetFilters} onClose={() => setFilterPanelOpen(false)} />
      </div>
    </div>
  )
}

function FilterContent({
  filters,
  setFilters,
  resetFilters,
  onClose,
  compact,
}: {
  filters: NearbyFilters
  setFilters: (f: Partial<NearbyFilters>) => void
  resetFilters: () => void
  onClose: () => void
  compact?: boolean
}) {
  return (
    <div className={`space-y-4 ${compact ? 'max-h-[50vh]' : 'max-h-[60vh]'} overflow-y-auto`}>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Радиус</label>
        <div className="flex gap-1.5 flex-wrap">
          {RADIUS_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setFilters({ radius: p.value })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.radius === p.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Пол</label>
        <div className="flex flex-wrap gap-1.5">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setFilters({ gender: opt.value })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.gender === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Тип</label>
        <div className="flex flex-wrap gap-1.5">
          {TOILET_TYPE_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setFilters({ toilet_type: opt.value })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.toilet_type === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Удобства</label>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_TOGGLES.map((toggle) => (
            <button
              key={toggle.key}
              type="button"
              onClick={() => setFilters({ [toggle.key]: !filters[toggle.key] })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filters[toggle.key]
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {toggle.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Бесплатный</label>
        <button
          type="button"
          onClick={() => setFilters({ is_free: !filters.is_free })}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            filters.is_free ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              filters.is_free ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Открыто сейчас</label>
        <button
          type="button"
          onClick={() => setFilters({ is_open_now: !filters.is_open_now })}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            filters.is_open_now ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              filters.is_open_now ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={resetFilters}>
          Сбросить
        </Button>
        <Button size="sm" className="flex-1" onClick={onClose}>
          Применить
        </Button>
      </div>
    </div>
  )
}
