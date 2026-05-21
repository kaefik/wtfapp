import { useIsDesktop } from '@/hooks/useIsDesktop'
import { MapView } from '@/components/map/MapView'
import { ToiletListContent } from '@/components/toilet/ToiletListContent'

export default function MapPage() {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return <ToiletListContent />
  }

  return <MapView />
}
