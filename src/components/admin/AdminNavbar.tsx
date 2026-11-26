import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Cpu,
  ShieldCheck,
  ExternalLink,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminNavbar() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isOnAdmin = pathname.startsWith('/admin');

  const displayName =
    profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Admin';
  const roleLabel =
    profile?.role === 'technician' ? 'Technician' : 'Administrator';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d1726] border-b border-slate-800/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Admin Console Badge */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex shrink-0 items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16263f] border border-slate-700/70 text-sky-400 group-hover:border-sky-500/60 transition">
              <Cpu className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">
              NextGenSolutions
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
            <LayoutDashboard className="h-3 w-3" />
            <span>Admin Console</span>
          </span>
        </div>

        {/* Right: Storefront Preview / Back to Admin + Admin Profile + Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isOnAdmin ? (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#152236] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/60 hover:bg-[#1a2b44] hover:text-white transition"
            >
              <span>View Storefront</span>
              <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
            </Link>
          ) : (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0369a1] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Admin Console</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="max-w-[120px] truncate font-semibold text-white">
              {displayName}
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
