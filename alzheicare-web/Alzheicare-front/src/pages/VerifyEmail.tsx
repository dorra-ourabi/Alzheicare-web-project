import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { apiRequest } from '../lib/api'
import { buildAuthUser, type AuthTokens } from '../lib/auth'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { login } = useAuth()
  const params = new URLSearchParams(search)
  const token = params.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Verification token missing')
      setLoading(false)
      return
    }

    apiRequest<AuthTokens>('/auth/verify-email?token=' + encodeURIComponent(token), { method: 'GET' })
      .then((response) => {
        const user = buildAuthUser(response.accessToken)
        login(response, user)
        navigate('/home', { replace: true })
      })
      .catch((err) => {
        setError(err?.message || 'Verification failed')
      })
      .finally(() => setLoading(false))
  }, [token, navigate])

  if (loading) return <div className="p-8">Verifying your email...</div>

  if (error)
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Email verification failed</h2>
        <p className="mt-3 text-sm text-gray-600">{error}</p>
      </div>
    )

  return null
}
