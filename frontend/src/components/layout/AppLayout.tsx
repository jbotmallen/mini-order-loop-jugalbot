import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { clearAuth, getToken, getUser } from '../../lib/auth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * Authenticated shell: sidebar + topbar around the routed page.
 * Bounces to /login when no token/user is stored.
 */
export default function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = getUser()

  const logout = useMutation({
    mutationFn: () => api('/logout', { method: 'POST' }),
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })

  if (!getToken() || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar canCreate={user.role === 'requester'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onLogout={() => logout.mutate()}
          isLoggingOut={logout.isPending}
        />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
