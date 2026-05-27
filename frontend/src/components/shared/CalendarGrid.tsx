import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarGridProps {
  currentDate: Date
  onPrev: () => void
  onNext: () => void
  eventDays: number[]
  selectedDay: number | null
  onSelectDay: (day: number) => void
  accentColor: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarGrid({
  currentDate, onPrev, onNext, eventDays, selectedDay, onSelectDay, accentColor
}: CalendarGridProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
  const todayDate = today.getDate()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onPrev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-800">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={onNext} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const hasEvent = eventDays.includes(day)
          const isToday = isCurrentMonth && day === todayDate
          const isSelected = day === selectedDay

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm transition-all ${
                isSelected
                  ? 'text-white shadow-md'
                  : isToday
                  ? 'bg-gray-100 text-gray-800 font-semibold'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
              style={isSelected ? { background: accentColor } : {}}
            >
              {day}
              {hasEvent && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ background: isSelected ? 'white' : accentColor }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}