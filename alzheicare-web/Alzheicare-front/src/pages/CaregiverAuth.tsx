import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_alzheicare.png'
import { useAuth } from '../context/useAuth'
import { apiRequest, ApiError } from '../lib/api'
import { buildAuthUser, type AuthTokens } from '../lib/auth'

type Tab = 'login' | 'register'

type CaregiverForm = {
  username: string
  firstName: string
  secondName: string
  email: string
  password: string
  phoneNumber: string
}

const initialForm: CaregiverForm = {
  username: '',
  firstName: '',
  secondName: '',
  email: '',
  password: '',
  phoneNumber: '',
}

export default function CaregiverAuth() {
  const [tab, setTab] = useState<Tab>('login')
  const [form, setForm] = useState<CaregiverForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationNotice, setVerificationNotice] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const update = (field: keyof CaregiverForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const redirectForRole = (role: 'doctor' | 'caregiver') => {
    navigate(role === 'doctor' ? '/doctor/dashboard' : '/caregiver/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setVerificationNotice('')
    setLoading(true)

    try {
      const response = await apiRequest<AuthTokens>(
        tab === 'login' ? '/auth/login' : '/auth/register/patient',
        {
          method: 'POST',
          body:
            tab === 'login'
              ? JSON.stringify({ username: form.username, password: form.password })
              : JSON.stringify({
                  username: form.username,
                  firstName: form.firstName,
                  secondName: form.secondName,
                  email: form.email,
                  password: form.password,
                  phoneNumber: form.phoneNumber || undefined,
                }),
        },
      )

      const user = buildAuthUser(response.accessToken, {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        secondName: form.secondName,
        backendRole: 'Patient',
      })

      if (tab === 'login') {
        login(response, user)
        redirectForRole(user.role)
      } else {
        setVerificationNotice(
          'We have sent a verification email to your inbox. Please check your mail and click Verify my email to enter your account.',
        )
        setForm((prev) => ({ ...prev, password: '' }))
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError ? caughtError.message : 'Authentication failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential: string | undefined) => {
    if (!credential) {
      setError('Google login did not return a credential.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await apiRequest<AuthTokens>('/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ idToken: credential, role: 'Patient' }),
      })

      const user = buildAuthUser(response.accessToken)
      login(response, user)
      redirectForRole(user.role)
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError ? caughtError.message : 'Google login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8faff' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: '500px', height: '500px', top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: '400px', height: '400px', bottom: '0', left: '-100px', background: 'radial-gradient(circle, rgba(26,111,181,0.06) 0%, transparent 70%)' }} />
      </div>

      <div
        className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1d9e75 0%, #0f7a5a 60%, #085c40 100%)' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: 'rgba(255,255,255,0.02)' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <img src={logo} alt="AlzheiCare" className="w-64" style={{ filter: 'brightness(0) invert(1)' }} />
          <div className="w-16 h-px bg-white/30" />
          <p className="text-white/60 text-sm tracking-widest uppercase text-center">Family Caregiver Portal</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-sm bg-white rounded-3xl p-8"
          style={{ boxShadow: '0 25px 70px rgba(29,158,117,0.13), 0 8px 25px rgba(0,0,0,0.15)' }}
        >
          <div className="flex justify-center mb-6 lg:hidden">
            <img src={logo} alt="AlzheiCare" className="h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to your caregiver account or create one</p>

          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          {verificationNotice ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {verificationNotice}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'register' && (
              <>
                <Field label="Username" value={form.username} onChange={(value) => update('username', value)} placeholder="caregiver01" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" value={form.firstName} onChange={(value) => update('firstName', value)} placeholder="Jane" />
                  <Field label="Second Name" value={form.secondName} onChange={(value) => update('secondName', value)} placeholder="Doe" />
                </div>
                <Field label="Email" value={form.email} onChange={(value) => update('email', value)} placeholder="caregiver@example.com" type="email" />
                <Field label="Phone Number" value={form.phoneNumber} onChange={(value) => update('phoneNumber', value)} placeholder="+1 555 000 0000" />
              </>
            )}

            {tab === 'login' && (
              <Field label="Username" value={form.username} onChange={(value) => update('username', value)} placeholder="caregiver01" />
            )}

            <Field label="Password" value={form.password} onChange={(value) => update('password', value)} placeholder="••••••••" type="password" />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg mt-1 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #1d9e75 0%, #0f7a5a 100%)', boxShadow: '0 4px 15px rgba(29,158,117,0.35)' }}
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  void handleGoogleSuccess(credentialResponse.credential)
                }}
                onError={() => setError('Google login failed')}
              />
            </div>
          </form>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-center text-xs text-gray-400 mt-6 hover:text-gray-600 transition"
          >
            ← Back to portal selection
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
        style={{ background: '#f8faff', border: '1.5px solid #e8eef8', boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)' }}
      />
    </div>
  )
}