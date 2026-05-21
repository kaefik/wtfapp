import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useMapStore } from '@/stores/mapStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { SearchBar } from '@/components/layout/SearchBar'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { FilterPanel } from '@/components/layout/FilterPanel'
import { Plus, LocateFixed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ToiletMarkers } from './ToiletMarker'
import { UserLocation } from './UserLocation'

export function MapView() {
  const { center, zoom, setCenter } = useMapStore()
  const geo = useGeolocation()
  const navigate = useNavigate()

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
      </div>

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

function MapEvents() {
  const { setCenter, setZoom } = useMapStore()
  const map = useMap()

  useEffect(() => {
    map.on('moveend', () => {
      const { lat, lng } = map.getCenter()
      setCenter([lat, lng])
      setZoom(map.getZoom())
    })
  }, [map, setCenter, setZoom])

  return null
}
