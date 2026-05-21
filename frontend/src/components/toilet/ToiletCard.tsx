import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/common/RatingStars'
import { formatDistance } from '@/utils/distance'
import type { Toilet } from '@/types/toilet'

interface ToiletCardProps {
  toilet: Toilet
}

export function ToiletCard({ toilet }: ToiletCardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/toilets/${toilet.id}`)}
      className="w-full rounded-lg border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{toilet.name}</h3>
        {toilet.distance !== undefined && (
          <span className="flex-shrink-0 text-sm text-gray-500">{formatDistance(toilet.distance)}</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
        <MapPin size={14} />
        <span className="truncate">{toilet.address}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <RatingStars rating={toilet.rating} size={14} />
        <span className="text-xs text-gray-400">({toilet.review_count})</span>
        {toilet.is_open ? (
          <Badge variant="success">Открыто</Badge>
        ) : (
          <Badge variant="danger">Закрыто</Badge>
        )}
      </div>
      {toilet.is_free !== undefined && (
        <div className="mt-2">
          <Badge variant={toilet.is_free ? 'success' : 'default'}>
            {toilet.is_free ? 'Бесплатный' : ` ${toilet.price ?? ''} ${toilet.currency ?? ''}`}
          </Badge>
        </div>
      )}
    </button>
  )
}
