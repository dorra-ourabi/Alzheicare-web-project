import { API_BASE_URL, apiRequestWithAuth } from '../lib/api'

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

export interface GeofenceAlertPayload {
  lat: number
  lng: number
  address?: string
  homeAddress?: string
  updatedAt?: string
}

const request = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null,
): Promise<T> => apiRequestWithAuth<T>(path, options, token)

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

export const sendGeofenceAlert = async (
  payload: GeofenceAlertPayload,
  token: string | null,
) =>
  request<{ sent: boolean; mapsLink: string }>(
    '/notifications/geofence-alert',
    { method: 'POST', body: JSON.stringify(payload) },
    token,
  )

export const acknowledgeGeofenceAlert = async (token: string | null) =>
  request<{ suppressed: boolean; ttlSeconds: number }>(
    '/notifications/geofence-alert/ack',
    { method: 'POST' },
    token,
  )

export const openNotificationsStream = (token: string) =>
  new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`)
