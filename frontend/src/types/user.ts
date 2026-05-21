export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  id: string
  nickname: string
  email: string
  full_name: string | null
  avatar_url: string | null
  date_of_birth: string | null
  role: UserRole
  is_email_verified: boolean
  created_at: string
  toilets_count: number
  reviews_count: number
  confirmations_count: number
}
