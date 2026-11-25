import { useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Wrench,
  ShoppingCart,
  User,
  Menu,
  X,
  Cpu,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isProductRoute = pathname.startsWith('/product');
  const isAccountRoute = pathname === '/account' || pathname === '/repair-status';
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d1726] border-b border-slate-800/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Search */}
        <div className="flex flex-1 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16263f] border border-slate-700/70 text-sky-400 group-hover:border-sky-500/60 transition">
              <Cpu className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">
              NextGenSolutions
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden md:block w-full max-w-sm"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware, components, schematics..."
              className="w-full rounded-md border border-slate-700/70 bg-[#152236] py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </form>
        </div>

        {/* Right: Nav Links + Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden lg:flex items-center gap-1 mr-1">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Catalog
            </NavLink>
            <NavLink
              to="/software"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Software
            </NavLink>
            <Link
              to="/product/dell-latitude-7430"
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                isProductRoute
                  ? 'bg-[#1a2942] text-white'
                  : 'text-slate-300 hover:bg-[#162338] hover:text-white',
              )}
            >
              Product Detail
            </Link>
            <NavLink
              to="/repair-status"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Repair Status
            </NavLink>
            <Link
              to="/support"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#162338] hover:text-white transition"
            >
              Support
            </Link>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Admin / Staff Management
            </NavLink>
          </nav>

          <Link
            to="/book-repair"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0369a1] transition"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Book a Repair</span>
          </Link>

          {/* Cart Button */}
          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-[#162338] hover:text-white transition"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          </Link>

          {/* User Profile Button */}
          <Link
            to="/account"
            aria-label="Customer Account Dashboard"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border transition',
              isAccountRoute
                ? 'border-sky-400 bg-[#0284c7] text-white shadow-xs'
                : 'border-sky-400/40 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30',
            )}
          >
            <User className="h-4 w-4" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-[#162338] hover:text-white transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0d1726] px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative md:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware, components, schematics..."
              className="w-full rounded-md border border-slate-700/70 bg-[#152236] py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Catalog
            </NavLink>
            <NavLink
              to="/software"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Software
            </NavLink>
            <Link
              to="/product/dell-latitude-7430"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition',
                isProductRoute
                  ? 'bg-[#1a2942] text-white'
                  : 'text-slate-300 hover:bg-[#162338] hover:text-white',
              )}
            >
              Product Detail
            </Link>
            <Link
              to="/repair-status"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-[#162338] hover:text-white"
            >
              Repair Status
            </Link>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-[#162338] hover:text-white"
            >
              Support
            </Link>
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Admin / Staff Management
            </NavLink>
            <Link
              to="/book-repair"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0284c7] px-3.5 py-2.5 text-sm font-semibold text-white"
            >
              <Wrench className="h-4 w-4" />
              <span>Book a Repair</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
