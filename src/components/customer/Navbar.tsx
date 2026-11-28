import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Wrench,
  ShoppingCart,
  User,
  Menu,
  X,
  LogIn,
  LogOut,
  ArrowRight,
  KeyRound,
  Heart,
  Sun,
  Moon,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATALOG_PRODUCTS } from '@/data/catalogProducts';
import { FEATURED_DEALS } from '@/data/featuredProducts';
import { cn } from '@/lib/utils';

interface QuickSearchResult {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image?: string;
  href: string;
  kind: 'hardware' | 'software';
  searchText: string;
}

const SOFTWARE_SEARCH_ITEMS: QuickSearchResult[] = [
  {
    id: 'sw-win11',
    name: 'Windows 11 Pro',
    subtitle: 'Microsoft · Lifetime Retail Key',
    price: 14500,
    href: '/software',
    kind: 'software',
    searchText: 'windows 11 pro microsoft os software license key',
  },
  {
    id: 'sw-office24',
    name: 'Microsoft Office 2024 Pro Plus',
    subtitle: 'Microsoft · Lifetime Suite',
    price: 18500,
    href: '/software',
    kind: 'software',
    searchText: 'microsoft office 2024 pro plus word excel powerpoint software license key',
  },
  {
    id: 'sw-kaspersky',
    name: 'Kaspersky Total Security',
    subtitle: 'Kaspersky · 5-Device Shield',
    price: 9500,
    href: '/software',
    kind: 'software',
    searchText: 'kaspersky total security antivirus vpn software license key',
  },
  {
    id: 'sw-adobe',
    name: 'Adobe Creative Cloud Suite',
    subtitle: 'Adobe · All Apps Pass',
    price: 179000,
    href: '/software',
    kind: 'software',
    searchText: 'adobe creative cloud photoshop premiere software license key',
  },
  {
    id: 'sw-vs2022',
    name: 'Visual Studio 2022 Enterprise',
    subtitle: 'Microsoft · Enterprise DevOps',
    price: 295000,
    href: '/software',
    kind: 'software',
    searchText: 'visual studio 2022 enterprise developer software license key',
  },
];

const ALL_SEARCH_ITEMS: QuickSearchResult[] = [
  ...CATALOG_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: `${p.brand} · ${p.category} · ${p.condition}`,
    price: p.price,
    image: p.image,
    href: `/product/${p.id}`,
    kind: 'hardware' as const,
    searchText: [p.name, p.sku, p.brand, p.category, p.condition, ...p.specs]
      .join(' ')
      .toLowerCase(),
  })),
  ...FEATURED_DEALS.filter(
    (f) => !CATALOG_PRODUCTS.some((c) => c.name.toLowerCase() === f.name.toLowerCase()),
  ).map((f) => ({
    id: f.id,
    name: f.name,
    subtitle: f.category === 'software' ? 'Enterprise Software License' : `Featured · ${f.badge}`,
    price: f.price,
    image: f.image,
    href: f.category === 'software' ? '/software' : `/product/${f.id}`,
    kind: f.category === 'software' ? ('software' as const) : ('hardware' as const),
    searchText: [f.name, f.badge, f.category, ...f.specs].join(' ').toLowerCase(),
  })),
  ...SOFTWARE_SEARCH_ITEMS,
];

export function Navbar() {
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const { user, profile, isAdminOrStaff, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isProductRoute = pathname.startsWith('/product');
  const isAccountRoute = pathname === '/account' || pathname === '/repair-status';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const q = params.get('q');
    if (pathname === '/catalog' && q !== null) {
      setSearchQuery(q);
    }
  }, [pathname, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const liveResults = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];
    const tokens = trimmed.split(/\s+/);
    return ALL_SEARCH_ITEMS.filter((item) =>
      tokens.every((token) => item.searchText.includes(token)),
    ).slice(0, 6);
  }, [searchQuery]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchFocused(false);
    navigate(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d1726] border-b border-slate-800/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Search */}
        <div className="flex flex-1 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <img
              src="/images/nextgen-logo.jpg"
              alt="NextGenSolution logo"
              className="h-9 w-9 rounded-lg object-cover border border-sky-500/30 shadow-xs group-hover:border-sky-400/70 transition"
            />
            <span className="text-[15px] font-bold tracking-tight text-white">
              NextGenSolution
            </span>
          </Link>

          {/* Desktop Search Bar with Live Results Dropdown */}
          <div ref={searchContainerRef} className="relative hidden md:block w-full max-w-sm">
            <form onSubmit={handleSearchSubmit} className="relative">
              <button
                type="submit"
                aria-label="Search products"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchFocused(false);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search laptops, RAM, NVMe, software..."
                className="w-full rounded-md border border-slate-700/70 bg-[#152236] py-2 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl z-50">
                {liveResults.length > 0 ? (
                  <>
                    <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {liveResults.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate(item.href);
                            }}
                            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-sky-50/70 transition cursor-pointer"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-10 w-12 shrink-0 rounded-lg border border-slate-200/80 object-cover bg-slate-50"
                              />
                            ) : (
                              <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-[#0284c7]">
                                <KeyRound className="h-4 w-4" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {item.name}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {item.subtitle}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-extrabold text-[#0284c7]">
                              Rs. {item.price.toLocaleString('en-US')}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-[#0284c7] hover:bg-sky-50 transition cursor-pointer"
                    >
                      <span>View all results for &ldquo;{searchQuery.trim()}&rdquo;</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center text-xs text-slate-500">
                    No products found for{' '}
                    <span className="font-semibold text-slate-800">
                      &ldquo;{searchQuery.trim()}&rdquo;
                    </span>
                    . Try searching &ldquo;Dell&rdquo;, &ldquo;RAM&rdquo;, &ldquo;NVMe&rdquo;, or &ldquo;Windows&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>
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
              to="/product"
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
              to="/support"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a2942] text-white'
                    : 'text-slate-300 hover:bg-[#162338] hover:text-white',
                )
              }
            >
              Support
            </NavLink>
            {isAdminOrStaff && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                    isActive
                      ? 'bg-[#1a2942] text-white'
                      : 'text-sky-300 hover:bg-[#162338] hover:text-white',
                  )
                }
              >
                Admin Console
              </NavLink>
            )}
          </nav>

          <Link
            to="/book-repair"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0369a1] transition"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Book a Repair</span>
          </Link>

          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-[#162338] hover:text-amber-300 transition cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5 text-amber-300" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Favourites Button */}
          <Link
            to="/favorites"
            aria-label="Saved Favourites"
            title="Saved Favourites"
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-md transition',
              pathname === '/favorites'
                ? 'bg-[#1a2942] text-rose-400'
                : 'text-slate-300 hover:bg-[#162338] hover:text-rose-400',
            )}
          >
            <Heart
              className={cn(
                'h-4.5 w-4.5',
                totalFavorites > 0 && 'fill-rose-500 text-rose-500',
              )}
            />
            {totalFavorites > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {totalFavorites}
              </span>
            )}
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

          {/* Auth / User Account Actions */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/account"
                aria-label="Customer Account Dashboard"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                  isAccountRoute
                    ? 'border-sky-400 bg-[#0284c7] text-white shadow-xs'
                    : 'border-sky-400/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-white',
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden xl:inline max-w-[90px] truncate">
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </span>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                title="Sign Out"
                aria-label="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-[#162338] hover:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#162338] hover:text-white transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="rounded-md border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 hover:text-white transition"
              >
                Sign Up
              </Link>
            </div>
          )}

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
              to="/product"
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
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-[#162338] hover:text-white"
            >
              Support
            </Link>
            {isAdminOrStaff && (
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
            )}
            <Link
              to="/book-repair"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0284c7] px-3.5 py-2.5 text-sm font-semibold text-white"
            >
              <Wrench className="h-4 w-4" />
              <span>Book a Repair</span>
            </Link>
            {user ? (
              <div className="mt-2 flex gap-2 border-t border-slate-800 pt-3">
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded-md border border-slate-700 py-2 text-center text-xs font-semibold text-white"
                >
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex-1 rounded-md border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 border-t border-slate-800 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded-md border border-slate-700 py-2 text-center text-xs font-semibold text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded-md bg-sky-500/20 border border-sky-400/40 py-2 text-center text-xs font-semibold text-sky-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
