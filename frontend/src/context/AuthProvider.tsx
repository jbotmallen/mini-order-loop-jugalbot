import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import {
  AUTH_CHANGED_EVENT,
  clearAuth,
  getToken,
  getUser,
  storeAuth,
} from '@/lib/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

/**
 * Holds the auth session in React state so the whole tree re-renders on login
 * and logout — no manual page reload. localStorage (via lib/auth) is the
 * persistence layer underneath; this provider mirrors it into state and
 * re-syncs on the auth:changed event (e.g. a 401 clearing auth from api.ts)
 * and on cross-tab `storage` events.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getUser)
  const [token, setToken] = useState<string | null>(getToken)

  const login = useCallback((nextToken: string, nextUser: User) => {
    storeAuth(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const sync = () => {
      setToken(getToken())
      setUser(getUser())
    }
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: !!token && !!user, login, logout }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
