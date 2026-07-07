import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { OrderStatus, OrderSummary } from '../lib/types'

export interface OrdersFilters {
  status: OrderStatus | ''
  search: string
}

interface OrdersResponse {
  data: OrderSummary[]
  message: string
}

/**
 * GET /orders with status + search filters. Filters are part of the query
 * key so each combination is cached separately; previous data is kept
 * while a new filter loads to avoid table flicker.
 */
export function useOrders(filters: OrdersFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      const qs = params.toString()
      return api<OrdersResponse>(`/orders${qs ? `?${qs}` : ''}`)
    },
    select: (response) => response.data,
    placeholderData: keepPreviousData,
  })
}

export interface OrderDetailResponse {
  order: {
    id: number
    number: string
    status: OrderStatus
    remarks: string | null
    user_id: number
    created_at: string
    requester: { id: number; name: string }
  }
  message: string
}

export function useOrder(id: string | number | null | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api<OrderDetailResponse>(`/orders/${id}`),
    enabled: !!id,
    select: (response) => response.order,
  })
}

