import { createContext } from 'react'
import type { User } from '@/lib/types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  /** Persist a fresh session and update state (called after login). */
  login: (token: string, user: User) => void
  /** Clear the session and update state (called on logout / 401). */
  logout: () => void
}

/**
 * App-wide auth session. Kept in its own file (no component export) so React
 * Fast Refresh stays happy — the provider lives in AuthProvider.tsx and the
 * consumer hook in hooks/useAuth.ts.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
