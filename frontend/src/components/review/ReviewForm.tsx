import { useState } from 'react'
import { createReview, uploadReviewPhoto } from '@/api/reviews'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RatingStars } from '@/components/common/RatingStars'
import { PhotoUploader } from '@/components/common/PhotoUploader'
import { useUIStore } from '@/stores/uiStore'
import type { Review } from '@/types/review'

interface ReviewFormProps {
  toiletId: string
  onCreated: (review: Review) => void
  onCancel: () => void
}

export function ReviewForm({ toiletId, onCreated, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const { addToast } = useUIStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      addToast({ message: 'Поставьте рейтинг', type: 'error' })
      return
    }
    try {
      setIsSubmitting(true)
      const review = await createReview(toiletId, { rating, text: text || null })
      setReviewId(review.id)
      onCreated(review)
    } catch (err) {
      addToast({ message: 'Ошибка при отправке отзыва', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!reviewId) return
    const result = await uploadReviewPhoto(reviewId, file)
    setPhotoUrls((prev) => [...prev, result.url])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Рейтинг</label>
        <RatingStars rating={rating} size={24} interactive onChange={setRating} />
      </div>
      <Input
        label="Комментарий"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Поделитесь впечатлениями..."
      />
      {reviewId && (
        <PhotoUploader onUpload={handlePhotoUpload} previews={photoUrls} onRemovePreview={(i) => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))} />
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
