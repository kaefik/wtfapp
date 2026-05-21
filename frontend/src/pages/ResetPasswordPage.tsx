import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { resetPassword } from '@/api/auth'
import { useUIStore } from '@/stores/uiStore'

const resetSchema = z.object({
  password: z.string().min(8, 'Мин. 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type ResetData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data: ResetData) => {
    if (!token) {
      addToast({ message: 'Неверная ссылка', type: 'error' })
      return
    }
    try {
      await resetPassword(token, data.password)
      addToast({ message: 'Пароль сброшен. Войдите с новым паролем.', type: 'success' })
      navigate('/login')
    } catch {
      addToast({ message: 'Ошибка сброса пароля', type: 'error' })
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <p className="text-gray-600">Неверная ссылка для сброса пароля</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Сброс пароля</h1>
        <Input label="Новый пароль" type="password" {...register('password')} error={errors.password?.message} />
        <Input label="Подтвердите пароль" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сбросить пароль'}
        </Button>
      </form>
    </div>
  )
}
