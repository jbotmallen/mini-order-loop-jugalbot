import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  Check,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Pencil,
  RotateCcw,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useOrderTransition, type TransitionVars } from '@/hooks/useOrders'
import type { OrderDetail } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  order: OrderDetail
}

export default function OrderActions({ order }: Props) {
  const { user } = useAuth()
  const transition = useOrderTransition(String(order.id))

  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  if (!user) return null

  const isOwner = user.id === order.user_id
  const isApprover = user.role === 'approver'
  const { status } = order
  const busy = transition.isPending

  const run = (vars: TransitionVars, onDone?: () => void) =>
    transition.mutate(vars, {
      onSuccess: (res) => {
        toast.success(res.message)
        onDone?.()
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : 'Action failed. Try again.',
        ),
    })

  // Owner (requester) transitions
  const canEdit = isOwner && status === 'draft'
  const canSubmit = isOwner && status === 'draft'
  const canRevise = isOwner && status === 'rejected'
  const canClose = isOwner && status === 'fulfilled'
  const canCancel = isOwner && (status === 'draft' || status === 'submitted')
  // Approver transitions
  const canApprove = isApprover && status === 'submitted'
  const canReject = isApprover && status === 'submitted'
  const canFulfill = isApprover && status === 'approved'

  const hasAction =
    canEdit ||
    canSubmit ||
    canRevise ||
    canClose ||
    canCancel ||
    canApprove ||
    canReject ||
    canFulfill

  if (!hasAction) {
    return (
      <p className="text-body-sm text-on-surface-variant">
        No actions available for this order in its current status.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* While any transition is in flight, hide every action (buttons and the
          Edit link) behind one disabled Processing state — a single busy flag so
          nothing can be double-fired or navigated away mid-request. The dialogs
          below stay mounted so an in-flight or failed reject/cancel survives. */}
      {busy ? (
        <Button className="gap-2" disabled aria-busy="true">
          <Loader2 className="animate-spin" /> Processing…
        </Button>
      ) : (
        <>
          {canEdit && (
            <Button className="gap-2" variant="outline" asChild>
              <Link to={`/orders/${order.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          )}

          {canSubmit && (
            <Button className="gap-2" onClick={() => run({ action: 'submit' })}>
              <Send /> Submit
            </Button>
          )}

          {canRevise && (
            <Button className="gap-2" onClick={() => run({ action: 'revise' })}>
              <RotateCcw /> Revise
            </Button>
          )}

          {canApprove && (
            <Button className="gap-2" onClick={() => run({ action: 'approve' })}>
              <Check /> Approve
            </Button>
          )}

          {/* Final / stock-deducting action — confirm first */}
          {canFulfill && (
            <ConfirmAction
              trigger={
                <Button className="gap-2">
                  <PackageCheck /> Fulfill
                </Button>
              }
              title="Fulfill this order?"
              description="This deducts item stock and cannot be undone. Stock is re-checked now; if anything is short the order stays approved."
              confirmLabel="Fulfill"
              onConfirm={() => run({ action: 'fulfill' })}
            />
          )}

          {canClose && (
            <ConfirmAction
              trigger={
                <Button className="gap-2">
                  <CheckCircle2 /> Close
                </Button>
              }
              title="Close this order?"
              description="Marks the order as received & confirmed. This is the end of the loop and cannot be undone."
              confirmLabel="Close"
              onConfirm={() => run({ action: 'close' })}
            />
          )}

          {canReject && (
            <Button
              className="gap-2"
              variant="destructive"
              onClick={() => {
                setReason('')
                setRejectOpen(true)
              }}
            >
              <X /> Reject
            </Button>
          )}

          {canCancel && (
            <Button
              className="gap-2"
              variant="destructive"
              onClick={() => {
                setNote('')
                setCancelOpen(true)
              }}
            >
              <Ban /> Cancel
            </Button>
          )}
        </>
      )}

      {/* Reject — reason required */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject order {order.number}</DialogTitle>
            <DialogDescription>
              The requester will see this reason. It is required and stored in
              the activity log.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this order being rejected?"
            aria-label="Rejection reason"
            maxLength={255}
          />
          <DialogFooter>
            <Button className="gap-2" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button className="gap-2"
              variant="destructive"
              disabled={busy || reason.trim().length === 0}
              onClick={() =>
                run({ action: 'reject', reason: reason.trim() }, () =>
                  setRejectOpen(false),
                )
              }
            >
              Reject order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel — optional note */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel order {order.number}</DialogTitle>
            <DialogDescription>
              This takes the order out of the loop. You may add an optional note
              for the activity log.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            aria-label="Cancellation note"
            maxLength={255}
          />
          <DialogFooter>
            <Button className="gap-2" variant="outline" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button className="gap-2"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(
                  {
                    action: 'cancel',
                    note: note.trim() || undefined,
                  },
                  () => setCancelOpen(false),
                )
              }
            >
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ConfirmActionProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

/** AlertDialog wrapper for a pure yes/no confirmation (no text input). */
function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
