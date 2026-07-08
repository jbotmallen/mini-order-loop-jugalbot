import { useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import {
  useCreateOrder,
  useSubmitOrder,
  useUpdateOrder,
} from '@/hooks/useOrders'
import {
  MAX_LINES,
  orderFormSchema,
  type OrderFormValues,
} from '@/schemas/order'
import type { Item } from '@/lib/types'
import CatalogPicker from './CatalogPicker'
import OrderCalculations from './OrderCalculations'
import OrderFormActions from './OrderFormActions'
import OrderLinesEditor from './OrderLinesEditor'
import OrderRemarks from './OrderRemarks'

interface Props {
  mode: 'create' | 'edit'
  /** Required when mode is 'edit'. */
  orderId?: number
  items: Item[]
  defaultValues: OrderFormValues
  /** Called with the saved order's id so the caller can navigate. */
  onSaved: (orderId: number) => void
  onCancel: () => void
}

/**
 * Hub for the draft order form. Owns the form state, the save/submit mutations,
 * and the derived rollups, then composes the page from focused section
 * components: a catalog picker + remarks on the left, and the actions card,
 * editable order lines, and live calculations on the right. Rules are enforced
 * server-side; this form just makes a valid draft easy to build.
 */
export default function OrderForm({
  mode,
  orderId,
  items,
  defaultValues,
  onSaved,
  onCancel,
}: Props) {
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder(orderId ?? 0)
  const submitOrder = useSubmitOrder()
  const saving =
    createOrder.isPending || updateOrder.isPending || submitOrder.isPending

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )

  // Re-render totals + catalog "added" state on every line change.
  const watchedLines = form.watch('lines')
  const orderedItemIds = new Set(watchedLines.map((line) => line.item_id))

  const lineTotal = (itemId: number, qty: number) => {
    const item = itemsById.get(itemId)
    if (!item || !Number.isFinite(qty)) return 0
    return Number(item.unit_price) * qty
  }
  const orderTotal = watchedLines.reduce(
    (sum, line) => sum + lineTotal(line.item_id, line.qty),
    0,
  )
  const totalQty = watchedLines.reduce(
    (sum, line) => sum + (Number.isFinite(line.qty) ? line.qty : 0),
    0,
  )

  const addItem = (item: Item) => {
    if (fields.length >= MAX_LINES || orderedItemIds.has(item.id)) return
    append({ item_id: item.id, qty: 1 })
  }

  const buildPayload = (values: OrderFormValues) => ({
    remarks: values.remarks?.trim() ? values.remarks.trim() : null,
    lines: values.lines.map((line) => ({
      item_id: line.item_id,
      qty: line.qty,
    })),
  })

  const saveMutation = mode === 'edit' ? updateOrder : createOrder

  // Save Draft — persist and go to the detail page.
  const handleSave = async (values: OrderFormValues) => {
    try {
      const res = await saveMutation.mutateAsync(buildPayload(values))
      toast.success(mode === 'edit' ? 'Draft updated' : 'Draft saved')
      onSaved(res.order.id)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not save the order.',
      )
    }
  }

  // Submit Order — save the draft, then run the submit transition. If submit
  // fails its server guard, the draft is still saved; route there so the user
  // can fix and resubmit rather than re-create the order.
  const handleSubmitOrder = async (values: OrderFormValues) => {
    let savedId: number | undefined
    try {
      const res = await saveMutation.mutateAsync(buildPayload(values))
      savedId = res.order.id
      await submitOrder.mutateAsync(savedId)
      toast.success('Order submitted')
      onSaved(savedId)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not submit the order.',
      )
      if (savedId !== undefined) onSaved(savedId)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSave)}
      className="flex flex-col gap-4 lg:flex-row lg:items-start"
    >
      {/* Left column: catalog picker + remarks */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <CatalogPicker
          items={items}
          orderedItemIds={orderedItemIds}
          atLineLimit={fields.length >= MAX_LINES}
          onAdd={addItem}
        />
        <OrderRemarks control={form.control} />
      </div>

      {/* Right column: actions, order lines, calculations */}
      <div className="flex w-full flex-col gap-1.5 lg:w-125 lg:shrink-0">
        <OrderFormActions
          saving={saving}
          canSubmit={fields.length > 0}
          onCancel={onCancel}
          onSubmit={form.handleSubmit(handleSubmitOrder)}
        />
        <OrderLinesEditor
          control={form.control}
          fields={fields}
          lines={watchedLines}
          itemsById={itemsById}
          onRemove={remove}
        />
        <OrderCalculations
          lineCount={fields.length}
          totalQty={totalQty}
          orderTotal={orderTotal}
        />
      </div>
    </form>
  )
}
