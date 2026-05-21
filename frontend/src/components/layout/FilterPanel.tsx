import { useUIStore } from '@/stores/uiStore'
import { useMapStore, type NearbyFilters } from '@/stores/mapStore'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

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
  const { isFilterPanelOpen, setFilterPanelOpen } = useUIStore()
  const { filters, setFilters, resetFilters } = useMapStore()

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

        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Радиус поиска</label>
            <div className="flex gap-2">
              {RADIUS_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFilters({ radius: p.value })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <label className="mb-2 block text-sm font-medium text-gray-700">Пол</label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setFilters({ gender: opt.value })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <label className="mb-2 block text-sm font-medium text-gray-700">Тип</label>
            <div className="flex flex-wrap gap-2">
              {TOILET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setFilters({ toilet_type: opt.value })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <label className="mb-2 block text-sm font-medium text-gray-700">Удобства</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_TOGGLES.map((toggle) => (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() => setFilters({ [toggle.key]: !filters[toggle.key] })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <label className="text-sm font-medium text-gray-700">Бесплатный</label>
            <button
              type="button"
              onClick={() => setFilters({ is_free: !filters.is_free })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                filters.is_free ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  filters.is_free ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Открыто сейчас</label>
            <button
              type="button"
              onClick={() => setFilters({ is_open_now: !filters.is_open_now })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                filters.is_open_now ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  filters.is_open_now ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={resetFilters}>
            Сбросить
          </Button>
          <Button className="flex-1" onClick={() => setFilterPanelOpen(false)}>
            Применить
          </Button>
        </div>
      </div>
    </div>
  )
}
