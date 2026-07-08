import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Current page, 1-based. */
  page: number
  /** Total number of pages. */
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Minimal Prev / Next pager with a "Page X of Y" indicator, shared by every
 * data table (server- or client-paginated). Renders nothing for a single
 * page so a short list stays uncluttered. The caller owns where the page
 * number lives (URL, local state); this only reports the requested page.
 */
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  className,
}: Props) {
  if (pageCount <= 1) return null

  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      <span className="text-body-sm text-on-surface-variant">
        Page {page} of {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft /> Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next <ChevronRight />
      </Button>
    </div>
  )
}
