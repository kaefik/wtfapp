import { useRef, useCallback } from 'react'
import { Drawer } from 'vaul'
import { ToiletCard } from '@/components/toilet/ToiletCard'
import { ToiletCardSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useNearbyToilets } from '@/hooks/useNearbyToilets'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMapStore } from '@/stores/mapStore'

export function BottomSheet() {
  const { toilets, isLoading, error, loadMore, hasNextPage } = useNearbyToilets()
  const { filters, setFilters } = useMapStore()
  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!hasNextPage || isLoading) return
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore()
      })
      if (node) observerRef.current.observe(node)
    },
    [hasNextPage, isLoading, loadMore]
  )

  const expandRadius = () => {
    const newRadius = Math.min(filters.radius * 2, 10000)
    setFilters({ radius: newRadius })
  }

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <div className="fixed inset-x-0 bottom-14 z-30 flex justify-center">
          <button className="rounded-t-xl bg-white px-6 py-2 shadow-lg">
            <div className="mx-auto mb-1 h-1 w-8 rounded-full bg-gray-300" />
            <span className="text-sm font-medium text-gray-700">
              Рядом: {toilets.length} туалет{toilets.length === 1 ? '' : toilets.length < 5 && toilets.length > 1 ? 'а' : 'ов'}
            </span>
          </button>
        </div>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex h-[70vh] flex-col rounded-t-xl bg-white shadow-xl"
          role="dialog"
          aria-label="Список туалетов поблизости"
        >
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
            {isLoading && toilets.length === 0 ? (
              <div className="flex flex-col gap-3 pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ToiletCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                title="Ошибка загрузки"
                description={error}
                action={<Button onClick={() => window.location.reload()}>Обновить</Button>}
              />
            ) : toilets.length === 0 ? (
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
            ) : (
              <div className="flex flex-col gap-3 pt-2">
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
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
