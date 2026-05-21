import { create } from 'zustand'
import type { User } from '@/types/user'
import * as authApi from '@/api/auth'
import { setAccessToken } from '@/api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (nickname: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<boolean>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, password) => {
    const data = await authApi.login(email, password)
    set({ user: data.user, isAuthenticated: true })
  },
  register: async (nickname, email, password) => {
    const data = await authApi.register(nickname, email, password)
    set({ user: data.user, isAuthenticated: true })
  },
  logout: async () => {
    await authApi.logout()
    setAccessToken(null)
    set({ user: null, isAuthenticated: false })
  },
  refreshAuth: async () => {
    try {
      const data = await authApi.refreshToken()
      if (data) {
        const user = await authApi.getMe()
        set({ user, isAuthenticated: true, isLoading: false })
        return true
      }
      set({ user: null, isAuthenticated: false, isLoading: false })
      return false
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return false
    }
  },
  setUser: (user) => set({ user }),
}))
