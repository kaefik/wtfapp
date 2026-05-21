export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
  total: number
}

export interface ApiError {
  detail: string
  code?: string
}

export interface AuthResponse {
  access_token: string
  user: import('./user').User
}

export interface NearbyParams {
  lat: number
  lon: number
  radius?: number
  gender?: string
  is_free?: boolean
  has_water?: boolean
  has_hot_water?: boolean
  has_soap?: boolean
  has_dryer?: boolean
  is_accessible?: boolean
  has_child_toilet?: boolean
  has_changing_table?: boolean
  paper_type?: string
  is_open_now?: boolean
  min_rating?: number
  toilet_type?: string
  cursor?: string
  limit?: number
}

export interface SearchParams {
  q: string
  lat?: number
  lon?: number
  cursor?: string
  limit?: number
}
