import { NavLink } from 'react-router-dom'
import { MapPin, Heart, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function NavBar() {
  const { isAuthenticated } = useAuth()

  const items = [
    { to: '/', icon: MapPin, label: 'Карта' },
    { to: '/favorites', icon: Heart, label: 'Избранное' },
    { to: isAuthenticated ? '/profile' : '/login', icon: User, label: 'Профиль' },
  ]

  return (
    <nav role="navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
