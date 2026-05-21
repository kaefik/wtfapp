import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'

const registerSchema = z.object({
  nickname: z.string().min(2, 'Мин. 2 символа').max(50, 'Макс. 50 символов'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Мин. 8 символов'),
})

type RegisterData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterData) => {
    try {
      await registerUser(data.nickname, data.email, data.password)
      navigate('/verify-email?pending=1')
    } catch {
      addToast({ message: 'Ошибка регистрации', type: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>

      <Input
        label="Никнейм"
        placeholder="Ваш никнейм"
        {...register('nickname')}
        error={errors.nickname?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Пароль"
        type="password"
        placeholder="Мин. 8 символов"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-primary-600 hover:underline">
          Войти
        </Link>
      </p>
    </form>
  )
}
