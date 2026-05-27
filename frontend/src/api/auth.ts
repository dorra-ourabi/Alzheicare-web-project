const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export interface LoginResponse {
  accessToken: string
  refreshToken?: string
  user: {
    id: number
    username: string
    email: string
    role?: string
  }
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

export const loginUser = async (username: string, password: string) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) => {
  // Call auth register endpoint which returns tokens
  return request<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      email,
      password,
      firstName,
      secondName: lastName,
    }),
  })
}

export const googleLogin = async (idToken: string) =>
  request<LoginResponse>('/auth/google/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
