import { useRef, useCallback, type RefObject } from 'react'
import { ToiletCard } from '@/components/toilet/ToiletCard'
import { ToiletCardSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useNearbyStore } from '@/stores/nearbyStore'
import { useMapStore } from '@/stores/mapStore'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ToiletListContentProps {
  containerRef?: RefObject<HTMLElement | null>
}

export function ToiletListContent({ containerRef }: ToiletListContentProps) {
  const toilets = useNearbyStore((s) => s.toilets)
  const isLoading = useNearbyStore((s) => s.isLoading)
  const error = useNearbyStore((s) => s.error)
  const loadMore = useNearbyStore((s) => s.loadMore)
  const hasNextPage = useNearbyStore((s) => s.hasNextPage)
  const { filters, setFilters } = useMapStore()
  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!hasNextPage || isLoading) return
      const options = containerRef?.current ? { root: containerRef.current } : undefined
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore()
      }, options)
      if (node) observerRef.current.observe(node)
    },
    [hasNextPage, isLoading, loadMore, containerRef]
  )

  const expandRadius = () => {
    const newRadius = Math.min(filters.radius * 2, 10000)
    setFilters({ radius: newRadius })
  }

  if (isLoading && toilets.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ToiletCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <EmptyState
          title="Ошибка загрузки"
          description={error}
          action={<Button onClick={() => useNearbyStore.getState().refresh()}>Обновить</Button>}
        />
      </div>
    )
  }

  if (toilets.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<MapPin size={48} />}
          title="Туалетов поблизости нет"
          description="Попробуйте расширить поиск или добавьте туалет"
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={expandRadius}>Расширить поиск</Button>
              <Button onClick={() => window.location.href = '/toilets/new'}>Добавить туалет</Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {toilets.map((toilet, i) => (
        <div key={toilet.id} ref={i === toilets.length - 1 ? lastCardRef : null}>
          <ToiletCard toilet={toilet} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
        </div>
      )}
      {!hasNextPage && toilets.length > 0 && (
        <p className="py-4 text-center text-sm text-gray-400">Больше нет</p>
      )}
    </div>
  )
}
