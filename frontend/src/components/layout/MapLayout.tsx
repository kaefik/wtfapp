import { useLocation, Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { DesktopHeader } from './DesktopHeader'
import { SidePanel } from './SidePanel'
import { MapView } from '@/components/map/MapView'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useUIStore } from '@/stores/uiStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { WifiOff } from 'lucide-react'

export function MapLayout() {
  const isDesktop = useIsDesktop()
  const isOffline = useUIStore((s) => s.isOffline)
  const location = useLocation()

  const hideNavBar =
    !isDesktop &&
    ((location.pathname.startsWith('/toilets/') &&
      !location.pathname.includes('/new') &&
      !location.pathname.includes('/edit')) ||
      location.pathname === '/search')

  if (isDesktop) {
    return (
      <div className="flex h-full flex-col">
        <DesktopHeader />
        {isOffline && (
          <div className="flex items-center justify-center gap-2 bg-yellow-500 py-1 text-sm text-white z-[100]">
            <WifiOff size={14} />
            Оффлайн-режим. Данные могут быть устаревшими.
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <ErrorBoundary>
            <SidePanel />
          </ErrorBoundary>
          <div className="relative z-0 flex-1 overflow-hidden">
            <MapView />
          </div>
        </div>
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      {!hideNavBar && <NavBar />}
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
