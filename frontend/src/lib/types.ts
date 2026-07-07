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
}
