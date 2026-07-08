export type Role = 'requester' | 'approver'

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'fulfilled'
  | 'closed'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'fulfilled',
  'closed',
  'cancelled',
]

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  user: User
}

/** Catalog item from GET /items. Decimal casts arrive as strings. */
export interface Item {
  id: number
  name: string
  sku: string
  unit_price: string
  stock_qty: number
}

/** Laravel paginator metadata returned alongside a paginated list. */
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** One row of GET /orders (index endpoint with counts + sums). */
export interface OrderSummary {
  id: number
  number: string
  status: OrderStatus
  remarks: string | null
  user_id: number
  created_at: string
  requester: { id: number; name: string }
  lines_count: number
  lines_sum_line_total: string | null
  /** Timestamp of the most recent activity-log row; null if none yet. */
  activities_max_created_at: string | null
}

/** A single order line, with its price snapshot and the catalog item. */
export interface OrderLineDetail {
  id: number
  item_id: number
  qty: number
  unit_price: string
  line_total: string
  item: { id: number; name: string; sku: string }
}

/** One append-only audit row on the order (a transition or the creation). */
export interface ActivityLogEntry {
  id: number
  from_status: OrderStatus | null
  to_status: OrderStatus
  note: string | null
  created_at: string
  actor: { id: number; name: string }
}

/** GET /orders/:id — the order with lines, activity log and grand total. */
export interface OrderDetail {
  id: number
  number: string
  status: OrderStatus
  remarks: string | null
  user_id: number
  created_at: string
  requester: { id: number; name: string }
  lines: OrderLineDetail[]
  activities: ActivityLogEntry[]
  total: string | number
}

/** The 8 loop transitions, as sent to POST /orders/:id/transitions. */
export type TransitionAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'revise'
  | 'fulfill'
  | 'close'
  | 'cancel'
