import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerUser } from '../api/auth'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()

  const roleParam = searchParams.get('role') || 'caregiver'
  const registered = searchParams.get('registered') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!username || !email || !password || !fullName) {
        setError('All fields are required')
        setLoading(false)
        return
      }

      const [firstName, lastName] = fullName.split(' ')
      // call API (returns tokens)
      const res = await registerUser(username, email, password, firstName || fullName, lastName || '')

      // If API returns tokens and user, auto-login; otherwise navigate to a check-email page
      if (res?.accessToken && res.user) {
        login(res.accessToken, {
          id: String(res.user.id),
          name: `${res.user.username}`,
          email: res.user.email,
          role: roleParam as 'caregiver' | 'doctor',
        })
        navigate(roleParam === 'doctor' ? '/doctor/dashboard' : '/caregiver/patient-form')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow">
        {!registered ? (
          <>
            <h2 className="text-xl font-bold mb-2">Create an account</h2>
            <p className="text-sm text-gray-500 mb-4">Role: {roleParam}</p>

            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="p-3 border rounded" />
              <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="p-3 border rounded" />
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border rounded" />
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 border rounded" />

              <button className="p-3 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Please wait...' : 'Register'}</button>
            </form>
          </>
        ) : (
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Check your email</h3>
            <p className="text-sm text-gray-600">A verification email has been sent. Click the link to activate your account.</p>
          </div>
        )}
      </div>
    </div>
  )
}
