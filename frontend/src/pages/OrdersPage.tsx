import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrdersTable from '../components/orders/OrdersTable'
import OrdersToolbar from '../components/orders/OrdersToolbar'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import type { OrderStatus } from '../lib/types'

/**
 * Hub for the orders list: owns filter state and the orders query,
 * passes only what each child needs.
 */
export default function OrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Debounce typing so we don't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  const { data: orders = [], isPending, error } = useOrders({ status, search })

  return (
    <div className="mx-auto flex max-w-page flex-col gap-6">
      <OrdersToolbar
        canCreate={user?.role === 'requester'}
        status={status}
        search={searchInput}
        onStatusChange={setStatus}
        onSearchChange={setSearchInput}
        onNewOrder={() => navigate('/orders/new')}
      />

      <OrdersTable
        orders={orders}
        isLoading={isPending}
        error={error ? error.message : null}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
      />

      {!isPending && !error && (
        <p className="text-body-sm text-on-surface-variant">
          {orders.length === 0
            ? 'Showing 0 orders'
            : `Showing 1 to ${orders.length} of ${orders.length} orders`}
        </p>
      )}
    </div>
  )
}
