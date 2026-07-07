import { FiLogOut } from 'react-icons/fi'
import type { User } from '../../lib/types'
import ThemeToggle from '../ui/ThemeToggle'

interface Props {
  user: User
  onLogout: () => void
  isLoggingOut: boolean
}

export default function Topbar({ user, onLogout, isLoggingOut }: Props) {
  return (
    <header className="flex items-center justify-end gap-4 border-b border-outline-variant bg-surface-container-lowest px-8 py-4">
      <ThemeToggle />
      <span className="text-body-md text-on-surface">{user.name}</span>
      <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm uppercase tracking-wide text-on-primary-fixed-variant">
        {user.role}
      </span>
      <button
        onClick={onLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 text-label-md text-on-surface hover:text-primary disabled:opacity-50"
      >
        <FiLogOut className="size-5" />
        Logout
      </button>
    </header>
  )
}
