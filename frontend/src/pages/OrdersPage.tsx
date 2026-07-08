import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import OrdersTable from '../components/orders/OrdersTable'
import OrdersToolbar from '../components/orders/OrdersToolbar'
import { TablePagination } from '@/components/ui/table-pagination'
import { fetchAllOrders, useOrders } from '../hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '../lib/api'
import { downloadCsv, toCsv } from '../lib/csv'
import { formatDateTime } from '../lib/format'
import { ORDER_STATUSES, type OrderStatus } from '../lib/types'

/**
 * Hub for the orders list. The active filters (status + search) live in the URL
 * query string so a view is shareable — another logged-in user can paste the
 * link and land on the exact same filtered list. The URL is the source of
 * truth; the search box keeps its own immediate state and writes back debounced
 * so typing neither spams requests nor floods history.
 */
export default function OrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read filters from the URL, ignoring an unknown status param.
  const statusParam = searchParams.get('status') as OrderStatus | null
  const status: OrderStatus | '' =
    statusParam && ORDER_STATUSES.includes(statusParam) ? statusParam : ''
  const search = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)

  // Changing the status resets to page 1 — the old page number rarely exists
  // in the newly filtered set.
  const setStatus = (next: OrderStatus | '') => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next) params.set('status', next)
        else params.delete('status')
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  const setPage = (next: number) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next > 1) params.set('page', String(next))
        else params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  // Debounce typing into the URL so we don't fire a request or push a history
  // entry per keystroke. Skip the write when nothing changed (e.g. mount, or a
  // status flip re-running this effect) to avoid a redundant navigation.
  useEffect(() => {
    if (searchInput === search) return
    const handle = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (searchInput) params.set('q', searchInput)
          else params.delete('q')
          params.delete('page')
          return params
        },
        { replace: true },
      )
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput, search, setSearchParams])

  const { data, isPending, error } = useOrders({ status, search, page })
  const orders = data?.orders ?? []
  const meta = data?.meta

  // Export the whole filtered set (all pages), not just the visible page, so a
  // CSV filtered to e.g. "cancelled" contains every cancelled order.
  const [isExporting, setIsExporting] = useState(false)
  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const rows = await fetchAllOrders({ status, search })
      if (rows.length === 0) {
        toast.info('No orders match the current filters — nothing to export.')
        return
      }
      const csv = toCsv(
        ['Order No.', 'Requester', 'Status', 'Total Amount', 'Lines', 'Created Date', 'Last Activity'],
        rows.map((o) => [
          o.number,
          o.requester.name,
          o.status,
          Number(o.lines_sum_line_total ?? 0).toFixed(2),
          o.lines_count,
          formatDateTime(o.created_at),
          o.activities_max_created_at ? formatDateTime(o.activities_max_created_at) : '',
        ]),
      )
      const stamp = new Date().toISOString().slice(0, 10)
      const suffix = status ? `-${status}` : ''
      downloadCsv(`orders${suffix}-${stamp}.csv`, csv)
      toast.success(`Exported ${rows.length} order${rows.length === 1 ? '' : 's'} to CSV.`)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to export orders.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-page flex-col">
      <OrdersToolbar
        canCreate={user?.role === 'requester'}
        status={status}
        search={searchInput}
        onStatusChange={setStatus}
        onSearchChange={setSearchInput}
        onNewOrder={() => navigate('/orders/new')}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <OrdersTable
        orders={orders}
        isLoading={isPending}
        error={error ? error.message : null}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
      />

      {!isPending && !error && meta && (
        <div className="mt-3 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-body-sm text-on-surface-variant">
            {meta.total === 0
              ? 'Showing 0 orders'
              : `Showing ${(meta.current_page - 1) * meta.per_page + 1} to ${
                  (meta.current_page - 1) * meta.per_page + orders.length
                } of ${meta.total} orders`}
          </p>
          <TablePagination
            page={meta.current_page}
            pageCount={meta.last_page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
