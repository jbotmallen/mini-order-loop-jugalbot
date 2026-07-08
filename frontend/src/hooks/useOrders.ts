import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  OrderDetail,
  OrderStatus,
  OrderSummary,
  PaginationMeta,
  TransitionAction,
} from '../lib/types'

export interface OrdersFilters {
  status: OrderStatus | ''
  search: string
  /** 1-based page; the server paginates at 10 rows/page. */
  page: number
}

interface OrdersResponse {
  data: OrderSummary[]
  meta: PaginationMeta
  message: string
}

/**
 * GET /orders with status + search filters, server-paginated. Filters and
 * page are part of the query key so each combination is cached separately;
 * previous data is kept while a new page/filter loads to avoid table flicker.
 * Returns both the page rows and the paginator meta the pager needs.
 */
export function useOrders(filters: OrdersFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      if (filters.page > 1) params.set('page', String(filters.page))
      const qs = params.toString()
      return api<OrdersResponse>(`/orders${qs ? `?${qs}` : ''}`)
    },
    select: (response) => ({ orders: response.data, meta: response.meta }),
    placeholderData: keepPreviousData,
  })
}

interface OrderDetailResponse {
  order: Omit<OrderDetail, 'total'>
  total: string | number
  message: string
}

/**
 * GET /orders/:id — full detail (lines, activity log, requester). The grand
 * total lives at the top level of the response; we fold it onto the order so
 * consumers get a single OrderDetail object.
 */
export function useOrder(id: string | number | null | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api<OrderDetailResponse>(`/orders/${id}`),
    enabled: !!id,
    select: (response): OrderDetail => ({ ...response.order, total: response.total }),
  })
}

export interface OrderLinePayload {
  item_id: number
  qty: number
}

export interface OrderWritePayload {
  remarks: string | null
  lines: OrderLinePayload[]
}

interface OrderWriteResponse {
  message: string
  order: Omit<OrderDetail, 'total' | 'activities'>
}

/**
 * POST /orders — create a draft. Invalidates the list so the new order
 * appears without a manual reload. Navigation/toast are left to the caller.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OrderWritePayload) =>
      api<OrderWriteResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * PUT /orders/:id — replace a draft's remarks + lines (owner + draft only,
 * enforced server-side). Invalidates both this order and the list.
 */
export function useUpdateOrder(id: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OrderWritePayload) =>
      api<OrderWriteResponse>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export interface TransitionVars {
  action: TransitionAction
  /** Required when action is 'reject'. */
  reason?: string
  /** Optional when action is 'cancel'. */
  note?: string
}

interface TransitionResponse {
  message: string
  order: Omit<OrderDetail, 'total'>
}

/**
 * POST /orders/:id/transitions — run one loop transition. On success we
 * invalidate this order and the list so badges/stock/activity update without
 * a manual reload. The server is the enforcement layer; a rejected transition
 * comes back as an ApiError (403/422) for the caller to surface.
 */
export function useOrderTransition(id: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: TransitionVars) =>
      api<TransitionResponse>(`/orders/${id}/transitions`, {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * POST /orders/:id/transitions with action=submit, keyed by id at call time
 * (not bind time) so the order form can save a draft and immediately submit
 * the id it just got back. The submit guard (≥1 line, qty ≥ 1) is enforced
 * server-side; a failure comes back as an ApiError for the caller to surface.
 */
export function useSubmitOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<TransitionResponse>(`/orders/${id}/transitions`, {
        method: 'POST',
        body: JSON.stringify({ action: 'submit' }),
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['order', String(id)] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

