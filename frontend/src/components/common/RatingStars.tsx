import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number | null
  maxStars?: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function RatingStars({ rating, maxStars = 5, size = 16, interactive = false, onChange }: RatingStarsProps) {
  const currentRating = rating ?? 0

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Рейтинг: ${currentRating} из ${maxStars}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starRating = i + 1
        const filled = starRating <= currentRating
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starRating)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform disabled:opacity-100`}
            aria-label={`${starRating} звёзд`}
          >
            <Star
              size={size}
              className={filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        )
      })}
    </div>
  )
}
