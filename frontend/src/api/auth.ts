import { apiClient, setAccessToken } from './client'
import type { AuthResponse } from '@/types/api'
import type { User } from '@/types/user'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiClient.post('auth/login', {
    json: { email, password },
  }).json<AuthResponse>()
  setAccessToken(data.access_token)
  return data
}

export async function register(nickname: string, email: string, password: string): Promise<AuthResponse> {
  const data = await apiClient.post('auth/register', {
    json: { nickname, email, password },
  }).json<AuthResponse>()
  setAccessToken(data.access_token)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('auth/logout')
  setAccessToken(null)
}

export async function refreshToken(): Promise<{ access_token: string } | null> {
  try {
    const data = await apiClient.post('auth/refresh').json<{ access_token: string }>()
    setAccessToken(data.access_token)
    return data
  } catch {
    setAccessToken(null)
    return null
  }
}

export async function getMe(): Promise<User> {
  return apiClient.get('auth/me').json<User>()
}

export async function updateProfile(data: Partial<Pick<User, 'nickname' | 'full_name' | 'email' | 'date_of_birth'>>): Promise<User> {
  return apiClient.patch('auth/me', { json: data }).json<User>()
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post('auth/me/avatar', { body: formData }).json<User>()
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('auth/forgot-password', { json: { email } })
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await apiClient.post('auth/reset-password', { json: { token, new_password } })
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('auth/verify-email', { json: { token } })
}
