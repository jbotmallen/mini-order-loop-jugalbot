import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { OrderFormValues } from '@/schemas/order'
import { Textarea } from '@/components/ui/textarea'

/** Optional free-text remarks for the order. */
export default function OrderRemarks({
  control,
}: {
  control: Control<OrderFormValues>
}) {
  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-3">
      <Controller
        name="remarks"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="order-remarks"
              className="text-body-md font-medium text-on-surface"
            >
              Remarks{' '}
              <span className="font-normal text-on-surface-variant">
                (optional)
              </span>
            </label>
            <Textarea
              {...field}
              value={field.value ?? ''}
              id="order-remarks"
              aria-invalid={fieldState.invalid}
              placeholder="Optional note for this order…"
              rows={3}
            />
            {fieldState.invalid && (
              <span className="text-label-sm text-error">
                {fieldState.error?.message}
              </span>
            )}
          </div>
        )}
      />
    </section>
  )
}
