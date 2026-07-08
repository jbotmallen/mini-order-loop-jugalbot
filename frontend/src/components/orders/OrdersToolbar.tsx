import { FiCheck, FiChevronDown, FiDownload, FiPlus, FiSearch } from 'react-icons/fi'
import { ORDER_STATUSES, type OrderStatus } from '../../lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  canCreate: boolean
  status: OrderStatus | ''
  search: string
  onStatusChange: (status: OrderStatus | '') => void
  onSearchChange: (search: string) => void
  onNewOrder: () => void
}

export default function OrdersToolbar({
  canCreate,
  status,
  search,
  onStatusChange,
  onSearchChange,
  onNewOrder,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4">
      {canCreate && (
        <button
          onClick={onNewOrder}
          className="flex items-center gap-2 rounded bg-action px-4 py-2 text-label-md text-on-action hover:bg-action-hover"
        >
          <FiPlus className="size-4" />
          New Order
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between gap-6 rounded border border-outline-variant bg-surface-container-lowest py-2 pl-3 pr-3 text-body-md text-on-surface hover:bg-surface-container focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer select-none">
            <span className="capitalize">
              {status
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : 'All Statuses'}
            </span>
            <FiChevronDown className="size-4 text-on-surface-variant" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-48">
          <DropdownMenuItem
            onSelect={() => onStatusChange('')}
            className="cursor-pointer gap-2"
          >
            <FiCheck
              className={`size-4 ${status ? 'invisible' : 'text-primary'}`}
            />
            All Statuses
          </DropdownMenuItem>
          {ORDER_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => onStatusChange(s)}
              className="capitalize cursor-pointer gap-2"
            >
              <FiCheck
                className={`size-4 ${status === s ? 'text-primary' : 'invisible'}`}
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative ml-auto min-w-64 flex-1 sm:max-w-80">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by order number..."
          className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
        />
      </div>

      <button
        disabled
        title="CSV export arrives in Part 5"
        className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface-variant opacity-50"
      >
        <FiDownload className="size-4" />
        Export CSV
      </button>
    </div>
  )
}
