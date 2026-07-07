import { Navigate, Outlet } from 'react-router-dom'
import { getToken, getUser } from '../../lib/auth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const user = getUser()

  if (!getToken() || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
