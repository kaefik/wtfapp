import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getToilet, deleteToilet } from '@/api/toilets'
import { ToiletDetail } from '@/components/toilet/ToiletDetail'
import { Skeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Toilet } from '@/types/toilet'

export default function ToiletPage() {
  const { id } = useParams<{ id: string }>()
  const [toilet, setToilet] = useState<Toilet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<number | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  useEffect(() => {
    if (!id) return
    getToilet(id)
      .then(setToilet)
      .catch((err) => {
        if (err?.response?.status === 404 || err?.response?.status === 410) {
          setError(err.response.status)
        } else {
          setError(500)
        }
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteToilet(id)
      addToast({ message: 'Туалет удалён', type: 'success' })
      navigate('/')
    } catch {
      addToast({ message: 'Ошибка удаления', type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error === 404 || error === 410) {
    return (
      <EmptyState
        icon={<MapPin size={48} />}
        title="Туалет не найден"
        description={error === 410 ? 'Туалет больше не существует' : 'Туалет не найден'}
        action={<Button onClick={() => navigate('/')}>На карту</Button>}
      />
    )
  }

  if (!toilet) {
    return (
      <EmptyState
        title="Ошибка загрузки"
        action={<Button onClick={() => navigate('/')}>На карту</Button>}
      />
    )
  }

  const isOwner = user?.id === toilet.created_by || user?.role === 'moderator' || user?.role === 'admin'

  return <ToiletDetail toilet={toilet} isOwner={isOwner} onDelete={handleDelete} />
}
