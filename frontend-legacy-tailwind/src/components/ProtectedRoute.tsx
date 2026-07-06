import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full"
            style={{ animation: 'spin 0.7s linear infinite' }}
          />
          <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!token || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to their own dashboard
    const roleHome =
      currentUser.role === 'PROF'  ? '/professor/dashboard' :
      currentUser.role === 'ADMIN' ? '/admin/dashboard'     :
      '/student/dashboard'
    return <Navigate to={roleHome} replace />
  }

  return <>{children}</>
}
