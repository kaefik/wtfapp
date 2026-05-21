import type { ReactNode } from 'react'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

interface ClusterMarker {
  getChildCount(): number
}

const clusterIcon = (cluster: ClusterMarker) => {
  const count = cluster.getChildCount()
  let size = 40
  if (count >= 100) size = 52
  else if (count >= 10) size = 46

  return L.divIcon({
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:var(--color-primary-600, #2563eb);color:white;
      font-weight:700;font-size:${size >= 52 ? 16 : 14}px;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className: '',
    iconSize: L.point(size, size),
  })
}

interface ClusterMarkersProps {
  children: ReactNode
}

export function ClusterMarkers({ children }: ClusterMarkersProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom
      showCoverageOnHover
      iconCreateFunction={clusterIcon as Parameters<typeof MarkerClusterGroup>[0]['iconCreateFunction']}
    >
      {children}
    </MarkerClusterGroup>
  )
}
