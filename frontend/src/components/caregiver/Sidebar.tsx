import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Calendar, MapPin,
  Brain, Bell, Bot, Users, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import logo from '../../assets/logo_alzheicare.png'
import { fetchUnreadCount, openNotificationsStream, type NotificationStreamMessage } from '../../api/notifications'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/caregiver/dashboard' },
  { icon: Users, label: 'Doctor Network', path: '/caregiver/network' },
  { icon: MessageSquare, label: 'Chat', path: '/caregiver/chat' },
  { icon: Calendar, label: 'Calendar', path: '/caregiver/calendar' },
  { icon: MapPin, label: 'Live Map', path: '/caregiver/map' },
  { icon: Brain, label: 'Cognitive Games', path: '/caregiver/games' },
  { icon: Bot, label: 'AI Assistant', path: '/caregiver/ai' },
  { icon: Bell, label: 'Bell', path: '/caregiver/notifications', key: 'notifications' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()

  useEffect(() => {
    let active = true
    if (!token) return

    fetchUnreadCount(token)
      .then(({ unreadCount: count }) => {
        if (active) setUnreadCount(count)
      })
      .catch(() => {})

    const handleRefresh = () => {
      fetchUnreadCount(token)
        .then(({ unreadCount: count }) => {
          if (active) setUnreadCount(count)
        })
        .catch(() => {})
    }

    window.addEventListener('notifications:refresh', handleRefresh)
    return () => {
      active = false
      window.removeEventListener('notifications:refresh', handleRefresh)
    }
  }, [token, location.pathname])

  useEffect(() => {
    if (!token) return
    const source = openNotificationsStream(token)

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationStreamMessage
        if (payload.type === 'notification:new') {
          setUnreadCount((prev) => prev + 1)
        }
      } catch {
        // Ignore malformed SSE payloads.
      }
    }

    source.onerror = () => {
      source.close()
    }

    return () => {
      source.close()
    }
  }, [token])

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
        {!collapsed && <img src={logo} alt="AlzheiCare" className="h-5" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 py-4 flex-1">
        {navItems.map(({ icon: Icon, label, path, key }) => {
          const active = location.pathname === path
          const showBadge = key === 'notifications' && unreadCount > 0
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#1a6fb5] text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className="relative">
                <Icon size={18} className="shrink-0" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-100">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 w-full transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}