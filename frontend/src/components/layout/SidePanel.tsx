import { Outlet } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { FilterPanel } from './FilterPanel'

export function SidePanel() {
  return (
    <div className="relative z-10 flex w-80 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-3">
        <SearchBar />
      </div>
      <FilterPanel />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
