import { useEffect, useRef } from 'react'
import { useMap, Circle, Marker } from 'react-leaflet'
import L from 'leaflet'
const userIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface UserLocationProps {
  position: [number, number] | null
  error: string | null
}

export function UserLocation({ position, error }: UserLocationProps) {
  const map = useMap()

  const hasFlownRef = useRef(false)

  useEffect(() => {
    if (position && !hasFlownRef.current) {
      hasFlownRef.current = true
      map.flyTo(position, map.getZoom(), { duration: 1 })
    }
  }, [position, map])

  if (!position || error) return null

  return (
    <>
      <Marker position={position} icon={userIcon} />
      <Circle center={position} radius={50} pathOptions={{ fillOpacity: 0.1, color: '#3b82f6', weight: 1 }} />
    </>
  )
}
