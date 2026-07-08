import { CheckCircle2, Loader2, Save, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  saving: boolean
  /** False while the order has no lines — Submit stays disabled. */
  canSubmit: boolean
  onCancel: () => void
  onSubmit: () => void
}

/**
 * Action card for the draft form: Cancel + Save Draft side by side, then a
 * full-width Submit. Save Draft is the form's submit button (persist + stay);
 * Submit runs save-then-submit via the parent-supplied handler.
 */
export default function OrderFormActions({
  saving,
  canSubmit,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <section className="flex flex-col gap-2 rounded border border-outline-variant bg-surface-container-lowest p-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          type="button"
          variant="destructive"
          onClick={onCancel}
          disabled={saving}
        >
          <XCircle /> Cancel
        </Button>
        <Button size="lg" type="submit" variant="secondary" disabled={saving}>
          <Save /> Save Draft
        </Button>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={saving || !canSubmit}
        title={canSubmit ? undefined : 'Add at least one line to submit.'}
      >
        <CheckCircle2 /> Submit Order
      </Button>
      {saving && (
        <span className="flex items-center justify-center gap-2 text-body-sm text-on-surface-variant">
          <Loader2 className="size-4 animate-spin" /> Saving…
        </span>
      )}
    </section>
  )
}
