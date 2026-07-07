import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiList,
  FiPlus,
  FiPlusSquare,
} from 'react-icons/fi'
import Logo from '../ui/Logo'
import { useAuth } from '@/hooks/useAuth'
import { ProfileDialog } from '../user/ProfileDialog'

const navItem = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded px-4 py-3 text-label-md ${isActive
    ? 'bg-action/15 text-primary before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-action'
    : 'text-on-surface-variant hover:bg-surface-container'
  }`

export default function Sidebar() {
  const { user } = useAuth();
  const canCreate = user?.role === 'requester'
  const navigate = useNavigate()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest">
      <div className="px-5 py-6">
        <Logo titleOnly imageClassName='size-8' />
      </div>

      {canCreate && (
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate('/orders/new')}
            className="flex w-full items-center justify-center gap-2 rounded bg-action px-4 py-2.5 text-label-md text-on-action hover:bg-action-hover"
          >
            <FiPlus className="size-4" />
            New Order
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-1 px-4">
        <NavLink to="/orders" end className={navItem}>
          <FiList className="size-5" />
          Orders List
        </NavLink>
        {canCreate && (
          <NavLink to="/orders/new" className={navItem}>
            <FiPlusSquare className="size-5" />
            New Order
          </NavLink>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-4 pb-6">
        <ProfileDialog />
      </div>
    </aside>
  )
}
