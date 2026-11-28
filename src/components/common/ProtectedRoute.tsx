import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-xs text-slate-500">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          notice: 'Please sign in to access this page.',
        }}
      />
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, isAdminOrStaff, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && (!profile || profile.id !== user.uid))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-xs text-slate-500">
        Verifying staff permissions...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          notice: 'Admin or Technician sign-in required.',
        }}
      />
    );
  }

  if (!isAdminOrStaff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
