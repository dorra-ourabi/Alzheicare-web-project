import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import CalendarGrid from '../../components/shared/CalendarGrid'
import { Plus, Clock, CalendarCheck, AlertCircle, Pencil, Trash2, Link } from 'lucide-react'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarAuthUrl,
  fetchGoogleCalendarEvents,
  fetchLocalCalendarEvents,
  updateCalendarEvent,
  type CalendarEventDto,
  type GoogleCalendarEventDto,
} from '../../api/calendar'
import { useAuth } from '../../context/useAuth'

import { API_BASE_URL } from '../../lib/api'

interface CalendarItem {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  notifyBefore?: number
  category?: 'medicine' | 'appointment' | 'mundane'
  repeatDaily?: boolean
  repeatUntil?: string
  seriesId?: string
  source: 'local' | 'google'
  googleEventId?: string
}

const CATEGORY_STYLES = {
  medicine: {
    label: 'Medicine',
    badge: 'bg-purple-100 text-purple-600',
    card: 'bg-purple-50 border-purple-100',
    icon: 'bg-purple-100 text-purple-600',
  },
  appointment: {
    label: 'Appointment',
    badge: 'bg-blue-100 text-blue-600',
    card: 'bg-blue-50 border-blue-100',
    icon: 'bg-blue-100 text-blue-600',
  },
  mundane: {
    label: 'Mundane',
    badge: 'bg-emerald-100 text-emerald-600',
    card: 'bg-emerald-50 border-emerald-100',
    icon: 'bg-emerald-100 text-emerald-600',
  },
}

// Events synced from Google Calendar are shown in a neutral grey.
const GOOGLE_STYLE = {
  badge: 'bg-gray-200 text-gray-600',
  card: 'bg-gray-100 border-gray-200',
  icon: 'bg-gray-200 text-gray-500',
}

const toInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalEvent = (event: CalendarEventDto): CalendarItem => ({
  id: event.id,
  title: event.title,
  description: event.description,
  startTime: new Date(event.startTime),
  endTime: new Date(event.endTime),
  notifyBefore: event.notifyBefore,
  category: event.category,
  repeatDaily: event.repeatDaily,
  repeatUntil: event.repeatUntil,
  seriesId: event.seriesId,
  source: 'local',
  googleEventId: event.googleEventId,
})

const parseGoogleEvent = (event: GoogleCalendarEventDto): CalendarItem | null => {
  const startRaw = event.start?.dateTime ?? event.start?.date
  const endRaw = event.end?.dateTime ?? event.end?.date
  if (!startRaw) return null

  const startTime = new Date(startRaw)
  const endTime = endRaw ? new Date(endRaw) : startTime

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return null
  }

  return {
    id: event.id,
    title: event.summary || 'Untitled Google Event',
    description: event.description,
    startTime,
    endTime,
    category: 'appointment',
    source: 'google',
  }
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export default function CaregiverCalendar() {
  const { accessToken: token } = useAuth()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate())
  const [localEvents, setLocalEvents] = useState<CalendarEventDto[]>([])
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => toInputDate(new Date()))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('09:45')
  const [notifyBefore, setNotifyBefore] = useState(30)
  const [category, setCategory] = useState<'medicine' | 'appointment' | 'mundane'>('appointment')
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [repeatUntil, setRepeatUntil] = useState(() => toInputDate(new Date()))
  const [applyToSeries, setApplyToSeries] = useState(false)

  const loadEvents = useCallback(
    async (silent = false) => {
      if (!token) {
        setError('Please sign in to view your calendar.')
        setGoogleError('')
        if (!silent) setLoading(false)
        return
      }

      if (!silent) {
        setLoading(true)
      }
      setError(null)
      setGoogleError(null)

      try {
        const local = await fetchLocalCalendarEvents(token)
        setLocalEvents(local)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load events'
        setError(message)
      }

      try {
        const google = await fetchGoogleCalendarEvents(token)
        setGoogleEvents(google)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google Calendar is not connected'
        setGoogleError(message)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (!token) {
      return
    }

    let isActive = true
    let retryTimeout: number | undefined
    let stream: EventSource | null = null

    const connect = () => {
      if (!isActive) {
        return
      }

      const streamUrl = new URL(`${API_BASE_URL}/calendar/events/stream`)
      streamUrl.searchParams.set('token', token)
      stream = new EventSource(streamUrl.toString())

      stream.onmessage = (event) => {
        if (event.data) {
          loadEvents(true)
        }
      }

      stream.onerror = () => {
        stream?.close()
        stream = null
        if (isActive) {
          retryTimeout = window.setTimeout(connect, 3000)
        }
      }
    }

    loadEvents()
    connect()

    return () => {
      isActive = false
      if (retryTimeout) {
        window.clearTimeout(retryTimeout)
      }
      stream?.close()
    }
  }, [loadEvents, token])

  useEffect(() => {
    const clampedDay = Math.min(
      selectedDay,
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(),
    )
    if (clampedDay !== selectedDay) {
      setSelectedDay(clampedDay)
    }
    setDate(toInputDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), clampedDay)))
  }, [currentDate, selectedDay])

  const parsedLocalEvents = useMemo(() => localEvents.map(parseLocalEvent), [localEvents])

  const parsedGoogleEvents = useMemo(() => {
    const parsed = googleEvents
      .map(parseGoogleEvent)
      .filter((event): event is CalendarItem => event !== null)

    const localGoogleIds = new Set(
      parsedLocalEvents.map((event) => event.googleEventId).filter(Boolean),
    )

    return parsed.filter((event) => !localGoogleIds.has(event.id))
  }, [googleEvents, parsedLocalEvents])

  const combinedEvents = useMemo(
    () => [...parsedLocalEvents, ...parsedGoogleEvents],
    [parsedLocalEvents, parsedGoogleEvents],
  )

  const eventDays = useMemo(() => {
    const days = new Set<number>()
    combinedEvents.forEach((event) => {
      if (
        event.startTime.getFullYear() === currentDate.getFullYear() &&
        event.startTime.getMonth() === currentDate.getMonth()
      ) {
        days.add(event.startTime.getDate())
      }
    })
    return [...days]
  }, [combinedEvents, currentDate])

  const dayEvents = useMemo(
    () =>
      combinedEvents
        .filter(
          (event) =>
            event.startTime.getFullYear() === currentDate.getFullYear() &&
            event.startTime.getMonth() === currentDate.getMonth() &&
            event.startTime.getDate() === selectedDay,
        )
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [combinedEvents, currentDate, selectedDay],
  )

  const monthLabel = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setNotifyBefore(30)
    setCategory('appointment')
    setRepeatDaily(false)
    setRepeatUntil(toInputDate(new Date()))
    setApplyToSeries(false)
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowAdd(true)
  }

  const openEdit = (event: CalendarItem) => {
    if (event.source !== 'local') return
    setEditingId(event.id)
    setTitle(event.title)
    setDescription(event.description || '')
    setDate(toInputDate(event.startTime))
    setStartTime(event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
    setEndTime(event.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
    setNotifyBefore(event.notifyBefore ?? 30)
    setCategory(event.category ?? 'appointment')
    setRepeatDaily(Boolean(event.repeatDaily))
    setRepeatUntil(event.repeatUntil ? toInputDate(new Date(event.repeatUntil)) : toInputDate(event.startTime))
    setApplyToSeries(Boolean(event.repeatDaily))
    setShowAdd(true)
  }

  const saveEvent = async () => {
    if (!token) {
      setError('Please sign in to manage events.')
      return
    }

    if (!title.trim()) {
      setError('Please add a title for the event.')
      return
    }

    const start = new Date(`${date}T${startTime}:00`)
    const end = new Date(`${date}T${endTime}:00`)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Please enter valid start and end times.')
      return
    }

    if (end <= start) {
      setError('End time must be after the start time.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateCalendarEvent(
          editingId,
          {
            title: title.trim(),
            description: description.trim() || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            notifyBefore,
            category,
            repeatDaily,
            repeatUntil: repeatDaily ? new Date(`${repeatUntil}T00:00:00`).toISOString() : undefined,
          },
          token,
          applyToSeries ? 'series' : 'single',
        )

        if (Array.isArray(updated)) {
          const seriesId = updated[0]?.seriesId
          setLocalEvents((prev) => {
            const filtered = seriesId ? prev.filter((item) => item.seriesId !== seriesId) : prev
            return [...filtered, ...updated]
          })
        } else {
          setLocalEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
      } else {
        const created = await createCalendarEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notifyBefore,
          category,
          repeatDaily,
          repeatUntil: repeatDaily ? new Date(`${repeatUntil}T00:00:00`).toISOString() : undefined,
        }, token)
        setLocalEvents((prev) => [...prev, ...created])
      }
      setShowAdd(false)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save event'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const removeEvent = async (
    eventId: string,
    scope: 'single' | 'series' = 'single',
    seriesId?: string,
  ) => {
    if (!token) {
      setError('Please sign in to manage events.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await deleteCalendarEvent(eventId, token, scope)
      if (scope === 'series' && seriesId) {
        setLocalEvents((prev) => prev.filter((event) => event.seriesId !== seriesId))
      } else {
        setLocalEvents((prev) => prev.filter((event) => event.id !== eventId))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const connectGoogle = async () => {
    if (!token) {
      setError('Please sign in to connect Google Calendar.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { url } = await fetchCalendarAuthUrl(token)
      window.location.assign(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start Google Calendar connection'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_#f5f7ff,_#edf3fb_40%,_#f4f7fb_100%)]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Caregiver Calendar</h1>
            <p className="text-xs text-gray-400">Medication reminders, appointments, and daily care notes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <Plus size={15} />
              Add Event
            </button>
            <button
              onClick={connectGoogle}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1a6fb5] bg-white border border-[#1a6fb5]/20 hover:border-[#1a6fb5]/40 transition"
            >
              Connect Google
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-4">
            <CalendarGrid
              currentDate={currentDate}
              onPrev={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              onNext={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              eventDays={eventDays}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              accentColor="#1a6fb5"
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Calendar Sync</p>
              {googleError ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Link size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Not connected</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      This calendar is not connected to your Google Calendar account.
                      To synchronize your events, you can connect it.
                    </p>
                    <button
                      onClick={connectGoogle}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1a6fb5] bg-[#1a6fb5]/10 hover:bg-[#1a6fb5]/20 transition"
                    >
                      <Link size={12} />
                      Connect Google Calendar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a6fb5]/10 flex items-center justify-center">
                    <CalendarCheck size={18} className="text-[#1a6fb5]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Local + Google events</p>
                    <p className="text-xs text-gray-400">Connected and syncing</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Legend</p>
              <div className="flex flex-col gap-2">
                {Object.entries(CATEGORY_STYLES).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${value.badge}`}>
                      {value.label}
                    </span>
                    <span className="text-xs text-gray-400">Local</span>
                  </div>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600">
                  Google
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">{monthLabel} {selectedDay}</h2>
                  <p className="text-xs text-gray-400">{dayEvents.length} events scheduled</p>
                </div>
                {loading && (
                  <span className="text-xs text-gray-400">Syncing...</span>
                )}
              </div>

              {showAdd && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-3 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Title
                      <input
                        type="text"
                        placeholder="Event title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Date
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                    Description
                    <textarea
                      placeholder="Description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5] resize-none"
                      rows={2}
                    />
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Start time
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      End time
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Reminder (minutes)
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={notifyBefore}
                        onChange={(e) => setNotifyBefore(Number(e.target.value))}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                        placeholder="Notify (min)"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Category
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'medicine' | 'appointment' | 'mundane')}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      >
                        <option value="medicine">Medicine</option>
                        <option value="appointment">Appointment</option>
                        <option value="mundane">Mundane activity</option>
                      </select>
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
                      <input
                        id="repeat-daily-caregiver"
                        type="checkbox"
                        checked={repeatDaily}
                        onChange={(e) => setRepeatDaily(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="repeat-daily-caregiver" className="text-sm text-gray-600">
                        Repeat daily
                      </label>
                    </div>
                  </div>
                  {repeatDaily && editingId && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
                      <input
                        id="apply-series-caregiver"
                        type="checkbox"
                        checked={applyToSeries}
                        onChange={(e) => setApplyToSeries(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="apply-series-caregiver" className="text-sm text-gray-600">
                        Apply changes to entire series
                      </label>
                    </div>
                  )}
                  {repeatDaily && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      Repeat until
                      <input
                        type="date"
                        value={repeatUntil}
                        onChange={(e) => setRepeatUntil(e.target.value)}
                        className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none border border-gray-200 focus:ring-2 focus:ring-[#1a6fb5]"
                      />
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={saveEvent}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-[#1a6fb5] hover:bg-[#1557a0] transition"
                      disabled={loading}
                    >
                      {editingId ? 'Update' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAdd(false)
                        resetForm()
                      }}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No events for this day</p>
                  <p className="text-xs text-gray-300 mt-1">Create a reminder to keep care on track</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dayEvents.map((event) => {
                    const style =
                      event.source === 'google'
                        ? GOOGLE_STYLE
                        : CATEGORY_STYLES[event.category ?? 'appointment']
                    return (
                    <div
                      key={`${event.source}-${event.id}`}
                      className={`flex items-start gap-4 p-4 rounded-2xl border shadow-sm ${style.card}`}
                    >
                      <div className={`p-2 rounded-xl ${style.icon}`}>
                        <Clock size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {event.source === 'google' ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOOGLE_STYLE.badge}`}>
                            Google
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              CATEGORY_STYLES[event.category ?? 'appointment'].badge
                            }`}
                          >
                            {CATEGORY_STYLES[event.category ?? 'appointment'].label}
                          </span>
                        )}
                        {event.source === 'local' && (
                          <span className="text-xs text-gray-400">
                            {event.notifyBefore ?? 30} min reminder
                          </span>
                        )}
                        {event.source === 'local' && event.repeatDaily && event.repeatUntil && (
                          <span className="text-xs text-gray-400">
                            Daily until {new Date(event.repeatUntil).toLocaleDateString('en-US')}
                          </span>
                        )}
                        {event.source === 'local' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(event)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => removeEvent(event.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                            {event.repeatDaily && event.seriesId && (
                              <button
                                onClick={() => removeEvent(event.id, 'series', event.seriesId)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
                              >
                                Delete series
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
