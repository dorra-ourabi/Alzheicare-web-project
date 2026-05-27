import { type LucideIcon } from 'lucide-react'

interface NotificationItemProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  description: string
  time: string
  read: boolean
  onRead: () => void
  onDelete: () => void
}

export default function NotificationItem({
  icon: Icon, iconBg, iconColor, title, description, time, read, onRead, onDelete
}: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
        read ? 'bg-white border-gray-100 opacity-70' : 'bg-white border-[#1a6fb5]/20 shadow-sm'
      }`}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${read ? 'text-gray-500' : 'text-gray-800'}`}>
            {title}
          </p>
          <span className="text-xs text-gray-400 shrink-0">{time}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        {!read && (
          <button
            onClick={onRead}
            className="text-xs text-[#1a6fb5] hover:underline"
          >
            Mark read
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-xs text-gray-300 hover:text-red-400 transition"
        >
          Delete
        </button>
      </div>

      {!read && (
        <span className="w-2 h-2 rounded-full bg-[#1a6fb5] shrink-0 mt-1.5" />
      )}
    </div>
  )
}