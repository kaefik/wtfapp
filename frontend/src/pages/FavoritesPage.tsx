import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFavorites } from '@/api/toilets'
import { ToiletCard } from '@/components/toilet/ToiletCard'
import { Loader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import type { Toilet } from '@/types/toilet'

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth()
  const isDesktop = useIsDesktop()
  const [favorites, setFavorites] = useState<Toilet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const loadMore = (cursor?: string) => {
    getFavorites(cursor)
      .then((data) => {
        if (cursor) {
          setFavorites((prev) => [...prev, ...data.items])
        } else {
          setFavorites(data.items)
        }
        setNextCursor(data.next_cursor)
      })
      .catch(() => setFavorites([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadMore()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col">
        <EmptyState
          icon={<Heart size={48} />}
          title="Войдите в аккаунт"
          description="Чтобы сохранять любимые туалеты в избранное"
          action={
            <Link
              to="/login"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Войти
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Избранное</h1>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-3 ${isDesktop ? '' : 'pb-20'}`}>
        {isLoading && <Loader className="py-8" />}

        {!isLoading && favorites.length === 0 && (
          <EmptyState
            icon={<Heart size={48} />}
            title="Пока пусто"
            description="Нажмите сердечко на карточке туалета, чтобы добавить в избранное"
          />
        )}

        <div className="flex flex-col gap-3">
          {favorites.map((toilet) => (
            <ToiletCard key={toilet.id} toilet={toilet} />
          ))}
        </div>

        {nextCursor && !isLoading && (
          <div className="py-4 text-center">
            <button
              onClick={() => loadMore(nextCursor)}
              className="text-sm text-primary-600 hover:underline"
            >
              Показать ещё
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
