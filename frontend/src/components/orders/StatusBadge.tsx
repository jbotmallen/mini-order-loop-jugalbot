import type { OrderStatus } from '../../lib/types'

const styles: Record<OrderStatus, string> = {
  draft: 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant py-[3px] px-[9px]',
  submitted: 'bg-warning-fixed text-on-warning-fixed-variant',
  approved: 'bg-primary-fixed text-on-primary-fixed-variant',
  fulfilled: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  rejected: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  closed: 'bg-surface-dim text-on-surface-variant',
  cancelled: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-[6px] px-2.5 py-1 text-label-sm capitalize ${styles[status]}`}
    >
      {status}
    </span>
  )
}
