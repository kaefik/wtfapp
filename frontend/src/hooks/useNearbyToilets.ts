import { useState, useEffect, useCallback, useRef } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { getNearbyToilets } from '@/api/toilets'
import { useDebounce } from './useDebounce'
import type { Toilet } from '@/types/toilet'

interface NearbyToiletsResult {
  toilets: Toilet[]
  isLoading: boolean
  error: string | null
  loadMore: () => void
  hasNextPage: boolean
  refresh: () => void
}

export function useNearbyToilets(): NearbyToiletsResult {
  const { center, filters } = useMapStore()
  const debouncedCenter = useDebounce(center, 500)
  const debouncedFilters = useDebounce(filters, 300)

  const [toilets, setToilets] = useState<Toilet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchToilets = useCallback(async (cursor?: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (!cursor) setIsLoading(true)
      setError(null)

      const result = await getNearbyToilets({
        lat: debouncedCenter[0],
        lon: debouncedCenter[1],
        ...debouncedFilters,
        cursor,
        limit: 20,
      })

      if (controller.signal.aborted) return

      if (cursor) {
        setToilets((prev) => {
          const existing = new Map(prev.map((t) => [t.id, t]))
          result.items.forEach((t) => existing.set(t.id, t))
          return Array.from(existing.values())
        })
      } else {
        setToilets(result.items)
      }
      setNextCursor(result.next_cursor)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [debouncedCenter, debouncedFilters])

  useEffect(() => {
    fetchToilets()
  }, [fetchToilets])

  const loadMore = useCallback(() => {
    if (nextCursor) fetchToilets(nextCursor)
  }, [nextCursor, fetchToilets])

  const refresh = useCallback(() => {
    fetchToilets()
  }, [fetchToilets])

  return {
    toilets,
    isLoading,
    error,
    loadMore,
    hasNextPage: nextCursor !== null,
    refresh,
  }
}
