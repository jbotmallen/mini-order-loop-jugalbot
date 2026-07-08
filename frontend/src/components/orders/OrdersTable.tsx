import {
  FiCalendar,
  FiCreditCard,
  FiHash,
  FiInfo,
  FiUser,
} from 'react-icons/fi'
import { formatDateTime, formatMoney } from '../../lib/format'
import type { OrderSummary } from '../../lib/types'
import { TableScroll, stickyHead } from '@/components/ui/table-scroll'
import StatusBadge from './StatusBadge'

interface Props {
  orders: OrderSummary[]
  isLoading: boolean
  error: string | null
  onRowClick: (order: OrderSummary) => void
}

const th = `px-4 py-3 text-left text-label-sm uppercase tracking-wide text-on-surface-variant ${stickyHead}`

export default function OrdersTable({
  orders,
  isLoading,
  error,
  onRowClick,
}: Props) {
  return (
    <TableScroll className="rounded border border-outline-variant bg-surface-container-lowest">
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiHash className="size-3.5" /> Order No.
              </span>
            </th>
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiUser className="size-3.5" /> Requester
              </span>
            </th>
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiInfo className="size-3.5" /> Status
              </span>
            </th>
            <th className={`${th} text-right`}>
              <span className="flex items-center justify-end gap-1.5">
                <FiCreditCard className="size-3.5" /> Total Amount
              </span>
            </th>
            <th className={`${th} text-center`}>Lines</th>
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="size-3.5" /> Created Date
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-body-md text-on-surface-variant"
              >
                Loading orders…
              </td>
            </tr>
          )}
          {!isLoading && error && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-body-md text-error"
              >
                {error}
              </td>
            </tr>
          )}
          {!isLoading && !error && orders.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-body-md text-on-surface-variant"
              >
                No orders found.
              </td>
            </tr>
          )}
          {!isLoading &&
            !error &&
            orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onRowClick(order)}
                className="cursor-pointer border-b border-outline-variant/50 last:border-b-0 hover:bg-action/10"
              >
                <td className="px-4 py-4 text-body-md font-medium text-on-surface">
                  {order.number}
                </td>
                <td className="px-4 py-4 text-body-md text-on-surface">
                  {order.requester.name}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-right text-body-md font-medium text-on-surface">
                  {formatMoney(order.lines_sum_line_total)}
                </td>
                <td className="px-4 py-4 text-center text-body-md text-on-surface">
                  {order.lines_count}
                </td>
                <td className="px-4 py-4 text-body-sm text-on-surface-variant">
                  {formatDateTime(order.created_at)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
