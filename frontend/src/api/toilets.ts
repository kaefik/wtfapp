import { apiClient } from './client'
import type { Toilet, ToiletCreate } from '@/types/toilet'
import type { PaginatedResponse, NearbyParams, SearchParams } from '@/types/api'

export async function getNearbyToilets(params: NearbyParams): Promise<PaginatedResponse<Toilet>> {
  const searchParams: Record<string, string> = {
    lat: String(params.lat),
    lon: String(params.lon),
  }
  if (params.radius) searchParams.radius = String(params.radius)
  if (params.gender) searchParams.gender = params.gender
  if (params.is_free !== undefined) searchParams.is_free = String(params.is_free)
  if (params.has_water !== undefined) searchParams.has_water = String(params.has_water)
  if (params.has_hot_water !== undefined) searchParams.has_hot_water = String(params.has_hot_water)
  if (params.has_soap !== undefined) searchParams.has_soap = String(params.has_soap)
  if (params.has_dryer !== undefined) searchParams.has_dryer = String(params.has_dryer)
  if (params.is_accessible !== undefined) searchParams.is_accessible = String(params.is_accessible)
  if (params.has_child_toilet !== undefined) searchParams.has_child_toilet = String(params.has_child_toilet)
  if (params.has_changing_table !== undefined) searchParams.has_changing_table = String(params.has_changing_table)
  if (params.paper_type) searchParams.paper_type = params.paper_type
  if (params.is_open_now !== undefined) searchParams.is_open_now = String(params.is_open_now)
  if (params.min_rating !== undefined) searchParams.min_rating = String(params.min_rating)
  if (params.toilet_type) searchParams.toilet_type = params.toilet_type
  if (params.cursor) searchParams.cursor = params.cursor
  if (params.limit) searchParams.limit = String(params.limit)

  return apiClient.get('toilets/nearby', { searchParams }).json<PaginatedResponse<Toilet>>()
}

export async function searchToilets(params: SearchParams): Promise<PaginatedResponse<Toilet>> {
  const searchParams: Record<string, string> = { q: params.q }
  if (params.lat !== undefined) searchParams.lat = String(params.lat)
  if (params.lon !== undefined) searchParams.lon = String(params.lon)
  if (params.cursor) searchParams.cursor = params.cursor
  if (params.limit) searchParams.limit = String(params.limit)
  return apiClient.get('toilets/search', { searchParams }).json<PaginatedResponse<Toilet>>()
}

export async function getToilet(id: string): Promise<Toilet> {
  return apiClient.get(`toilets/${id}`).json<Toilet>()
}

export async function createToilet(data: ToiletCreate): Promise<Toilet> {
  return apiClient.post('toilets', { json: data }).json<Toilet>()
}

export async function updateToilet(id: string, data: Partial<ToiletCreate>): Promise<Toilet> {
  return apiClient.patch(`toilets/${id}`, { json: data }).json<Toilet>()
}

export async function deleteToilet(id: string): Promise<void> {
  await apiClient.delete(`toilets/${id}`)
}

export async function uploadToiletPhoto(toiletId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post(`toilets/${toiletId}/photos`, { body: formData }).json<{ url: string }>()
}

export async function getFavorites(cursor?: string, limit?: number): Promise<PaginatedResponse<Toilet>> {
  const searchParams: Record<string, string> = {}
  if (cursor) searchParams.cursor = cursor
  if (limit) searchParams.limit = String(limit)
  return apiClient.get('favorites', { searchParams }).json<PaginatedResponse<Toilet>>()
}

export async function addToFavorite(toiletId: string): Promise<void> {
  await apiClient.post(`toilets/${toiletId}/favorite`)
}

export async function removeFromFavorite(toiletId: string): Promise<void> {
  await apiClient.delete(`toilets/${toiletId}/favorite`)
}
