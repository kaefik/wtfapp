import { apiClient } from './client'
import type { Toilet } from '@/types/toilet'
import type { Review } from '@/types/review'
import type { PaginatedResponse } from '@/types/api'

export async function getUserToilets(userId: string, cursor?: string, limit = 10): Promise<PaginatedResponse<Toilet>> {
  const searchParams: Record<string, string> = { limit: String(limit) }
  if (cursor) searchParams.cursor = cursor
  return apiClient.get(`users/${userId}/toilets`, { searchParams }).json<PaginatedResponse<Toilet>>()
}

export async function getUserReviews(userId: string, cursor?: string, limit = 10): Promise<PaginatedResponse<Review>> {
  const searchParams: Record<string, string> = { limit: String(limit) }
  if (cursor) searchParams.cursor = cursor
  return apiClient.get(`users/${userId}/reviews`, { searchParams }).json<PaginatedResponse<Review>>()
}
