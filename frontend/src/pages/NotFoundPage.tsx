import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { MapPin } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState
        icon={<MapPin size={48} />}
        title="Страница не найдена"
        description="404"
        action={<Button onClick={() => navigate('/')}>На карту</Button>}
      />
    </div>
  )
}
