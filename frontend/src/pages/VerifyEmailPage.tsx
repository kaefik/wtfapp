import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyEmail } from '@/api/auth'
import { Loader } from '@/components/common/Loader'
import { useUIStore } from '@/stores/uiStore'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const token = searchParams.get('token')
  const pending = searchParams.get('pending')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>(
    token ? 'loading' : pending ? 'pending' : 'error'
  )

  useEffect(() => {
    if (!token) return
    verifyEmail(token)
      .then(() => {
        setStatus('success')
        addToast({ message: 'Email подтверждён', type: 'success' })
        setTimeout(() => navigate('/'), 2000)
      })
      .catch(() => setStatus('error'))
  }, [token, addToast, navigate])

  if (status === 'loading') return <Loader className="min-h-screen" />

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проверьте почту</h1>
          <p className="mt-2 text-gray-600">Мы отправили письмо для подтверждения email</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Email подтверждён!</h1>
          <p className="mt-2 text-gray-600">Перенаправление...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ссылка устарела</h1>
        <p className="mt-2 text-gray-600">Запросите новую ссылку для подтверждения</p>
        <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline">
          На страницу входа
        </Link>
      </div>
    </div>
  )
}
