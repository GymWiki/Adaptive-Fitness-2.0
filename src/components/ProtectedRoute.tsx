import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from './ui/States'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <Spinner />

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
