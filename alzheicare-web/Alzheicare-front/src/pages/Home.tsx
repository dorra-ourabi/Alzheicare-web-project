import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Calendar, MessageSquare, Shield, Stethoscope, Users } from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated || !user) {
    return null
  }

  const isDoctor = user.role === 'doctor'
  const primaryPath = isDoctor ? '/doctor/dashboard' : '/caregiver/dashboard'

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(26,111,181,0.08)] border border-gray-100 overflow-hidden">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1a6fb5]">Account home</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Welcome back, {user.firstName || user.username}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500">
                Your email is verified and your account is active. Use the portal below to continue inside the platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(primaryPath)}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5 0%, #1044a3 100%)' }}
                >
                  Enter my workspace
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Back to public home
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Feature icon={Shield} title="Verified account" text="Your email is confirmed and the session is active." />
                <Feature icon={MessageSquare} title="Messages" text="Open your inbox and conversations from your workspace." />
                <Feature icon={Calendar} title="Calendar" text="Track appointments and daily care events." />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a6fb5] via-[#1557a0] to-[#0f3a7a] p-8 sm:p-10 lg:p-12 text-white">
              <div className="h-full flex flex-col justify-between gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Signed in as</p>
                  <div className="mt-4 rounded-3xl bg-white/10 border border-white/10 p-5 backdrop-blur-sm">
                    <p className="text-2xl font-bold">{user.username}</p>
                    <p className="mt-1 text-sm text-white/75">Role: {user.role}</p>
                    <p className="mt-1 text-sm text-white/75">Email: {user.email || 'not available'}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Shortcut icon={isDoctor ? Stethoscope : Users} label={isDoctor ? 'Doctor dashboard' : 'Caregiver dashboard'} onClick={() => navigate(primaryPath)} />
                  <Shortcut icon={Brain} label="AI assistant" onClick={() => navigate(isDoctor ? '/doctor/ai' : '/caregiver/ai')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl bg-[#f8faff] p-4 border border-[#e8eef8]">
      <Icon size={18} className="text-[#1a6fb5]" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
    </div>
  )
}

function Shortcut({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 text-left transition hover:bg-white/15"
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}