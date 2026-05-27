import { useState } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import CalendarGrid from '../../components/shared/CalendarGrid'
import { Plus, Pill, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react'

interface Event {
  id: number
  day: number
  type: 'medication' | 'appointment' | 'task'
  title: string
  time: string
  done: boolean
}

const initialEvents: Event[] = [
  { id: 1, day: 15, type: 'medication', title: 'Metformin 500mg', time: '07:30', done: true },
  { id: 2, day: 15, type: 'medication', title: 'Lisinopril 10mg', time: '08:00', done: true },
  { id: 3, day: 15, type: 'appointment', title: 'Dr. Moreau — Check-up', time: '10:30', done: false },
  { id: 4, day: 15, type: 'task', title: 'Morning walk', time: '09:00', done: false },
  { id: 5, day: 18, type: 'medication', title: 'Aspirin 81mg', time: '07:30', done: false },
  { id: 6, day: 20, type: 'appointment', title: 'Neurologist visit', time: '14:00', done: false },
  { id: 7, day: 22, type: 'task', title: 'Memory exercises', time: '11:00', done: false },
  { id: 8, day: 26, type: 'medication', title: 'Metformin 500mg', time: '07:30', done: false },
]

const typeConfig = {
  medication: { color: 'bg-blue-100 text-blue-600', icon: Pill, label: 'Medication' },
  appointment: { color: 'bg-violet-100 text-violet-600', icon: Clock, label: 'Appointment' },
  task: { color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2, label: 'Task' },
}

export default function CaregiverCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3))
  const [selectedDay, setSelectedDay] = useState<number>(15)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('08:00')
  const [newType, setNewType] = useState<Event['type']>('medication')

  const eventDays = [...new Set(events.map((e) => e.day))]
  const dayEvents = events.filter((e) => e.day === selectedDay)

  const toggleDone = (id: number) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, done: !e.done } : e))
  }

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const addEvent = () => {
    if (!newTitle.trim()) return
    setEvents((prev) => [
      ...prev,
      { id: Date.now(), day: selectedDay, type: newType, title: newTitle, time: newTime, done: false }
    ])
    setNewTitle('')
    setShowAdd(false)
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
          <p className="text-xs text-gray-400">Medications, appointments & daily tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Calendar */}
          <div className="lg:col-span-1">
            <CalendarGrid
              currentDate={currentDate}
              onPrev={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              onNext={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              eventDays={eventDays}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              accentColor="#1a6fb5"
            />

            {/* Legend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Legend</p>
              <div className="flex flex-col gap-2">
                {Object.entries(typeConfig).map(([key, { color, label }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">
                    April {selectedDay}, 2026
                  </h2>
                  <p className="text-xs text-gray-400">{dayEvents.length} events scheduled</p>
                </div>
                <button
                  onClick={() => setShowAdd(!showAdd)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                  <Plus size={15} />
                  Add Event
                </button>
              </div>

              {/* Add Event Form */}
              {showAdd && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-3 border border-gray-100">
                  <div className="flex gap-2">
                    {(['medication', 'appointment', 'task'] as Event['type'][]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                          newType === t
                            ? 'bg-[#1a6fb5] text-white'
                            : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-white rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="bg-white rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addEvent}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-[#1a6fb5] hover:bg-[#1557a0] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Events List */}
              {dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No events for this day</p>
                  <p className="text-xs text-gray-300 mt-1">Click "Add Event" to schedule something</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dayEvents
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((event) => {
                      const { color, icon: Icon } = typeConfig[event.type]
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                            event.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'
                          }`}
                        >
                          <button onClick={() => toggleDone(event.id)}>
                            {event.done
                              ? <CheckCircle2 size={20} className="text-[#1a6fb5]" />
                              : <Circle size={20} className="text-gray-300" />
                            }
                          </button>
                          <div className={`p-2 rounded-xl ${color.split(' ')[0]}`}>
                            <Icon size={16} className={color.split(' ')[1]} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${event.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-400">{event.time}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                            {typeConfig[event.type].label}
                          </span>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}