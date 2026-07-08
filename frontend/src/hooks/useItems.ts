import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Item } from '../lib/types'

interface ItemsResponse {
  data: Item[]
  message: string
}

/**
 * GET /items — the catalog for the order form's item picker. The list is
 * static during a session, so cache it generously and never refetch on focus.
 */
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api<ItemsResponse>('/items'),
    select: (response) => response.data,
    staleTime: Infinity,
  })
}
