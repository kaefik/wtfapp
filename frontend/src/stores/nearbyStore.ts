import { create } from 'zustand'
import { useMapStore } from './mapStore'
import { getNearbyToilets } from '@/api/toilets'
import type { Toilet } from '@/types/toilet'

interface NearbyState {
  toilets: Toilet[]
  isLoading: boolean
  error: string | null
  nextCursor: string | null
  hasNextPage: boolean
  loadMore: () => void
  refresh: () => void
}

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function fetchToilets(cursor?: string) {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller

  const { center, filters } = useMapStore.getState()

  if (!cursor) {
    useNearbyStore.setState({ isLoading: true, error: null })
  }

  try {
    const result = await getNearbyToilets({
      lat: center[0],
      lon: center[1],
      ...filters,
      cursor,
      limit: 20,
    })

    if (controller.signal.aborted) return

    if (cursor) {
      useNearbyStore.setState((state) => {
        const existing = new Map(state.toilets.map((t) => [t.id, t]))
        result.items.forEach((t) => existing.set(t.id, t))
        return {
          toilets: Array.from(existing.values()),
          nextCursor: result.next_cursor,
          hasNextPage: result.next_cursor !== null,
          isLoading: false,
        }
      })
    } else {
      useNearbyStore.setState({
        toilets: result.items,
        nextCursor: result.next_cursor,
        hasNextPage: result.next_cursor !== null,
        isLoading: false,
      })
    }
  } catch (err) {
    if (controller.signal.aborted) return
    useNearbyStore.setState({
      error: err instanceof Error ? err.message : 'Ошибка загрузки',
      isLoading: false,
    })
  }
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchToilets(), 400)
}

export const useNearbyStore = create<NearbyState>((_, get) => ({
  toilets: [],
  isLoading: true,
  error: null,
  nextCursor: null,
  hasNextPage: false,
  loadMore: () => {
    const { nextCursor } = get()
    if (nextCursor) fetchToilets(nextCursor)
  },
  refresh: () => {
    fetchToilets()
  },
}))

let prevCenter = useMapStore.getState().center
let prevFilters = useMapStore.getState().filters

useMapStore.subscribe((state) => {
  if (
    state.center !== prevCenter ||
    state.filters !== prevFilters
  ) {
    prevCenter = state.center
    prevFilters = state.filters
    debouncedFetch()
  }
})

fetchToilets()
