import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from '../lib/auth';

export default function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
}
