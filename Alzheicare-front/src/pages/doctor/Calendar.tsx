import { useState } from 'react'
import DoctorSidebar from '../../components/doctor/Sidebar'
import CalendarGrid from '../../components/shared/CalendarGrid'
import { Plus, Clock, User, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface Appointment {
  id: number
  day: number
  patient: string
  caregiver: string
  time: string
  type: 'follow-up' | 'consultation' | 'emergency' | 'personal'
  done: boolean
}

const initialAppointments: Appointment[] = [
  { id: 1, day: 15, patient: 'Margaret J. Thompson', caregiver: 'Sophie Thompson', time: '10:30', type: 'follow-up', done: false },
  { id: 2, day: 15, patient: 'Robert H. Chen', caregiver: 'David Chen', time: '14:00', type: 'consultation', done: false },
  { id: 3, day: 18, patient: 'Elaine M. Dupont', caregiver: 'Marie Dupont', time: '09:00', type: 'emergency', done: false },
  { id: 4, day: 22, patient: 'Margaret J. Thompson', caregiver: 'Sophie Thompson', time: '11:30', type: 'follow-up', done: false },
  { id: 5, day: 26, patient: 'Robert H. Chen', caregiver: 'David Chen', time: '15:00', type: 'consultation', done: false },
]

const typeConfig = {
  'follow-up': { color: 'bg-blue-100 text-blue-600', label: 'Follow-up' },
  consultation: { color: 'bg-violet-100 text-violet-600', label: 'Consultation' },
  emergency: { color: 'bg-red-100 text-red-600', label: 'Emergency' },
  personal: { color: 'bg-emerald-100 text-emerald-600', label: 'Personal' },
}

export default function DoctorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3))
  const [selectedDay, setSelectedDay] = useState<number>(15)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [showAdd, setShowAdd] = useState(false)
  const [newPatient, setNewPatient] = useState('')
  const [newCaregiver, setNewCaregiver] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newType, setNewType] = useState<Appointment['type']>('consultation')

  const eventDays = [...new Set(appointments.map((a) => a.day))]
  const dayAppointments = appointments.filter((a) => a.day === selectedDay)

  const toggleDone = (id: number) => {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, done: !a.done } : a))
  }

  const deleteAppointment = (id: number) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  const addAppointment = () => {
    if (!newPatient.trim()) return
    setAppointments((prev) => [
      ...prev,
      {
        id: Date.now(),
        day: selectedDay,
        patient: newPatient,
        caregiver: newCaregiver,
        time: newTime,
        type: newType,
        done: false,
      }
    ])
    setNewPatient('')
    setNewCaregiver('')
    setShowAdd(false)
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Medical Calendar</h1>
          <p className="text-xs text-gray-400">Your appointments with patients & caregivers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Calendar */}
          <div className="lg:col-span-2">
            <CalendarGrid
              currentDate={currentDate}
              onPrev={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              onNext={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              eventDays={eventDays}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              accentColor="#1a6fb5"
            />

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">This Month</p>
              <div className="flex flex-col gap-2">
                {Object.entries(typeConfig).map(([key, { color, label }]) => {
                  const count = appointments.filter((a) => a.type === key).length
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                      <span className="text-sm font-semibold text-gray-600">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Appointments Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">April {selectedDay}, 2026</h2>
                  <p className="text-xs text-gray-400">{dayAppointments.length} appointments</p>
                </div>
                <button
                  onClick={() => setShowAdd(!showAdd)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                  <Plus size={15} />
                  Add Appointment
                </button>
              </div>

              {/* Add Form */}
              {showAdd && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-3 border border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    {(['consultation', 'follow-up', 'emergency', 'personal'] as Appointment['type'][]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`py-1.5 rounded-lg text-xs font-medium capitalize transition ${
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
                    placeholder="Patient name"
                    value={newPatient}
                    onChange={(e) => setNewPatient(e.target.value)}
                    className="bg-white rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                  />
                  <input
                    type="text"
                    placeholder="Caregiver name (optional"
                    value={newCaregiver}
                    onChange={(e) => setNewCaregiver(e.target.value)}
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
                      onClick={addAppointment}
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

              {/* Appointments List */}
              {dayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No appointments for this day</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dayAppointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appt) => (
                      <div
                        key={appt.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          appt.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'
                        }`}
                      >
                        <button onClick={() => toggleDone(appt.id)}>
                          {appt.done
                            ? <CheckCircle2 size={20} className="text-[#1a6fb5]" />
                            : <Circle size={20} className="text-gray-300" />
                          }
                        </button>
                        <div className="p-2 rounded-xl bg-[#1a6fb5]/10">
                          <User size={16} className="text-[#1a6fb5]" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${appt.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {appt.patient}
                          </p>
                          <p className="text-xs text-gray-400">
                            {appt.caregiver ? `Caregiver: ${appt.caregiver} · ` : ''}{appt.time}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig[appt.type].color}`}>
                          {typeConfig[appt.type].label}
                        </span>
                        <button
                          onClick={() => deleteAppointment(appt.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}