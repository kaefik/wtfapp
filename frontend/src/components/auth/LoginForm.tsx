import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useUIStore()
  const redirect = searchParams.get('redirect') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    try {
      await login(data.email, data.password)
      const safeRedirect = redirect.startsWith('/') ? redirect : '/'
      navigate(safeRedirect)
    } catch {
      addToast({ message: 'Неверный email или пароль', type: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Вход</h1>

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
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Вход...' : 'Войти'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="text-primary-600 hover:underline">
          Забыли пароль?
        </Link>
        <Link to="/register" className="text-primary-600 hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </form>
  )
}
