import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'client' | 'admin';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${location.pathname}`} replace />;
  }

  if (requiredRole) {
    const currentRole = role || 'client'; // Default to client if profile is missing
    if (currentRole !== requiredRole) {
      // Prevent infinite redirects if already on the target path
      const targetPath = currentRole === 'admin' ? '/admin' : '/dashboard';
      if (location.pathname !== targetPath) {
        return <Navigate to={targetPath} replace />;
      }
    }
  }

  return <Outlet />;
}
