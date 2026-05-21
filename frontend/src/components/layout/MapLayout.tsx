import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useUIStore } from '@/stores/uiStore'
import { WifiOff } from 'lucide-react'

export function MapLayout() {
  const { isOffline } = useUIStore()

  return (
    <div className="relative h-full w-full">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <NavBar />
      <ToastContainer />
      {isOffline && (
        <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 py-1 text-sm text-white">
          <WifiOff size={14} />
          Оффлайн-режим. Данные могут быть устаревшими.
        </div>
      )}
    </div>
  )
}
