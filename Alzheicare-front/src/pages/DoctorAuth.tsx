import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import logo from '../assets/logo_alzheicare.png'

type Tab = 'login' | 'register'

export default function DoctorAuth() {
  const [tab, setTab] = useState<Tab>('login')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate('/doctor/dashboard')
  }

  const googleLogin = useGoogleLogin({
    onSuccess: () => navigate('/doctor/dashboard'),
    onError: () => console.error('Google login failed'),
  })

  return (
    <div className="min-h-screen flex" style={{ background: '#f8faff' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: '500px', height: '500px', top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(26,111,181,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: '400px', height: '400px', bottom: '0', left: '-100px', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a6fb5 0%, #1044a3 60%, #0d2f7a 100%)' }}
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
            Medical Doctor Portal
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-sm bg-white rounded-3xl p-8"
          style={{
            boxShadow: '0 25px 70px rgba(26,111,181,0.13), 0 8px 25px rgba(0,0,0,0.15)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src={logo} alt="AlzheiCare" className="h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to your doctor account</p>

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
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={{
                    background: '#f8faff',
                    border: '1.5px solid #e8eef8',
                    boxShadow: 'inset 0 2px 4px rgba(26,111,181,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #1a6fb5'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.08), 0 0 0 3px rgba(26,111,181,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e8eef8'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.04)'
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: '#f8faff',
                  border: '1.5px solid #e8eef8',
                  boxShadow: 'inset 0 2px 4px rgba(26,111,181,0.04)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #1a6fb5'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.08), 0 0 0 3px rgba(26,111,181,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1.5px solid #e8eef8'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.04)'
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: '#f8faff',
                  border: '1.5px solid #e8eef8',
                  boxShadow: 'inset 0 2px 4px rgba(26,111,181,0.04)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #1a6fb5'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.08), 0 0 0 3px rgba(26,111,181,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1.5px solid #e8eef8'
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.04)'
                }}
              />
            </div>

            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical License Number</label>
                <input
                  type="text"
                  placeholder="e.g. ML-2024-00123"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={{
                    background: '#f8faff',
                    border: '1.5px solid #e8eef8',
                    boxShadow: 'inset 0 2px 4px rgba(26,111,181,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #1a6fb5'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.08), 0 0 0 3px rgba(26,111,181,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e8eef8'
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(26,111,181,0.04)'
                  }}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg mt-1"
              style={{
                background: 'linear-gradient(135deg, #1a6fb5 0%, #1044a3 100%)',
                boxShadow: '0 4px 15px rgba(26,111,181,0.35)',
              }}
            >
              {tab === 'login' ? 'Login' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => googleLogin()}
              className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl text-sm font-medium text-gray-600 transition-all hover:scale-[1.02]"
              style={{
                border: '1.5px solid #e8eef8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </button>

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