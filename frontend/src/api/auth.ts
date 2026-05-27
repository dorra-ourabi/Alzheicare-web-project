const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type BackendRole = 'Patient' | 'Doctor'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface RegisterResult {
  success: true
  message: string
}

export interface TokenPayload {
  sub: number
  username: string
  role: string
  sessionId?: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export const decodeToken = (token: string): TokenPayload => {
  const [, payload] = token.split('.')
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as TokenPayload
}

export const loginUser = async (username: string, password: string) =>
  request<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const create = async (payload: CreateUserPayload, role: BackendRole) =>
  request<RegisterResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      secondName: payload.lastName,
      role,
    }),
  })

export const createPatient = async (payload: CreateUserPayload) =>
  create(payload, 'Patient')

export const createDoctor = async (payload: CreateUserPayload) =>
  create(payload, 'Doctor')

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: BackendRole = 'Patient',
) => create({ username, email, password, firstName, lastName }, role)

export const googleLogin = async (idToken: string) =>
  request<AuthTokens>('/auth/google/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
