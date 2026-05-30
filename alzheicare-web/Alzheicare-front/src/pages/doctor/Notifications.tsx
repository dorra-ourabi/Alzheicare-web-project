import { useState } from 'react'
import DoctorSidebar from '../../components/doctor/Sidebar'
import NotificationItem from '../../components/shared/NotificationItem'
import { UserPlus, Calendar, Brain, Bell } from 'lucide-react'

interface Notification {
  id: number
  type: 'request' | 'appointment' | 'mri'
  title: string
  description: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: 'request',
    title: 'New Connection Request',
    description: 'Sophie Thompson sent you a follow request',
    time: 'Just now',
    read: false,
  },
  {
    id: 2,
    type: 'appointment',
    title: 'Appointment in 1 Hour',
    description: 'Check-up with Margaret J. Thompson at 10:30 AM. Caregiver: Sophie Thompson.',
    time: '09:30',
    read: false,
  },
  {
    id: 3,
    type: 'request',
    title: 'New Connection Request',
    description: 'Marie Dupont sent you a follow request',
    time: 'Yesterday',
    read: false,
  },
  {
    id: 4,
    type: 'appointment',
    title: 'Upcoming Appointment',
    description: 'Consultation with Robert H. Chen scheduled for April 18 at 09:00 AM.',
    time: 'Apr 14',
    read: true,
  },
  {
    id: 5,
    type: 'mri',
    title: 'MRI Classification Done',
    description: 'Scan classified as Moderate stage with 91% confidence.',
    time: 'Apr 13',
    read: true,
  },
]

const typeConfig = {
  request: { icon: UserPlus, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
  appointment: { icon: Calendar, iconBg: 'bg-violet-100', iconColor: 'text-violet-500' },
  mri: { icon: Brain, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
}

type Filter = 'all' | 'unread' | Notification['type']

export default function DoctorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [filter, setFilter] = useState<Filter>('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotif = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'request', label: 'Requests' },
    { key: 'appointment', label: 'Appointments' },
    { key: 'mri', label: 'MRI Results' },
  ]

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />
      <main className="flex-1 p-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-[#1a6fb5] font-medium hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-[#1a6fb5] text-white shadow-md shadow-[#1a6fb5]/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[#1a6fb5]/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No notifications here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((notif) => {
              const { icon, iconBg, iconColor } = typeConfig[notif.type]
               // Cas spécial : request non lue → affiche Accept / Decline
              if (notif.type === 'request' && !notif.read) {
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-4 p-4 rounded-2xl border bg-white border-[#1a6fb5]/20 shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl shrink-0 bg-emerald-100">
                      <UserPlus size={18} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                        <span className="text-xs text-gray-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        {notif.description}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => markRead(notif.id)}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#1a6fb5] hover:bg-[#1557a0] transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => deleteNotif(notif.id)}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-400 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#1a6fb5] shrink-0 mt-1.5" />
                  </div>
                )
              }

              // Cas normal → NotificationItem standard
              return (
                <NotificationItem
                  key={notif.id}
                  icon={icon}
                  iconBg={iconBg}
                  iconColor={iconColor}
                  title={notif.title}
                  description={notif.description}
                  time={notif.time}
                  read={notif.read}
                  onRead={() => markRead(notif.id)}
                  onDelete={() => deleteNotif(notif.id)}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}