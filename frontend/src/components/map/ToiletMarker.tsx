import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useNearbyToilets } from '@/hooks/useNearbyToilets'
import { formatDistance } from '@/utils/distance'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/Badge'
import { Check, AlertTriangle, X, HelpCircle } from 'lucide-react'

function getMarkerClass(rating: number | null): string {
  if (rating === null) return 'toilet-marker-gray'
  if (rating >= 4) return 'toilet-marker-green'
  if (rating >= 3) return 'toilet-marker-yellow'
  return 'toilet-marker-red'
}

function getStatusIcon(rating: number | null) {
  if (rating === null) return HelpCircle
  if (rating >= 4) return Check
  if (rating >= 3) return AlertTriangle
  return X
}

function createMarkerIcon(toilet: { rating: number | null; toilet_type: string }) {
  const colorClass = getMarkerClass(toilet.rating)
  const Icon = getStatusIcon(toilet.rating)
  const svg = `<div class="toilet-marker ${colorClass}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><${Icon === Check ? 'polyline' : Icon === AlertTriangle ? 'path' : Icon === X ? 'line' : 'circle'} ${Icon === Check ? 'points="20 6 9 17 4 12"' : Icon === AlertTriangle ? 'd="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"' : Icon === X ? 'x1="18" y1="6" x2="6" y2="18"' : 'cx="12" cy="12" r="10"'}/></svg></div>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

export function ToiletMarkers() {
  const { toilets } = useNearbyToilets()
  return (
    <>
      {toilets.map((toilet) => (
        <ToiletMarker key={toilet.id} toilet={toilet} />
      ))}
    </>
  )
}

function ToiletMarker({ toilet }: { toilet: ReturnType<typeof useNearbyToilets>['toilets'][number] }) {
  const navigate = useNavigate()
  const icon = useMemo(() => createMarkerIcon(toilet), [toilet.rating, toilet.toilet_type])

  return (
    <Marker
      position={[toilet.lat, toilet.lon]}
      icon={icon}
      aria-label={`Туалет: ${toilet.name}, рейтинг ${toilet.rating ?? 'нет'}, ${toilet.distance ? formatDistance(toilet.distance) : ''}`}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-semibold text-gray-900">{toilet.name}</h3>
          <p className="text-sm text-gray-500">{toilet.address}</p>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={toilet.rating} size={14} />
            <span className="text-xs text-gray-500">({toilet.review_count})</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {toilet.is_open ? (
              <Badge variant="success">Открыто</Badge>
            ) : (
              <Badge variant="danger">Закрыто</Badge>
            )}
            {toilet.distance !== undefined && (
              <span className="text-xs text-gray-500">{formatDistance(toilet.distance)}</span>
            )}
          </div>
          <button
            onClick={() => navigate(`/toilets/${toilet.id}`)}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Подробнее →
          </button>
        </div>
      </Popup>
    </Marker>
  )
}
