import type { ReactNode } from 'react'

interface ClusterMarkersProps {
  children: ReactNode
}

export function ClusterMarkers({ children }: ClusterMarkersProps) {
  return <>{children}</>
}
