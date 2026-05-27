import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createDoctor, createPatient } from '../api/auth'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const roleParam = (searchParams.get('role') === 'doctor' ? 'doctor' : 'caregiver') as
    | 'doctor'
    | 'caregiver'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      if (!username || !email || !password || !fullName) {
        setError('All fields are required')
        setLoading(false)
        return
      }

      const parts = fullName.trim().split(/\s+/)
      const firstName = parts[0] || fullName
      const lastName = parts.slice(1).join(' ') || firstName
      const payload = { username, email, password, firstName, lastName }

      const res =
        roleParam === 'doctor'
          ? await createDoctor(payload)
          : await createPatient(payload)

      setInfo(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow">
        <h2 className="text-xl font-bold mb-2">Create an account</h2>
        <p className="text-sm text-gray-500 mb-4">Role: {roleParam}</p>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {info && (
          <div className="mb-3 p-3 rounded text-sm bg-emerald-50 border border-emerald-200 text-emerald-700">
            {info}
            <button
              type="button"
              onClick={() => navigate(roleParam === 'doctor' ? '/doctor/auth' : '/caregiver/auth')}
              className="block mt-2 text-emerald-800 underline"
            >
              Back to login
            </button>
          </div>
        )}

        {!info && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="p-3 border rounded" />
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="p-3 border rounded" />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border rounded" />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 border rounded" />

            <button className="p-3 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Please wait...' : 'Register'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
