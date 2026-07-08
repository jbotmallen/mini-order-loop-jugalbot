import { useEffect, useRef } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { formatDateTime } from '../../lib/format'
import type { ActivityLogEntry } from '../../lib/types'
import StatusBadge from './StatusBadge'

interface Props {
  activities: ActivityLogEntry[]
}

/** Human-readable sentence for one transition, keyed off the destination. */
function actionText(entry: ActivityLogEntry): string {
  if (!entry.from_status) return 'created the order'
  switch (entry.to_status) {
    case 'submitted':
      return 'submitted the order'
    case 'approved':
      return 'approved the order'
    case 'rejected':
      return 'rejected the order'
    case 'fulfilled':
      return 'fulfilled the order'
    case 'closed':
      return 'closed the order'
    case 'cancelled':
      return 'cancelled the order'
    case 'draft':
      return 'revised the order'
    default:
      return 'updated the order'
  }
}

/**
 * Append-only audit trail as a vertical timeline (newest first). Each entry is
 * a dot on a connector line — the latest ringed, older ones filled — followed
 * by the timestamp, who did what, the status change, and any reject/cancel note.
 */
export default function OrderActivityLog({ activities }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLLIElement>(null)

  // On load (and after any transition adds a row) bring the current state into
  // view inside the scroll area, without scrolling the page.
  useEffect(() => {
    const container = scrollRef.current
    const current = currentRef.current
    if (container && current) container.scrollTop = current.offsetTop
  }, [activities])

  if (activities.length === 0) {
    return (
      <p className="text-body-md text-on-surface-variant">No activity yet.</p>
    )
  }

  // Backend returns oldest → newest; the timeline reads top-to-bottom in that
  // same order, so the last entry is the order's current state.
  const entries = activities

  return (
    <div
      ref={scrollRef}
      className="relative overflow-y-auto pr-1 lg:max-h-[310px]"
    >
      <ol className="flex flex-col">
        {entries.map((entry, index) => {
          const isCurrent = index === entries.length - 1
          return (
            <li
              key={entry.id}
              ref={isCurrent ? currentRef : undefined}
              className="flex gap-3"
            >
              {/* Marker + connector */}
              <div className="flex flex-col items-center">
                <span className="relative mt-1 flex size-4 shrink-0">
                  {isCurrent && (
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-75" />
                  )}
                  <span
                    className={cn(
                      'size-4 rounded-full',
                      isCurrent
                        ? 'border-2 border-primary bg-primary bg-clip-content p-0.5'
                        : 'bg-outline-variant',
                    )}
                  />
                </span>
                {!isCurrent && (
                  <span className="w-0.5 flex-1 bg-outline-variant" />
                )}
              </div>

            {/* Content */}
            <div
              className={cn(
                'flex flex-col gap-1.5',
                isCurrent ? 'pb-0' : 'pb-5',
              )}
            >
              <span className="text-body-sm font-semibold text-on-surface">
                {formatDateTime(entry.created_at)}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                <span className="font-medium text-on-surface">
                  {entry.actor.name}
                </span>{' '}
                {actionText(entry)}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {entry.from_status && (
                  <>
                    <StatusBadge status={entry.from_status} />
                    <FiArrowRight className="size-3.5 text-on-surface-variant" />
                  </>
                )}
                <StatusBadge status={entry.to_status} />
              </div>
              {entry.note && (
                <p className="rounded bg-surface-container-low px-3 py-2 text-body-sm text-on-surface">
                  {entry.note}
                </p>
              )}
            </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
