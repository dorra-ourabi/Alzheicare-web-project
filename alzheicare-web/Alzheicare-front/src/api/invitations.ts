import { API_BASE_URL } from '../lib/api'

const request = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }

  return res.json() as Promise<T>
}

export interface DoctorSearchResult {
  id: number
  firstName: string
  secondName: string
  licenceNumber: string
  specialization: string
}

export interface DoctorInvitationResponse {
  id: number
  patientId: number
  doctorId?: number
  doctorEmail?: string
  status: string
  message?: string | null
  createdAt: string
}

export interface MyInvitationResponse {
  id: number
  patientId: number
  doctorId?: number | null
  doctorEmail?: string | null
  status: string
  message?: string | null
  doctor?: {
    id: number
    user: DoctorSearchResult
  } | null
}

export type InvitationStatus = 'ACCEPTED' | 'REJECTED'

export const searchDoctors = async (
  query: string,
  token: string | null,
): Promise<DoctorSearchResult[]> =>
  request<DoctorSearchResult[]>(
    `/invitations/search-doctors?q=${encodeURIComponent(query)}`,
    undefined,
    token,
  )

export const respondToInvitation = async (
  invitationId: number,
  status: InvitationStatus,
  token: string | null,
): Promise<DoctorInvitationResponse> =>
  request<DoctorInvitationResponse>(
    `/invitations/${invitationId}/respond`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    token,
  )

export const sendDoctorInvitation = async (
  doctorId: number,
  token: string | null,
): Promise<DoctorInvitationResponse> =>
  request<DoctorInvitationResponse>(
    '/invitations',
    {
      method: 'POST',
      body: JSON.stringify({ doctorId }),
    },
    token,
  )

export const sendExternalDoctorInvitation = async (
  doctorEmail: string,
  token: string | null,
): Promise<DoctorInvitationResponse> =>
  request<DoctorInvitationResponse>(
    '/invitations',
    {
      method: 'POST',
      body: JSON.stringify({ doctorEmail }),
    },
    token,
  )

export const fetchMyInvitations = async (
  token: string | null,
): Promise<MyInvitationResponse[]> => request<MyInvitationResponse[]>('/invitations/mine', undefined, token)
