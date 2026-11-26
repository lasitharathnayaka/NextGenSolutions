import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
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
  const { user, isAdminOrStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#f8fafc] px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-slate-900">
            Admin Access Restricted
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Your account does not have Admin or Technician permissions. Contact
            a NextGenSolutions administrator if you need staff access.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0369a1] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
