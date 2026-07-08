import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import AppLayout from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrderFormPage from './pages/OrderFormPage'
import OrdersPage from './pages/OrdersPage'

function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<OrderFormPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/edit" element={<OrderFormPage />} />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Route>
    </Routes>
    <Toaster richColors position="top-center" />
    </>
  )
}

export default App
