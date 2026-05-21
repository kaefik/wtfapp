import { RatingStars } from '@/components/common/RatingStars'
import type { Review } from '@/types/review'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="border-b border-gray-100 pb-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
          {review.user_avatar_url && <img src={review.user_avatar_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{review.user_nickname}</p>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>
      <div className="mt-1">
        <RatingStars rating={review.rating} size={14} />
      </div>
      {review.text && <p className="mt-1 text-sm text-gray-600">{review.text}</p>}
      {review.photo_urls.length > 0 && (
        <div className="mt-2 flex gap-2">
          {review.photo_urls.map((url) => (
            <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  )
}
