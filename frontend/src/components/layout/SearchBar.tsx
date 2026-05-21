import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()
  const { setFilterPanelOpen, setDesktopFilterOpen } = useUIStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
    }
  }

  const handleFilterClick = () => {
    setFilterPanelOpen(true)
    setDesktopFilterOpen(true)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
        <Search size={16} className="text-gray-400" />
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
        onClick={handleFilterClick}
        className="rounded-xl bg-gray-100 p-2 text-gray-600 hover:text-primary-600"
        aria-label="Фильтры"
      >
        <SlidersHorizontal size={16} />
      </button>
    </form>
  )
}
