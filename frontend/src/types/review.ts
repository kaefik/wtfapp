export interface Review {
  id: string
  toilet_id: string
  user_id: string
  user_nickname: string
  user_avatar_url: string | null
  rating: number
  text: string | null
  photo_urls: string[]
  created_at: string
  updated_at: string
}

export interface ReviewCreate {
  rating: number
  text?: string | null
}
