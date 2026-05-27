import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare, Calendar, Brain, Bot, Bell, LogOut,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import logo from '../../assets/logo_alzheicare.png'

const navItems = [
  { icon: MessageSquare, label: 'Patient Messages', path: '/doctor/dashboard' },
  { icon: Calendar, label: 'Medical Calendar', path: '/doctor/calendar' },
  { icon: Brain, label: 'MRI Classifier', path: '/doctor/mri' },
  { icon: Bot, label: 'AI Assistant', path: '/doctor/ai' },
  { icon: Bell, label: 'Notifications', path: '/doctor/notifications' },
]

export default function DoctorSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col border-r border-gray-100 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f6ff 100%)' }}
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

      {/* Doctor badge */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-[#1a6fb5]/10 border border-[#1a6fb5]/20">
          <p className="text-xs font-semibold text-[#1a6fb5]">Doctor Portal</p>
          <p className="text-xs text-gray-400 truncate">Dr. A. Moreau</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#1a6fb5] text-white shadow-md shadow-[#1a6fb5]/30'
                  : 'text-gray-500 hover:bg-[#1a6fb5]/8 hover:text-[#1a6fb5]'
              }`}
            >
              <Icon size={18} className="shrink-0" />
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