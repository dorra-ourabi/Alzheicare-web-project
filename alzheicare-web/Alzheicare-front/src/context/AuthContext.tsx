import { useEffect, useState, type ReactNode } from 'react'
import {
  ACCESS_TOKEN_KEY,
  AuthContext,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  buildAuthUser,
  type AuthUser,
} from './auth-context'
import type { AuthTokens } from '../lib/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    const savedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (!savedAccessToken || !savedRefreshToken) {
      return
    }

    setAccessToken(savedAccessToken)
    setRefreshToken(savedRefreshToken)

    if (savedUser) {
      try {
        setUser(buildAuthUser(savedAccessToken, JSON.parse(savedUser) as AuthUser))
        return
      } catch {
        // fall back to the decoded token if localStorage data is stale
      }
    }

    setUser(buildAuthUser(savedAccessToken))
  }, [])

  const login = (tokens: AuthTokens, newUser?: AuthUser) => {
    const resolvedUser = newUser ?? buildAuthUser(tokens.accessToken)

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(resolvedUser))

    setAccessToken(tokens.accessToken)
    setRefreshToken(tokens.refreshToken)
    setUser(resolvedUser)
  }

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout, isAuthenticated: !!accessToken }}>{children}</AuthContext.Provider>
}