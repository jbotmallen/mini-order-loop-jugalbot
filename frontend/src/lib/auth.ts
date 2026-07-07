import type { User } from './types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Fired whenever stored auth changes. Lets AuthProvider stay in sync when
 * auth is cleared from outside React — e.g. the 401 handler in api.ts.
 */
export const AUTH_CHANGED_EVENT = 'auth:changed'

function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  notifyAuthChanged()
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  notifyAuthChanged()
}
