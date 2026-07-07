import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/context/auth-context'

/**
 * Read the current auth session. Throws if used outside <AuthProvider> so a
 * missing provider fails loudly instead of silently returning null.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
