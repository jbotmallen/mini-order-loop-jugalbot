import { cn } from '@/lib/utils'

/**
 * Caps a table's height and scrolls its body internally so the surrounding
 * page stays put. Pair with `stickyHead` on the table's header row so the
 * column labels pin to the top while rows scroll beneath them.
 */
export function TableScroll({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-h-[500px] overflow-auto', className)}>
      {children}
    </div>
  )
}

/**
 * Classes for a header cell inside a {@link TableScroll}. `sticky top-0`
 * pins it; the opaque background keeps scrolled rows from bleeding through.
 */
export const stickyHead = 'sticky top-0 z-10 bg-surface-container-low'
