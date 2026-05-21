import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { forgotPassword } from '@/api/auth'
import { useUIStore } from '@/stores/uiStore'
import { Link } from 'react-router-dom'

const forgotSchema = z.object({
  email: z.string().email('Введите корректный email'),
})

type ForgotData = z.infer<typeof forgotSchema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const { addToast } = useUIStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotData) => {
    try {
      await forgotPassword(data.email)
      setSent(true)
    } catch {
      addToast({ message: 'Ошибка. Попробуйте позже.', type: 'error' })
    }
  }

  if (sent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Письмо отправлено</h1>
        <p className="mt-2 text-sm text-gray-600">Проверьте почту и следуйте инструкциям</p>
        <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Забыли пароль?</h1>
      <p className="text-sm text-gray-500">Введите email, и мы отправим ссылку для сброса пароля</p>

      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="text-primary-600 hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  )
}
