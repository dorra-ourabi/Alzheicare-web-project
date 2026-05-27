const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'INVITATION_RECEIVED'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REJECTED'
  | 'CALENDAR_REMINDER'
  | 'MEDICATION_DUE'
  | 'SYSTEM'

export interface NotificationDto {
  id: number
  userId: number
  type: NotificationType
  title: string
  body?: string | null
  isRead: boolean
  referenceId?: number | null
  referenceType?: string | null
  createdAt: string
  readAt?: string | null
}

export interface NotificationStreamMessage {
  type: 'notification:new'
  notification: NotificationDto
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

export const fetchNotifications = async (token: string | null) =>
  request<NotificationDto[]>('/notifications', undefined, token)

export const fetchUnreadCount = async (token: string | null) =>
  request<{ unreadCount: number }>('/notifications/unread-count', undefined, token)

export const markNotificationRead = async (id: number, token: string | null) =>
  request<NotificationDto>(`/notifications/${id}/read`, { method: 'PATCH' }, token)

export const markAllNotificationsRead = async (token: string | null) =>
  request<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }, token)

export const deleteNotification = async (id: number, token: string | null) =>
  request<{ deleted: boolean }>(`/notifications/${id}`, { method: 'DELETE' }, token)

export const openNotificationsStream = (token: string) =>
  new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`)
