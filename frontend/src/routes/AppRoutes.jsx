import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout/Layout'
import LoginPage from '../pages/auth/LoginPage/LoginPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage/ResetPasswordPage'
import HomePage from '../pages/HomePage/HomePage'
import ItemDetailPage from '../pages/ItemDetailPage/ItemDetailPage'
import CalendarPage from '../pages/CalendarPage/CalendarPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
