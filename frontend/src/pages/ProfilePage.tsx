import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit, LogOut, MapPin, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/common/Loader'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  if (isLoading) return <Loader className={isDesktop ? 'h-64' : 'min-h-screen'} />

  if (!isAuthenticated || !user) {
    navigate('/login')
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className={isDesktop ? '' : 'min-h-screen pb-20'}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        {!isDesktop && (
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-semibold">Профиль</h1>
        <button onClick={() => navigate('/profile/edit')} className="text-primary-600">
          <Edit size={18} />
        </button>
      </div>

      <div className="p-6 text-center">
        <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full bg-gray-200">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.nickname}</h2>
        <p className="text-sm text-gray-500">{user.email}</p>
        {!user.is_email_verified && (
          <p className="mt-1 text-xs text-yellow-600">Email не подтверждён</p>
        )}
      </div>

      <div className="mx-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">{user.toilets_count}</p>
          <p className="text-xs text-gray-500">Туалетов</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">{user.reviews_count}</p>
          <p className="text-xs text-gray-500">Отзывов</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">{user.confirmations_count}</p>
          <p className="text-xs text-gray-500">Подтверждений</p>
        </div>
      </div>

      <div className="mt-6 space-y-2 px-6">
        <Button variant="outline" className="w-full justify-start gap-2">
          <MapPin size={16} /> Мои туалеты
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <MessageSquare size={16} /> Мои отзывы
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-red-600" onClick={handleLogout}>
          <LogOut size={16} /> Выйти
        </Button>
      </div>
    </div>
  )
}
