import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader } from '@/components/common/Loader'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, refreshAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      refreshAuth().then((ok) => {
        if (!ok) {
          const redirect = location.pathname.startsWith('/') ? location.pathname + location.search : '/'
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
        }
        setChecked(true)
      })
    } else {
      setChecked(true)
    }
  }, [isAuthenticated, isLoading, refreshAuth, navigate, location])

  if (!checked || isLoading) return <Loader className="h-screen" />

  if (!isAuthenticated) return null

  return <>{children}</>
}
