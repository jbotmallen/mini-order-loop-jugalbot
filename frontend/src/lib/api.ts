import { clearAuth, getToken } from './auth'

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const REQUEST_TIMEOUT_MS = 10_000

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
 * Used as the base for all react-query queryFn/mutationFn calls.
 */
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (cause) {
    throw new ApiError(
      0,
      cause instanceof DOMException && cause.name === 'TimeoutError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check that the backend is running.',
    )
  }

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
