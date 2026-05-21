import { apiClient } from './client'
import type { Review, ReviewCreate } from '@/types/review'
import type { PaginatedResponse } from '@/types/api'

export async function getReviews(toiletId: string, cursor?: string, limit = 10): Promise<PaginatedResponse<Review>> {
  const searchParams: Record<string, string> = { limit: String(limit) }
  if (cursor) searchParams.cursor = cursor
  return apiClient.get(`toilets/${toiletId}/reviews`, { searchParams }).json<PaginatedResponse<Review>>()
}

export async function createReview(toiletId: string, data: ReviewCreate): Promise<Review> {
  return apiClient.post(`toilets/${toiletId}/reviews`, { json: data }).json<Review>()
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`reviews/${reviewId}`)
}

export async function uploadReviewPhoto(reviewId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post(`reviews/${reviewId}/photos`, { body: formData }).json<{ url: string }>()
}
