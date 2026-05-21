import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchToilets } from '@/api/toilets'
import { ToiletCard } from '@/components/toilet/ToiletCard'
import { Loader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useNavigate } from 'react-router-dom'
import type { Toilet } from '@/types/toilet'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<Toilet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const doSearch = useCallback(async (q: string, cursor?: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const data = await searchToilets({ q: q.trim(), cursor, limit: 20 })
      if (cursor) {
        setResults((prev) => [...prev, ...data.items])
      } else {
        setResults(data.items)
      }
      setNextCursor(data.next_cursor)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    doSearch(debouncedQuery)
  }, [debouncedQuery, doSearch])

  const recent = (() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') ?? '[]') as string[]
    } catch {
      return []
    }
  })()

  const saveRecent = (q: string) => {
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 10)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  return (
    <div className="flex h-full flex-col">
      {!isDesktop && (
        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-gray-600">
              ←
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveRecent(query)}
                placeholder="Поиск по названию или адресу..."
                className="flex-1 bg-transparent text-sm outline-none"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {isDesktop && (
        <div className="border-b border-gray-100 px-4 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveRecent(query)}
            placeholder="Поиск по названию или адресу..."
            className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!debouncedQuery.trim() && recent.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">Недавние запросы</h3>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQuery(r)}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && <Loader className="py-8" />}

        {!isLoading && debouncedQuery.trim() && results.length === 0 && (
          <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос" />
        )}

        <div className="flex flex-col gap-3">
          {results.map((toilet) => (
            <ToiletCard key={toilet.id} toilet={toilet} />
          ))}
        </div>

        {nextCursor && !isLoading && (
          <div className="py-4 text-center">
            <button
              onClick={() => doSearch(debouncedQuery, nextCursor)}
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
