import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { loginUser, createPatient, decodeToken, googleLogin as apiGoogleLogin } from '../api/auth'
import logo from '../assets/logo_alzheicare.png'

type Tab = 'login' | 'register'

export default function CaregiverAuth() {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (tab === 'register') {
        if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
          setError('All fields are required')
          setLoading(false)
          return
        }
        const parts = fullName.trim().split(/\s+/)
        const firstName = parts[0] || fullName
        const lastName = parts.slice(1).join(' ') || firstName
        const result = await createPatient({
          username,
          email,
          password,
          firstName,
          lastName,
        })
        setInfo(result.message)
        setPassword('')
        setTab('login')
      } else {
        if (!username.trim() || !password.trim()) {
          setError('Username and password are required')
          setLoading(false)
          return
        }
        const response = await loginUser(username, password)
        const payload = decodeToken(response.accessToken)
        login(response.accessToken, {
          id: String(payload.sub),
          name: payload.username,
          email: '',
          role: 'caregiver',
        })
        navigate('/caregiver/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('tab') === 'register') setTab('register')
    if (searchParams.get('registered') === 'true') setTab('register')
  }, [searchParams])

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null)
    setLoading(true)
    try {
      const response = await apiGoogleLogin(credentialResponse.credential)
      const payload = decodeToken(response.accessToken)
      login(response.accessToken, {
        id: String(payload.sub),
        name: payload.username || 'User',
        email: '',
        role: 'caregiver',
      })
      navigate('/caregiver/patient-form')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8faff' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: '500px', height: '500px', top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: '400px', height: '400px', bottom: '0', left: '-100px', background: 'radial-gradient(circle, rgba(26,111,181,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1d9e75 0%, #0f7a5a 60%, #085c40 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: 'rgba(255,255,255,0.02)' }} />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img
            src={logo}
            alt="AlzheiCare"
            className="w-64"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="w-16 h-px bg-white/30" />
          <p className="text-white/60 text-sm tracking-widest uppercase text-center">
            Family Caregiver Portal
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-sm bg-white rounded-3xl p-8"
          style={{
            boxShadow: '0 25px 70px rgba(29,158,117,0.13), 0 8px 25px rgba(0,0,0,0.15)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src={logo} alt="AlzheiCare" className="h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to your caregiver account</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
              {info}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={{
                    background: '#f8faff',
                    border: '1.5px solid #e8eef8',
                    boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #1d9e75'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e8eef8'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.04)'
                  }}
                />
              </div>
            )}

            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={{
                    background: '#f8faff',
                    border: '1.5px solid #e8eef8',
                    boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #1d9e75'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e8eef8'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.04)'
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tab === 'login' ? 'Username' : 'Email'}</label>
              <input
                type={tab === 'login' ? 'text' : 'email'}
                placeholder={tab === 'login' ? 'username' : 'your@email.com'}
                value={tab === 'login' ? username : email}
                onChange={(e) => tab === 'login' ? setUsername(e.target.value) : setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: '#f8faff',
                  border: '1.5px solid #e8eef8',
                  boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #1d9e75'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1.5px solid #e8eef8'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.04)'
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: '#f8faff',
                  border: '1.5px solid #e8eef8',
                  boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #1d9e75'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1.5px solid #e8eef8'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(29,158,117,0.04)'
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #1d9e75 0%, #0f7a5a 100%)',
                boxShadow: '0 4px 15px rgba(29,158,117,0.35)',
              }}
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Google */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
            />

          </form>

          <button
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