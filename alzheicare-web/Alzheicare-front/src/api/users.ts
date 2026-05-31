import { apiRequestWithAuth } from '../lib/api'

export interface UserLocationPayload {
  address?: string
  currentPosition?: {
    lat: number
    lng: number
    address?: string
    updatedAt?: string
  }
}

export interface MeUserResponse {
  id: number
  patient?: {
    address?: string | null
  } | null
}

const request = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null,
): Promise<T> => apiRequestWithAuth<T>(path, options, token)

export const fetchMe = (token: string | null) =>
  request<MeUserResponse>('/users/me', undefined, token)

export const updateMyLocation = (
  payload: UserLocationPayload,
  token: string | null,
) =>
  request<MeUserResponse>('/users/me/location', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token)