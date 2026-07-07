import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import AppLayout from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import PlaceholderPage from './pages/PlaceholderPage'

function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/orders" element={<OrdersPage />} />
        <Route
          path="/orders/new"
          element={
            <PlaceholderPage
              title="New Order"
              note="Order form — coming in the next step."
            />
          }
        />
        <Route
          path="/orders/:id"
          element={
            <PlaceholderPage
              title="Order Detail"
              note="Order detail page — coming in the next step."
            />
          }
        />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Route>
    </Routes>
    <Toaster richColors position="top-center" />
    </>
  )
}

export default App
