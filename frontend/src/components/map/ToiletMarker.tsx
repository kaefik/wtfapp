import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useNearbyToilets } from '@/hooks/useNearbyToilets'
import { formatDistance } from '@/utils/distance'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/Badge'
import { ClusterMarkers } from './ClusterMarkers'

function getMarkerColor(rating: number | null): string {
  if (rating === null) return '#9ca3af'
  if (rating >= 4) return '#22c55e'
  if (rating >= 3) return '#eab308'
  return '#ef4444'
}

function getRatingLabel(rating: number | null): string {
  if (rating === null) return '?'
  return rating.toFixed(1)
}

function createMarkerIcon(toilet: { rating: number | null }) {
  const color = getMarkerColor(toilet.rating)
  const label = getRatingLabel(toilet.rating)

  const svg = `
    <div style="
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:${color};color:white;font-weight:700;font-size:12px;
      border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      transform:rotate(-45deg);
    ">
      <span style="transform:rotate(45deg);display:flex;flex-direction:column;align-items:center;line-height:1.1;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9h10M7 15h10"/><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
        <span style="font-size:10px;margin-top:1px;">${label}</span>
      </span>
    </div>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

export function ToiletMarkers() {
  const { toilets } = useNearbyToilets()
  return (
    <ClusterMarkers>
      {toilets.map((toilet) => (
        <ToiletMarker key={toilet.id} toilet={toilet} />
      ))}
    </ClusterMarkers>
  )
}

function ToiletMarker({ toilet }: { toilet: ReturnType<typeof useNearbyToilets>['toilets'][number] }) {
  const navigate = useNavigate()
  const icon = useMemo(() => createMarkerIcon(toilet), [toilet])

  return (
    <Marker
      position={[toilet.lat, toilet.lon]}
      icon={icon}
      aria-label={`Туалет: ${toilet.name}, рейтинг ${toilet.rating ?? 'нет'}, ${toilet.distance ? formatDistance(toilet.distance) : ''}`}
    >
      <Popup>
        <div className="min-w-[200px]">
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
