import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext/AuthContext'
import LoginPage from './auth/LoginPage/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute/ProtectedRoute'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage/HomePage'
import ItemDetailPage from './pages/ItemDetailPage/ItemDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
