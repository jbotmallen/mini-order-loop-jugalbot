import { clearAuth, getToken } from './auth'

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Fetch wrapper for the Laravel API: attaches the Sanctum bearer token,
 * parses JSON, and throws ApiError with the server's message on failure.
 * A 401 clears stored auth so route guards can bounce to /login.
 * Used as the base for all react-query queryFn/mutationFn calls.
 */
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) clearAuth()
    throw new ApiError(
      response.status,
      body?.message ?? `Request failed (${response.status})`,
    )
  }

  return body as T
}
