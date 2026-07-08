import { stickyHead } from '@/components/ui/table-scroll'

/** Shared header-cell class for the order-form tables (sticky inside scroll). */
export const orderTh = `px-4 py-3 text-left text-label-sm uppercase tracking-wide text-on-surface-variant ${stickyHead}`

/** An icon + label `<th>` used by the catalog and order-lines tables. */
export function HeaderCell({
  icon: Icon,
  label,
  align = 'left',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  align?: 'left' | 'right' | 'center'
}) {
  const justify =
    align === 'right'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : 'justify-start'
  const textAlign =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
  return (
    <th className={`${orderTh} ${textAlign}`}>
      <span className={`flex items-center gap-1.5 ${justify}`}>
        <Icon className="size-3.5" /> {label}
      </span>
    </th>
  )
}
