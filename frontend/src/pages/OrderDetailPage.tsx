import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiFileText,
  FiList,
  FiUser,
} from 'react-icons/fi'
import { ApiError } from '@/lib/api'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useOrder } from '@/hooks/useOrders'
import OrderActions from '@/components/orders/OrderActions'
import OrderActivityLog from '@/components/orders/OrderActivityLog'
import OrderLinesTable from '@/components/orders/OrderLinesTable'
import StatusBadge from '@/components/orders/StatusBadge'

/**
 * Order detail: lines with the price snapshot, remarks, role-aware action bar,
 * and the append-only activity log. State updates in place after any action
 * (the mutation invalidates this query).
 */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: order, isPending, error } = useOrder(id)

  if (isPending) {
    return (
      <div className="mx-auto max-w-page py-16 text-center text-body-md text-on-surface-variant">
        Loading order…
      </div>
    )
  }

  if (error || !order) {
    const notFound = error instanceof ApiError && error.status === 404
    const forbidden = error instanceof ApiError && error.status === 403
    return (
      <div className="mx-auto flex max-w-page flex-col items-center gap-4 py-16 text-center">
        <p className="text-body-md text-error">
          {notFound
            ? 'Order not found.'
            : forbidden
              ? 'You are not allowed to view this order.'
              : (error?.message ?? 'Could not load this order.')}
        </p>
        <Link to="/orders" className="text-body-md text-primary underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const roleHint =
    user?.role === 'approver'
      ? 'You are the approver.'
      : user?.id === order.user_id
        ? 'You are the requester.'
        : null

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4">
      <Link
        to="/orders"
        className="inline-flex w-fit items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface"
      >
        <FiArrowLeft className="size-4" /> Back to Orders
      </Link>

      {/* Header — order + meta on the left, grand total on the right */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg text-on-surface">
              Order {order.number}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <FiUser className="size-3.5" /> Requested by{' '}
              {order.requester.name}
            </span>
            <span className="flex items-center gap-1.5">
              <FiCalendar className="size-3.5" />{' '}
              {formatDateTime(order.created_at)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Total
          </p>
          <p className="text-headline-lg font-semibold text-on-surface">
            {formatMoney(order.total)}
          </p>
        </div>
      </div>

      {/* Two columns — lines + remarks on the left, actions + timeline aside */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-headline-md text-on-surface">
              <FiList className="size-5 text-on-surface-variant" /> Order Lines
            </h2>
            <OrderLinesTable lines={order.lines} total={order.total} />
          </section>

          {order.remarks && (
            <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
              <h2 className="mb-2 flex items-center gap-2 text-title-md text-on-surface">
                <FiFileText className="size-4 text-on-surface-variant" /> Remarks
              </h2>
              <p className="text-body-md text-on-surface">{order.remarks}</p>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
            <h2 className="text-title-md text-on-surface">Actions</h2>
            {roleHint && (
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                {roleHint}
              </p>
            )}
            <div className="mt-3 [&_a]:h-10 [&_a]:w-full [&_button]:h-10 [&_button]:w-full">
              <OrderActions order={order} />
            </div>
          </section>

          <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
            <h2 className="mb-3 flex items-center gap-2 text-label-md uppercase tracking-wide text-on-surface-variant">
              <FiClock className="size-4" /> Timeline
            </h2>
            <OrderActivityLog activities={order.activities} />
          </section>
        </div>
      </div>
    </div>
  )
}
