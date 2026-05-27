const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export interface CalendarEventDto {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  notifyBefore?: number
  notificationSent?: boolean
  googleEventId?: string
  category?: 'medicine' | 'appointment' | 'mundane'
  repeatDaily?: boolean
  repeatUntil?: string
  seriesId?: string
}

export interface GoogleCalendarEventDto {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

export interface CreateCalendarEventInput {
  title: string
  description?: string
  startTime: string
  endTime: string
  notifyBefore?: number
  category?: 'medicine' | 'appointment' | 'mundane'
  repeatDaily?: boolean
  repeatUntil?: string
  seriesId?: string
}

export interface UpdateCalendarEventInput {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  notifyBefore?: number
  category?: 'medicine' | 'appointment' | 'mundane'
  repeatDaily?: boolean
  repeatUntil?: string
  seriesId?: string
}

const request = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null,
): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const fetchLocalCalendarEvents = async (token: string | null) =>
  request<CalendarEventDto[]>('/calendar/events/local', undefined, token)

export const fetchGoogleCalendarEvents = async (token: string | null) =>
  request<GoogleCalendarEventDto[]>('/calendar/events', undefined, token)

export const createCalendarEvent = async (payload: CreateCalendarEventInput, token: string | null) =>
  request<CalendarEventDto[]>('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)

export const updateCalendarEvent = async (
  id: string,
  payload: UpdateCalendarEventInput,
  token: string | null,
  scope: 'single' | 'series' = 'single',
) =>
  request<CalendarEventDto | CalendarEventDto[]>(`/calendar/events/${id}?scope=${scope}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token)

export const deleteCalendarEvent = async (
  id: string,
  token: string | null,
  scope: 'single' | 'series' = 'single',
) =>
  request<{ deleted: boolean; deletedCount?: number }>(`/calendar/events/${id}?scope=${scope}`, {
    method: 'DELETE',
  }, token)

export const fetchCalendarAuthUrl = async (token: string | null) =>
  request<{ url: string }>('/calendar/auth/url', undefined, token)
