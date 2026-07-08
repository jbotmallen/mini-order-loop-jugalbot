import {
  FiBox,
  FiCreditCard,
  FiDollarSign,
  FiHash,
  FiTag,
} from 'react-icons/fi'
import { formatMoney } from '../../lib/format'
import type { OrderLineDetail } from '../../lib/types'

interface Props {
  lines: OrderLineDetail[]
  total: string | number
}

const th =
  'px-4 py-3 text-left text-label-sm uppercase tracking-wide text-on-surface-variant'
const td = 'px-4 py-3 text-body-md text-on-surface'

/**
 * The order's lines with the price snapshot taken when each line was added,
 * plus a footer grand total. unit_price/line_total arrive as decimal strings.
 */
export default function OrderLinesTable({ lines, total }: Props) {
  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiBox className="size-3.5" /> Item
              </span>
            </th>
            <th className={th}>
              <span className="flex items-center gap-1.5">
                <FiTag className="size-3.5" /> SKU
              </span>
            </th>
            <th className={`${th} text-center`}>
              <span className="flex items-center justify-center gap-1.5">
                <FiHash className="size-3.5" /> Qty
              </span>
            </th>
            <th className={`${th} text-right`}>
              <span className="flex items-center justify-end gap-1.5">
                <FiDollarSign className="size-3.5" /> Unit Price
              </span>
            </th>
            <th className={`${th} text-right`}>
              <span className="flex items-center justify-end gap-1.5">
                <FiCreditCard className="size-3.5" /> Line Total
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-body-md text-on-surface-variant"
              >
                This order has no lines yet.
              </td>
            </tr>
          )}
          {lines.map((line) => (
            <tr
              key={line.id}
              className="border-b border-outline-variant/50 last:border-b-0"
            >
              <td className={`${td} font-medium`}>{line.item.name}</td>
              <td className={`${td} text-on-surface-variant`}>{line.item.sku}</td>
              <td className={`${td} text-center`}>{line.qty}</td>
              <td className={`${td} text-right`}>
                {formatMoney(line.unit_price)}
              </td>
              <td className={`${td} text-right font-medium`}>
                {formatMoney(line.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
        {lines.length > 0 && (
          <tfoot>
            <tr className="border-t border-outline-variant bg-surface-container-low">
              <td
                colSpan={4}
                className="px-4 py-3 text-right text-label-md uppercase tracking-wide text-on-surface-variant"
              >
                Grand Total
              </td>
              <td className="px-4 py-3 text-right text-body-md font-semibold text-on-surface">
                {formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
