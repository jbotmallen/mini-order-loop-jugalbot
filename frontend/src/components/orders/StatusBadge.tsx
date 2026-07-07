import type { OrderStatus } from '../../lib/types'

const styles: Record<OrderStatus, string> = {
  draft: 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 py-[3px] px-[9px]',
  submitted: 'bg-warning-fixed text-on-warning-fixed-variant',
  approved: 'bg-primary-fixed text-on-primary-fixed-variant',
  fulfilled: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  rejected: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  closed: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
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
