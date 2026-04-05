import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'client' | 'admin';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center 
            justify-center shadow-lg animate-pulse">
            <div className="w-5 h-5 bg-white/50 rounded" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Protection open redirect
    const safePath = encodeURIComponent(location.pathname);
    return <Navigate to={`/auth?redirect=${safePath}`} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    const targetPath = role === 'admin' ? '/admin' : '/dashboard';
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  return <Outlet />;
}
