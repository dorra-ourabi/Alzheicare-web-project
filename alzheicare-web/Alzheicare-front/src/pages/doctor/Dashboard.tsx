import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorSidebar from '../../components/doctor/Sidebar'
import StatsBar from '../../components/doctor/StatsBar'
import PatientInbox, { type DoctorThread } from '../../components/doctor/PatientInbox'
import MRIClassifier from '../../components/doctor/MRIClassifier'
import { useAuth } from '../../context/useAuth'
import { ApiError } from '../../lib/api'

type DoctorOverview = {
  doctor: {
    firstName: string
    secondName: string
    username: string
    email: string
    specialization: string | null
    licenceNumber: string | null
  }
  stats: {
    activePatients: number
    unreadMessages: number
    todaysAppointments: number
    pendingReviews: number
  }
  threads: DoctorThread[]
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { accessToken, user } = useAuth()
  const [data, setData] = useState<DoctorOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugOpen, setDebugOpen] = useState(false)

  const storedToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') ||
        localStorage.getItem('ACCESS_TOKEN_KEY') ||
        localStorage.getItem('alzheicare_access_token')
      : null
  const effectiveToken = accessToken ?? storedToken

  useEffect(() => {
    const stored = localStorage.getItem('accessToken')
    if (!accessToken && !stored) {
      navigate('/', { replace: true })
      return
    }

    const token = accessToken ?? stored

    setLoading(true)
    setError('')

    fetch(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'}/dashboard/doctor/overview`, {
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) {
          throw new ApiError(payload?.message || response.statusText || 'Failed to load doctor dashboard', response.status, payload)
        }
        return payload as DoctorOverview
      })
      .then((response) => setData(response))
      .catch((caughtError) => {
        const message = caughtError instanceof ApiError ? caughtError.message : 'Failed to load doctor dashboard'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [accessToken, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-sm text-gray-500">
        Loading doctor dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Doctor dashboard unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 rounded-2xl bg-[#1a6fb5] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Doctor Dashboard</h1>
              {data?.doctor ? (
                <p className="text-xs text-gray-400">
                  Welcome back, Dr. {data.doctor.firstName ?? data.doctor.username}{' '}
                  {data.doctor.secondName ?? ''}
                </p>
              ) : user ? (
                <p className="text-xs text-gray-400">
                  Welcome back, Dr. {user.firstName ?? user.username} {user.secondName ?? ''}
                </p>
              ) : (
                <p className="text-xs text-gray-400">Welcome back</p>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setDebugOpen((s) => !s)}
                className="text-xs text-gray-500 rounded px-3 py-1 border border-gray-200 bg-white/60 hover:bg-white"
              >
                {debugOpen ? 'Hide debug' : 'Show debug'}
              </button>
            </div>
          </div>

          {debugOpen && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-100 text-xs text-gray-700">
              <div className="mb-2">
                <strong>Effective token:</strong>
                <div className="break-all text-[11px] text-gray-600 mt-1">{effectiveToken ?? '<no token found>'}</div>
              </div>
              <div>
                <strong>Overview payload (raw):</strong>
                <pre className="mt-2 max-h-48 overflow-auto text-[11px] bg-gray-50 p-2 rounded">{data ? JSON.stringify(data, null, 2) : '<no data>'}</pre>
                {error ? <div className="mt-2 text-red-500">Error: {error}</div> : null}
              </div>
            </div>
          )}
        </div>

        <StatsBar stats={data?.stats} />
        <PatientInbox threads={data?.threads} />

        <div className="mt-6">
          <MRIClassifier />
        </div>
      </main>
    </div>
  )
}