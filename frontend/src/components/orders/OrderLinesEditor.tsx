import { Controller } from 'react-hook-form'
import type { Control, FieldArrayWithId } from 'react-hook-form'
import { Box, DollarSign, ListOrdered, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { MAX_QTY, type OrderFormValues } from '@/schemas/order'
import type { Item } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { TableScroll } from '@/components/ui/table-scroll'
import { HeaderCell, orderTh } from './OrderTableHeaderCell'

interface Props {
  control: Control<OrderFormValues>
  fields: FieldArrayWithId<OrderFormValues, 'lines', 'id'>[]
  /** Live line values, for resolving each row's item + over-stock warning. */
  lines: OrderFormValues['lines']
  itemsById: Map<number, Item>
  onRemove: (index: number) => void
}

/**
 * Editable order-lines table: item name, a qty input with a stock-capped
 * slider stacked beneath it, unit price, and a remove button. The input still
 * allows exceeding stock (up to MAX_QTY) so an intentional over-stock order can
 * be built and tested against the approve guard; the row flags the overage.
 */
export default function OrderLinesEditor({
  control,
  fields,
  lines,
  itemsById,
  onRemove,
}: Props) {
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <h2 className="text-headline-md text-on-surface">Order Lines</h2>
        <span className="text-body-md text-on-surface-variant">
          {fields.length} line{fields.length === 1 ? '' : 's'}
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
                <HeaderCell icon={ListOrdered} label="Qty" />
                <HeaderCell icon={DollarSign} label="Unit Price" align="right" />
                <th className={`${orderTh} text-right`}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((fieldItem, index) => {
                const line = lines[index]
                const item = itemsById.get(line?.item_id ?? 0)
                const stock = item?.stock_qty ?? 0
                const overStock = Number.isFinite(line?.qty) && line.qty > stock
                return (
                  <tr
                    key={fieldItem.id}
                    className="border-b border-outline-variant/50 align-top last:border-b-0"
                  >
                    <td className="px-4 py-3 text-body-md font-medium text-on-surface">
                      {item?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Controller
                        name={`lines.${index}.qty`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="flex w-40 flex-col gap-3">
                            <Input
                              type="number"
                              min={1}
                              max={MAX_QTY}
                              step={1}
                              inputMode="numeric"
                              aria-label="Quantity"
                              aria-invalid={fieldState.invalid}
                              className="w-full"
                              value={
                                Number.isFinite(field.value) ? field.value : ''
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
                              className="w-full"
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
                              onValueChange={([value]) => field.onChange(value)}
                            />
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
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemove(index)}
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
  )
}
