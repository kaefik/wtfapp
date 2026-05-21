export type Gender = 'male' | 'female' | 'unisex' | 'family'
export type ToiletType = 'indoor' | 'outdoor' | 'portable'
export type PaperType = 'unknown' | 'none' | 'in_cabin' | 'dispenser' | 'both'

export interface OpeningHour {
  day: number
  open: string | null
  close: string | null
}

export interface Toilet {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  floor: number | null
  gender: Gender
  toilet_type: ToiletType
  is_free: boolean
  price: number | null
  currency: string | null
  description: string | null
  location_hint: string | null
  has_water: boolean
  has_hot_water: boolean
  has_soap: boolean
  has_dryer: boolean
  is_accessible: boolean
  has_child_toilet: boolean
  has_changing_table: boolean
  paper_type: PaperType
  opening_hours: OpeningHour[]
  rating: number | null
  review_count: number
  photo_urls: string[]
  is_open: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  distance?: number
}

export interface ToiletCreate {
  name: string
  address: string
  lat: number
  lon: number
  floor?: number | null
  gender: Gender
  toilet_type: ToiletType
  is_free: boolean
  price?: number | null
  currency?: string | null
  description?: string | null
  location_hint?: string | null
  has_water?: boolean
  has_hot_water?: boolean
  has_soap?: boolean
  has_dryer?: boolean
  is_accessible?: boolean
  has_child_toilet?: boolean
  has_changing_table?: boolean
  paper_type?: PaperType
  opening_hours?: OpeningHour[]
}
