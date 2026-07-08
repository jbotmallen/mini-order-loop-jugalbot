import { Calculator } from 'lucide-react'
import { formatMoney } from '@/lib/format'

interface Props {
  lineCount: number
  totalQty: number
  orderTotal: number
}

/** Live rollup of the order lines: line count, total qty, and grand total. */
export default function OrderCalculations({
  lineCount,
  totalQty,
  orderTotal,
}: Props) {
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3">
        <Calculator className="size-4 text-on-surface-variant" />
        <h2 className="text-headline-md text-on-surface">Calculations</h2>
      </div>
      <dl className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-body-md text-on-surface-variant">Line items</dt>
          <dd className="text-body-md text-on-surface">{lineCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-body-md text-on-surface-variant">
            Total quantity
          </dt>
          <dd className="text-body-md text-on-surface">{totalQty}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3">
          <dt className="text-body-md font-medium text-on-surface">
            Order total
          </dt>
          <dd className="text-headline-md font-semibold text-on-surface">
            {formatMoney(orderTotal)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
