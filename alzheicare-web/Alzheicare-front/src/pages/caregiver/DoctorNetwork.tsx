import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import Sidebar from '../../components/caregiver/Sidebar'
import {
  Search, UserPlus, Mail, Check,
  Clock, Stethoscope, Send
} from 'lucide-react'
import {
  searchDoctors,
  sendDoctorInvitation,
  sendExternalDoctorInvitation,
  type DoctorSearchResult,
} from '../../api/invitations'

interface Doctor {
  id: number
  name: string
  specialty: string
  hospital: string
  avatar: string
  status: 'none' | 'pending' | 'connected'
}

const formatDoctor = (doctor: DoctorSearchResult): Doctor => ({
  id: doctor.id,
  name: `${doctor.firstName} ${doctor.secondName}`,
  specialty: doctor.specialization,
  hospital: doctor.licenceNumber,
  avatar: `${doctor.firstName?.[0] ?? 'D'}${doctor.secondName?.[0] ?? 'D'}`,
  status: 'none',
})

const statusConfig = {
  none: {
    label: 'Connect',
    icon: UserPlus,
    style: 'bg-[#1a6fb5] text-white hover:bg-[#1557a0]',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    style: 'bg-amber-100 text-amber-600 cursor-not-allowed',
  },
  connected: {
    label: 'Connected',
    icon: Check,
    style: 'bg-emerald-100 text-emerald-600 cursor-not-allowed',
  },
}

export default function DoctorNetwork() {
  const { accessToken: token } = useAuth()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [search, setSearch] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'connected'>('search')

  useEffect(() => {
    if (!token) return

    let isMounted = true
    setLoadingDoctors(true)
    setSearchError(null)

    searchDoctors(search, token)
      .then((results) => {
        if (!isMounted) return
        setDoctors(results.map(formatDoctor))
      })
      .catch((err) => {
        if (!isMounted) return
        setSearchError(
          err instanceof Error ? err.message : 'Could not load doctors.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingDoctors(false)
      })

    return () => {
      isMounted = false
    }
  }, [search, token])

  const sendRequest = async (id: number) => {
    if (!token) return

    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'pending' } : d)),
    )

    try {
      await sendDoctorInvitation(id, token)
    } catch (err) {
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'none' } : d)),
      )
      setSearchError(
        err instanceof Error ? err.message : 'Failed to send invitation.',
      )
    }
  }

  const sendExternalInvite = async () => {
    if (!externalEmail.trim() || !token) return

    setInviteError(null)

    try {
      await sendExternalDoctorInvitation(externalEmail.trim(), token)
      setInviteSent(true)
      setExternalEmail('')
      window.setTimeout(() => setInviteSent(false), 3000)
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : 'Failed to send external invitation.',
      )
    }
  }

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  )

  const connected = doctors.filter((d) => d.status === 'connected')

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Sign in to manage invitations</h1>
          <p className="text-sm text-gray-500 mt-3">
            Doctor invitations require an authenticated caregiver session.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Doctor Network</h1>
          <p className="text-xs text-gray-400">
            Find and connect with doctors on the platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — Search & List */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Tabs */}
            <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
              {(['search', 'connected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-[#1a6fb5] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'search' ? 'Find Doctors' : `Connected (${connected.length})`}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            {activeTab === 'search' && (
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            )}

            {/* Doctor Cards */}
            <div className="flex flex-col gap-3">
              {searchError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
                  {searchError}
                </div>
              )}

              {loadingDoctors ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-500">
                  Loading doctors...
                </div>
              ) : (
                (activeTab === 'search' ? filtered : connected).map((doctor) => {
                  const { label, icon: Icon, style } = statusConfig[doctor.status]
                  return (
                    <div
                      key={doctor.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                    >
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                      >
                        {doctor.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{doctor.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#1a6fb5] font-medium">
                            {doctor.specialty}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400 truncate">
                            {doctor.hospital}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => doctor.status === 'none' && void sendRequest(doctor.id)}
                        disabled={doctor.status !== 'none'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${style}`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    </div>
                  )
                })
              )}

              {!loadingDoctors && (activeTab === 'search' ? filtered : connected).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Stethoscope size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'search' ? 'No doctors found' : 'No connected doctors yet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right — External Invite */}
          <div className="flex flex-col gap-4">

            {/* Invite Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#1a6fb5]/10">
                  <Mail size={16} className="text-[#1a6fb5]" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Invite External Doctor
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                If your doctor isn't on the platform yet, send them an invitation by email.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={externalEmail}
                  onChange={(e) => setExternalEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendExternalInvite()}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none border border-gray-100 focus:ring-2 focus:ring-[#1a6fb5] transition"
                />
                <button
                  onClick={() => void sendExternalInvite()}
                  disabled={!externalEmail.trim()}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                  <Send size={14} />
                  Send Invitation
                </button>

                {inviteError && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
                    {inviteError}
                  </div>
                )}

                {inviteSent && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <Check size={14} className="text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-medium">
                      Invitation sent successfully!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">Network Summary</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Connected', value: connected.length, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                  { label: 'Pending', value: doctors.filter((d) => d.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-100' },
                  { label: 'Available', value: doctors.filter((d) => d.status === 'none').length, color: 'text-[#1a6fb5]', bg: 'bg-[#1a6fb5]/10' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${color} ${bg}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div
              className="rounded-2xl p-4 text-white"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <UserPlus size={18} className="mb-2 opacity-80" />
              <p className="text-xs font-semibold mb-1">How it works</p>
              <p className="text-xs opacity-70 leading-relaxed">
                Send a follow request to a doctor. Once accepted, you can chat and share patient updates directly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}