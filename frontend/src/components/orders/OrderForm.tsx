import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Barcode,
  Box,
  CheckCircle2,
  DollarSign,
  Layers,
  ListOrdered,
  Loader2,
  Plus,
  Receipt,
  Save,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import {
  useCreateOrder,
  useSubmitOrder,
  useUpdateOrder,
} from '@/hooks/useOrders'
import {
  MAX_LINES,
  MAX_QTY,
  orderFormSchema,
  type OrderFormValues,
} from '@/schemas/order'
import type { Item } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { TablePagination } from '@/components/ui/table-pagination'
import { TableScroll, stickyHead } from '@/components/ui/table-scroll'
import { Textarea } from '@/components/ui/textarea'

/** Catalog picker page size; the catalog is small, so we page client-side. */
const CATALOG_PER_PAGE = 5

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

const th = `px-4 py-3 text-left text-label-sm uppercase tracking-wide text-on-surface-variant ${stickyHead}`

function HeaderCell({
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
    <th className={`${th} ${textAlign}`}>
      <span className={`flex items-center gap-1.5 ${justify}`}>
        <Icon className="size-3.5" /> {label}
      </span>
    </th>
  )
}

/**
 * Create/edit form for a draft order, in two panels: a catalog picker
 * ("Add Items") that appends a line per item, and the "Order Lines" list with
 * a slider+input for quantity, live line/order totals, and a destructive
 * remove. The slider caps at the item's stock for convenience, but the input
 * still allows exceeding stock (up to MAX_QTY) so an intentional over-stock
 * order can be created and later tested against the approve guard. The backend
 * re-snapshots prices on every draft save, so this preview matches storage.
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

  const [search, setSearch] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)

  // A new search re-filters the catalog; jump back to the first page so the
  // user isn't stranded on a page that no longer exists.
  useEffect(() => {
    setCatalogPage(1)
  }, [search])

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
  const onOrder = new Set(watchedLines.map((line) => line.item_id))

  const lineTotal = (itemId: number, qty: number) => {
    const item = itemsById.get(itemId)
    if (!item || !Number.isFinite(qty)) return 0
    return Number(item.unit_price) * qty
  }
  const orderTotal = watchedLines.reduce(
    (sum, line) => sum + lineTotal(line.item_id, line.qty),
    0,
  )

  const filteredCatalog = items.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    )
  })

  // Client-side paging over the (already loaded) catalog. Clamp the page in
  // case the filtered set shrank below the current page between renders.
  const catalogPageCount = Math.max(
    1,
    Math.ceil(filteredCatalog.length / CATALOG_PER_PAGE),
  )
  const clampedCatalogPage = Math.min(catalogPage, catalogPageCount)
  const pagedCatalog = filteredCatalog.slice(
    (clampedCatalogPage - 1) * CATALOG_PER_PAGE,
    clampedCatalogPage * CATALOG_PER_PAGE,
  )

  const addItem = (item: Item) => {
    if (fields.length >= MAX_LINES || onOrder.has(item.id)) return
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
      className="flex flex-col gap-4"
    >
      {/* Add Items */}
      <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 className="text-headline-md text-on-surface">Add Items</h2>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog by name or SKU…"
              className="pl-9"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                <HeaderCell icon={Box} label="Item" />
                <HeaderCell icon={Barcode} label="SKU" />
                <HeaderCell icon={DollarSign} label="Unit Price" align="right" />
                <HeaderCell icon={Layers} label="Stock" align="right" />
                <th className={`${th} text-right`}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-body-md text-on-surface-variant"
                  >
                    No items match “{search}”.
                  </td>
                </tr>
              )}
              {pagedCatalog.map((item) => {
              const added = onOrder.has(item.id)
              return (
                <tr
                  key={item.id}
                  className="border-b border-outline-variant/50 last:border-b-0"
                >
                  <td className="px-4 py-3 text-body-md font-medium text-on-surface">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 text-right text-body-md text-on-surface">
                    {formatMoney(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-md text-on-surface">
                    {item.stock_qty}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={added ? 'outline' : 'default'}
                      onClick={() => addItem(item)}
                      disabled={added || fields.length >= MAX_LINES}
                    >
                      <Plus /> {added ? 'Added' : 'Add'}
                    </Button>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </TableScroll>
        <TablePagination
          page={clampedCatalogPage}
          pageCount={catalogPageCount}
          onPageChange={setCatalogPage}
          className="border-t border-outline-variant px-3 py-3"
        />
      </section>

      {/* Order Lines */}
      <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <h2 className="text-headline-md text-on-surface">Order Lines</h2>
          <span className="text-body-md text-on-surface-variant">
            Total:{' '}
            <span className="text-body-md font-semibold text-on-surface">
              {formatMoney(orderTotal)}
            </span>
          </span>
        </div>

        {fields.length === 0 ? (
          <p className="px-4 py-8 text-center text-body-md text-on-surface-variant">
            No lines yet. Add items from the catalog above.
          </p>
        ) : (
          <TableScroll>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <HeaderCell icon={Box} label="Item" />
                <HeaderCell icon={Barcode} label="SKU" />
                <HeaderCell icon={ListOrdered} label="Qty" />
                <HeaderCell icon={DollarSign} label="Unit Price" align="right" />
                <HeaderCell icon={Receipt} label="Line Total" align="right" />
                <th className={`${th} text-right`}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((fieldItem, index) => {
                const line = watchedLines[index]
                const item = itemsById.get(line?.item_id ?? 0)
                const stock = item?.stock_qty ?? 0
                const overStock =
                  Number.isFinite(line?.qty) && line.qty > stock
                return (
                  <tr
                    key={fieldItem.id}
                    className="border-b border-outline-variant/50 align-top last:border-b-0"
                  >
                    <td className="px-4 py-3 text-body-md font-medium text-on-surface">
                      {item?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">
                      {item?.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Controller
                        name={`lines.${index}.qty`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <div className="flex w-48 flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={1}
                                max={MAX_QTY}
                                step={1}
                                inputMode="numeric"
                                aria-label="Quantity"
                                aria-invalid={fieldState.invalid}
                                className="w-20"
                                value={
                                  Number.isFinite(field.value)
                                    ? field.value
                                    : ''
                                }
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === ''
                                      ? undefined
                                      : event.target.valueAsNumber,
                                  )
                                }
                                onBlur={field.onBlur}
                              />
                              <Slider
                                className="flex-1"
                                min={1}
                                max={Math.max(1, stock)}
                                step={1}
                                disabled={stock < 1}
                                value={[
                                  Math.min(
                                    Math.max(1, field.value || 1),
                                    Math.max(1, stock),
                                  ),
                                ]}
                                onValueChange={([value]) =>
                                  field.onChange(value)
                                }
                              />
                            </div>
                            {overStock && (
                              <span className="text-label-sm text-error">
                                Exceeds stock ({stock})
                              </span>
                            )}
                            {fieldState.invalid && (
                              <span className="text-label-sm text-error">
                                {fieldState.error?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-body-md text-on-surface">
                      {formatMoney(item?.unit_price ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-body-md font-medium text-on-surface">
                      {formatMoney(lineTotal(line?.item_id ?? 0, line?.qty))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label={`Remove ${item?.name ?? 'line'}`}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </TableScroll>
        )}
      </section>

      {/* Remarks */}
      <section className="rounded border border-outline-variant bg-surface-container-lowest p-3">
        <Controller
          name="remarks"
          control={form.control}
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {saving && (
          <Loader2 className="size-4 animate-spin text-on-surface-variant" />
        )}
        <Button
          type="button"
          size="lg"
          className="h-10"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          <XCircle /> Cancel Order
        </Button>
        <Button
          type="submit"
          size="lg"
          className="h-10"
          variant="outline"
          disabled={saving}
        >
          <Save /> Save Draft
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-10"
          onClick={form.handleSubmit(handleSubmitOrder)}
          disabled={saving || fields.length === 0}
          title={
            fields.length === 0 ? 'Add at least one line to submit.' : undefined
          }
        >
          <CheckCircle2 /> Submit Order
        </Button>
      </div>
    </form>
  )
}
