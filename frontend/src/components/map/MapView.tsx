import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useMapStore } from '@/stores/mapStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { SearchBar } from '@/components/layout/SearchBar'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { FilterPanel } from '@/components/layout/FilterPanel'
import { Plus, LocateFixed, Info, ZoomIn, ZoomOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ToiletMarkers } from './ToiletMarker'
import { UserLocation } from './UserLocation'

export function MapView() {
  const { center, zoom, setCenter, setZoom } = useMapStore()
  const geo = useGeolocation()
  const navigate = useNavigate()
  const [showLegend, setShowLegend] = useState(false)

  useEffect(() => {
    if (geo.position) {
      setCenter(geo.position)
    }
  }, [geo.position, setCenter])

  const handleLocate = () => {
    if (geo.position) {
      setCenter(geo.position)
    }
  }

  const handleZoomIn = useCallback(() => setZoom(zoom + 1), [zoom, setZoom])
  const handleZoomOut = useCallback(() => setZoom(Math.max(1, zoom - 1)), [zoom, setZoom])

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <UserLocation position={geo.position} error={geo.error} />
        <ToiletMarkers />
      </MapContainer>

      <div className="absolute right-4 top-20 z-30 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="rounded-full bg-white p-3 shadow-lg hover:bg-gray-50"
          aria-label="Приблизить"
        >
          <ZoomIn size={22} className="text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded-full bg-white p-3 shadow-lg hover:bg-gray-50"
          aria-label="Отдалить"
        >
          <ZoomOut size={22} className="text-gray-700" />
        </button>
      </div>

      <SearchBar />
      <BottomSheet />
      <FilterPanel />

      <div className="absolute bottom-20 left-4 z-30 flex flex-col gap-2">
        <button
          onClick={handleLocate}
          className="rounded-full bg-white p-3 shadow-lg hover:bg-gray-50"
          aria-label="Моё местоположение"
        >
          <LocateFixed size={22} className="text-gray-700" />
        </button>
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="rounded-full bg-white p-3 shadow-lg hover:bg-gray-50"
          aria-label="Легенда карты"
        >
          <Info size={22} className="text-gray-700" />
        </button>
      </div>

      {showLegend && <MapLegend onClose={() => setShowLegend(false)} />}

      <div className="absolute bottom-20 right-4 z-30">
        <button
          onClick={() => navigate('/toilets/new')}
          className="rounded-full bg-primary-600 p-3 shadow-lg text-white hover:bg-primary-700"
          aria-label="Добавить туалет"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  )
}

function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute bottom-40 left-4 z-30 w-52 rounded-xl bg-white p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">Легенда</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex flex-col gap-2 text-xs text-gray-700">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ background: '#22c55e' }} />
          Рейтинг 4.0+
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ background: '#eab308' }} />
          Рейтинг 3.0–3.9
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ background: '#ef4444' }} />
          Рейтинг &lt; 3.0
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ background: '#9ca3af' }} />
          Без оценок
        </div>
      </div>
    </div>
  )
}

function MapEvents() {
  const zoom = useMapStore((s) => s.zoom)
  const setCenter = useMapStore((s) => s.setCenter)
  const setZoom = useMapStore((s) => s.setZoom)
  const map = useMap()

  useEffect(() => {
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom)
    }
  }, [zoom, map])

  useEffect(() => {
    map.on('moveend', () => {
      const { lat, lng } = map.getCenter()
      setCenter([lat, lng])
      setZoom(map.getZoom())
    })
  }, [map, setCenter, setZoom])

  return null
}
