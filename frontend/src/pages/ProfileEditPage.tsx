import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile, uploadAvatar } from '@/api/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AvatarUploader } from '@/components/common/AvatarUploader'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export default function ProfileEditPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nickname: user?.nickname ?? '',
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      date_of_birth: user?.date_of_birth ?? '',
    },
  })

  if (!user) {
    navigate('/login')
    return null
  }

  const onSubmit = async (data: { nickname: string; full_name: string; email: string; date_of_birth: string }) => {
    try {
      const updated = await updateProfile({
        nickname: data.nickname,
        full_name: data.full_name || null,
        email: data.email,
        date_of_birth: data.date_of_birth || null,
      })
      setUser(updated)
      addToast({ message: 'Профиль обновлён', type: 'success' })
      navigate('/profile')
    } catch {
      addToast({ message: 'Ошибка сохранения', type: 'error' })
    }
  }

  const handleAvatarUpload = async (file: File) => {
    const updated = await uploadAvatar(file)
    setUser(updated)
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Редактировать профиль</h1>
      </div>

      <div className="flex justify-center p-6">
        <AvatarUploader currentAvatarUrl={user.avatar_url} onUpload={handleAvatarUpload} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6">
        <Input label="Никнейм" {...register('nickname')} error={errors.nickname?.message} />
        <Input label="Полное имя" {...register('full_name')} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Дата рождения" type="date" {...register('date_of_birth')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </div>
  )
}
