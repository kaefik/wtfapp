import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Edit, Trash2, CheckCircle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/common/RatingStars'
import { PhotoGallery } from '@/components/common/PhotoGallery'
import { AmenitiesBadges } from './AmenitiesBadges'
import { OpeningHours } from './OpeningHours'
import { ReviewList } from '@/components/review/ReviewList'
import type { Toilet } from '@/types/toilet'

interface ToiletDetailProps {
  toilet: Toilet
  isOwner: boolean
  onDelete: () => void
}

export function ToiletDetail({ toilet, isOwner, onDelete }: ToiletDetailProps) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 truncate text-lg font-semibold">{toilet.name}</h1>
        {isOwner && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/toilets/${toilet.id}/edit`)} className="text-gray-500 hover:text-primary-600">
              <Edit size={18} />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="text-gray-500 hover:text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {toilet.photo_urls.length > 0 && (
        <div className="border-b border-gray-100 p-4">
          <PhotoGallery photos={toilet.photo_urls} />
        </div>
      )}

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-center gap-2">
            <RatingStars rating={toilet.rating} size={20} />
            <span className="text-sm text-gray-500">({toilet.review_count} отзывов)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>{toilet.address}</span>
          {toilet.floor && <span className="text-gray-400">• {toilet.floor} этаж</span>}
        </div>

        <div className="flex items-center gap-2">
          {toilet.is_open ? (
            <Badge variant="success">Открыто</Badge>
          ) : (
            <Badge variant="danger">Закрыто</Badge>
          )}
          <Badge variant={toilet.is_free ? 'success' : 'default'}>
            {toilet.is_free ? 'Бесплатный' : `${toilet.price ?? ''} ${toilet.currency ?? ''}`}
          </Badge>
        </div>

        <AmenitiesBadges toilet={toilet} />

        {toilet.opening_hours.length > 0 && <OpeningHours hours={toilet.opening_hours} />}

        {toilet.description && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">Как найти</h3>
            <p className="text-sm text-gray-600">{toilet.description}</p>
          </div>
        )}

        {toilet.location_hint && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">Описание входа</h3>
            <p className="text-sm text-gray-600">{toilet.location_hint}</p>
          </div>
        )}

        <Button variant="outline" className="w-full gap-2">
          <CheckCircle size={16} />
          Подтвердить актуальность
        </Button>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Отзывы</h2>
          </div>
          <ReviewList toiletId={toilet.id} />
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Удалить туалет?</h3>
            <p className="mt-2 text-sm text-gray-600">Это действие можно отменить только модератору.</p>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Отмена
              </Button>
              <Button variant="danger" className="flex-1" onClick={onDelete}>
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
