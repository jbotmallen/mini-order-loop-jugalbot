import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useItems } from '@/hooks/useItems'
import { useOrder } from '@/hooks/useOrders'
import OrderForm from '@/components/orders/OrderForm'
import type { OrderFormValues } from '@/schemas/order'

/**
 * Hosts the order form for both /orders/new (create) and /orders/:id/edit
 * (edit). Fetches the catalog (always) and the order (edit only), enforces the
 * client-side guards that mirror the server — requester-only create, and edit
 * only on a draft you own — then hands ready data to <OrderForm>. The form is
 * mounted only once its default values are known, so prefill is stable.
 */
export default function OrderFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const mode = id ? 'edit' : 'create'

  const itemsQuery = useItems()
  const orderQuery = useOrder(id)

  const order = orderQuery.data
  const notEditable =
    mode === 'edit' &&
    !!order &&
    (order.status !== 'draft' || order.user_id !== user?.id)

  // Surface why we're bouncing the user back (redirect itself is below).
  useEffect(() => {
    if (notEditable) {
      toast.error('Only a draft order you own can be edited.')
    }
  }, [notEditable])

  useEffect(() => {
    if (orderQuery.error) {
      toast.error(orderQuery.error.message)
    }
  }, [orderQuery.error])

  // Approvers can't create orders — the server refuses too.
  if (mode === 'create' && user && user.role !== 'requester') {
    return <Navigate to="/orders" replace />
  }
  if (mode === 'edit' && (orderQuery.error || notEditable)) {
    return <Navigate to={order ? `/orders/${order.id}` : '/orders'} replace />
  }

  const loading =
    itemsQuery.isPending || (mode === 'edit' && orderQuery.isPending)

  if (loading) {
    return (
      <div className="mx-auto max-w-page py-16 text-center text-body-md text-on-surface-variant">
        Loading…
      </div>
    )
  }

  if (itemsQuery.error) {
    return (
      <div className="mx-auto max-w-page py-16 text-center text-body-md text-error">
        {itemsQuery.error.message}
      </div>
    )
  }

  const defaultValues: OrderFormValues =
    mode === 'edit' && order
      ? {
          remarks: order.remarks ?? '',
          lines: order.lines.map((line) => ({
            item_id: line.item_id,
            qty: line.qty,
          })),
        }
      : { remarks: '', lines: [] }

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Link
          to="/orders"
          className="inline-flex w-fit items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface"
        >
          <FiArrowLeft className="size-4" /> Back to Orders
        </Link>
        <h1 className="text-headline-lg text-on-surface">
          {mode === 'edit'
            ? `Edit Order ${order?.number} (Draft)`
            : 'Create Order (Draft)'}
        </h1>
      </div>

      <OrderForm
        mode={mode}
        orderId={order?.id}
        items={itemsQuery.data ?? []}
        defaultValues={defaultValues}
        onSaved={(savedId) => navigate(`/orders/${savedId}`)}
        onCancel={() =>
          navigate(mode === 'edit' && order ? `/orders/${order.id}` : '/orders')
        }
      />
    </div>
  )
}
