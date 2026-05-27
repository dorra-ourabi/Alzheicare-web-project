import { Users, MessageSquare, Calendar, Activity } from 'lucide-react'

const stats = [
  { icon: Users, label: 'Active Patients', value: '12', color: 'text-[#1a6fb5]', bg: 'bg-[#1a6fb5]/10' },
  { icon: MessageSquare, label: 'Unread Messages', value: '5', color: 'text-violet-500', bg: 'bg-violet-100' },
  { icon: Calendar, label: "Today's Appointments", value: '3', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { icon: Activity, label: 'Pending Reviews', value: '2', color: 'text-amber-500', bg: 'bg-amber-100' },
]

export default function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon size={18} className={color} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}