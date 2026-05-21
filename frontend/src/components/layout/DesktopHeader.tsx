import { NavLink } from 'react-router-dom'
import { MapPin, Heart, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function DesktopHeader() {
  const { isAuthenticated, user } = useAuth()

  const navItems = [
    { to: '/', icon: MapPin, label: 'Карта', end: true },
    { to: '/favorites', icon: Heart, label: 'Избранное', end: false },
    { to: isAuthenticated ? '/profile' : '/login', icon: User, label: 'Профиль', end: false },
  ]

  return (
    <header className="h-14 border-b border-gray-200 bg-white z-20 flex items-center px-4 gap-6">
      <NavLink to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
        <span className="text-2xl">🚽</span>
        <span>WTFApp</span>
      </NavLink>

      <nav className="flex items-center gap-1 ml-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Войти
          </NavLink>
        )}
      </div>
    </header>
  )
}
