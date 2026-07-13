import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isRestoring, user, logout } = useAuth();
  const location = useLocation();

  // Don't bounce to /login while the stored session is still being restored.
  if (isRestoring) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // This web console is the SaaS control panel — super admin only.
  // Schools (admins) manage their data through the mobile app.
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Super admin only
        </h1>
        <p className="max-w-sm text-sm text-slate-500">
          This console is reserved for the platform super admin. School
          accounts manage their data through the school app.
        </p>
        <button
          onClick={() => void logout()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <Outlet />;
}
