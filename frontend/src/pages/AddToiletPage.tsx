import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ToiletForm } from '@/components/toilet/ToiletForm'
import { createToilet, updateToilet, getToilet } from '@/api/toilets'
import { useUIStore } from '@/stores/uiStore'
import { useEffect } from 'react'
import type { Toilet, ToiletCreate } from '@/types/toilet'

export default function AddToiletPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<Toilet | undefined>()

  const isEdit = Boolean(id)

  useEffect(() => {
    if (id) {
      getToilet(id).then(setInitialData).catch(() => navigate('/'))
    }
  }, [id, navigate])

  const handleSubmit = async (data: ToiletCreate) => {
    setIsSubmitting(true)
    try {
      const toilet = id
        ? await updateToilet(id, data)
        : await createToilet(data)
      addToast({ message: id ? 'Туалет обновлён' : 'Туалет добавлен', type: 'success' })
      navigate(`/toilets/${toilet.id}`)
    } catch {
      addToast({ message: 'Ошибка сохранения', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Редактировать туалет' : 'Добавить туалет'}</h1>
      </div>
      <ToiletForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
