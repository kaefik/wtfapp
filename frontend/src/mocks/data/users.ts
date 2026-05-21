import type { User } from '@/types/user'

export const mockUser: User = {
  id: 'user1',
  nickname: 'testuser',
  email: 'test@example.com',
  full_name: 'Тестовый Пользователь',
  avatar_url: null,
  date_of_birth: null,
  role: 'user',
  is_email_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  toilets_count: 1,
  reviews_count: 5,
  confirmations_count: 3,
}
