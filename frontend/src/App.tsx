import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MapLayout } from '@/components/layout/MapLayout'
import { Loader } from '@/components/common/Loader'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const MapPage = lazy(() => import('@/pages/MapPage'))
const ToiletPage = lazy(() => import('@/pages/ToiletPage'))
const AddToiletPage = lazy(() => import('@/pages/AddToiletPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ProfileEditPage = lazy(() => import('@/pages/ProfileEditPage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  const refreshAuth = useAuthStore((s) => s.refreshAuth)

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader className="h-screen" />}>
        <Routes>
          <Route element={<MapLayout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>
          <Route path="/toilets/:id" element={<ToiletPage />} />
          <Route path="/toilets/new" element={<ProtectedRoute><AddToiletPage /></ProtectedRoute>} />
          <Route path="/toilets/:id/edit" element={<ProtectedRoute><AddToiletPage /></ProtectedRoute>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
