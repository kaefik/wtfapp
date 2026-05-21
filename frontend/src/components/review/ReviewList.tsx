import { useState, useCallback, useRef } from 'react'
import { getReviews } from '@/api/reviews'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { Loader } from '@/components/common/Loader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import type { Review } from '@/types/review'

interface ReviewListProps {
  toiletId: string
}

export function ReviewList({ toiletId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const loaded = useRef(false)

  const loadReviews = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true)
      const result = await getReviews(toiletId, cursor)
      if (cursor) {
        setReviews((prev) => [...prev, ...result.items])
      } else {
        setReviews(result.items)
      }
      setNextCursor(result.next_cursor)
    } catch {
    } finally {
      setIsLoading(false)
      loaded.current = true
    }
  }, [toiletId])

  useState(() => {
    loadReviews()
  })

  const handleReviewCreated = (review: Review) => {
    setReviews((prev) => [review, ...prev])
    setShowForm(false)
  }

  return (
    <div>
      {!isAuthenticated ? (
        <p className="text-sm text-gray-500">
          <button onClick={() => navigate(`/login?redirect=/toilets/${toiletId}`)} className="text-primary-600 hover:underline">
            Войдите
          </button>
          , чтобы оставить отзыв
        </p>
      ) : !showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          Написать отзыв
        </Button>
      ) : (
        <ReviewForm toiletId={toiletId} onCreated={handleReviewCreated} onCancel={() => setShowForm(false)} />
      )}

      <div className="mt-4 space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {isLoading && <Loader className="py-4" />}

      {nextCursor && !isLoading && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => loadReviews(nextCursor)}>
          Показать ещё
        </Button>
      )}
    </div>
  )
}
