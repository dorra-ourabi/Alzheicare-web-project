import { createContext } from 'react'
import { buildAuthUser, type AuthTokens, type AuthUser } from '../lib/auth'

export interface AuthContextType {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  login: (tokens: AuthTokens, user?: AuthUser) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const ACCESS_TOKEN_KEY = 'accessToken'
export const REFRESH_TOKEN_KEY = 'refreshToken'
export const USER_KEY = 'user'

export { buildAuthUser }
export type { AuthUser }