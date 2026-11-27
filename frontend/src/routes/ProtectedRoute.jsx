import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Forbidden from '../pages/public/Forbidden'

// Remember the entire destination so a successful login can resume navigation.
export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()
  const { pathname, search, hash } = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: pathname + search + hash }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Forbidden />
  return <Outlet />
}
