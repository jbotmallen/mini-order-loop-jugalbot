import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useOrder } from '@/hooks/useOrders'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function Topbar() {
  const { user } = useAuth();
  const role = user?.role || '';
  const location = useLocation();

  // Detect route patterns
  const isOrdersList = location.pathname === '/orders';
  const isNewOrder = location.pathname === '/orders/new';
  const orderIdMatch = location.pathname.match(/^\/orders\/(\d+)$/);
  const orderId = orderIdMatch ? orderIdMatch[1] : null;

  // Fetch order details if viewing order details
  const { data: order, isPending } = useOrder(orderId || undefined);

  // Role-specific styling for the role badge
  const roleBadgeStyle = role === 'approver'
    ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
    : 'bg-primary-fixed text-on-primary-fixed-variant';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-lowest px-8 py-4">
      <Breadcrumb>
        <BreadcrumbList>
          {/* Level 1: Role Badge */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/orders">
                <span className={`rounded-full px-3 py-1 text-label-sm uppercase tracking-wide ${roleBadgeStyle}`}>
                  {role}
                </span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Level 2: Orders List */}
          {isOrdersList ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Orders List</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/orders">Orders List</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}

          {/* Level 3: New Order or Order Details */}
          {isNewOrder && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Order</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          {orderId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isPending ? 'Loading...' : order?.number || `Order #${orderId}`}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <ThemeToggle />
    </header>
  )
}

