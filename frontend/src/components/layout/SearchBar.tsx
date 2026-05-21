import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()
  const { setFilterPanelOpen } = useUIStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute left-4 right-4 top-4 z-30 flex items-center gap-2"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-lg">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск туалетов..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
      <button
        type="button"
        onClick={() => setFilterPanelOpen(true)}
        className="rounded-xl bg-white p-2.5 shadow-lg text-gray-600 hover:text-primary-600"
        aria-label="Фильтры"
      >
        <SlidersHorizontal size={18} />
      </button>
    </form>
  )
}
