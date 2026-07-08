import { useEffect, useState } from 'react'
import { Barcode, Box, DollarSign, Layers, Plus, Search } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import type { Item } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TablePagination } from '@/components/ui/table-pagination'
import { TableScroll } from '@/components/ui/table-scroll'
import { HeaderCell, orderTh } from './OrderTableHeaderCell'

/** Catalog picker page size; the catalog is small, so we page client-side. */
const CATALOG_PER_PAGE = 5

interface Props {
  items: Item[]
  /** Item ids already on the order — their Add button reads "Added". */
  orderedItemIds: Set<number>
  /** True once the order hit its line cap; all Add buttons disable. */
  atLineLimit: boolean
  onAdd: (item: Item) => void
}

/**
 * "Add Items" panel: searches the (already loaded) catalog and pages it 5 at a
 * time client-side, appending a line per item picked. Owns its own search and
 * page state — the parent only needs to know which items are on the order and
 * whether the line cap is reached.
 */
export default function CatalogPicker({
  items,
  orderedItemIds,
  atLineLimit,
  onAdd,
}: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // A new search re-filters the catalog; jump back to the first page so the
  // user isn't stranded on a page that no longer exists.
  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    )
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PER_PAGE))
  const clampedPage = Math.min(page, pageCount)
  const paged = filtered.slice(
    (clampedPage - 1) * CATALOG_PER_PAGE,
    clampedPage * CATALOG_PER_PAGE,
  )

  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <h2 className="text-headline-md text-on-surface">Add Items</h2>
        <TablePagination
          page={clampedPage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
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
              <th className={`${orderTh} text-right`}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-body-md text-on-surface-variant"
                >
                  No items match “{search}”.
                </td>
              </tr>
            )}
            {paged.map((item) => {
              const added = orderedItemIds.has(item.id)
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
                      onClick={() => onAdd(item)}
                      disabled={added || atLineLimit}
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
    </section>
  )
}
