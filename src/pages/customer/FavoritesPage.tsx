import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ChevronRight,
  ShoppingCart,
  Trash2,
  Check,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useFavorites, type FavoriteItem } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function FavoritesPage() {
  const { favorites, totalFavorites, removeFavorite, clearFavorites } =
    useFavorites();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>(
    {},
  );

  const handleAddToCart = (item: FavoriteItem) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: '/favorites',
          notice: 'Please sign in to add items to your cart.',
        },
      });
      return;
    }

    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      priceSuffix: item.priceSuffix,
      image: item.image,
    });
    setRecentlyAdded((prev) => ({ ...prev, [item.id]: true }));
    window.setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark-Navy Favourites Header */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
          className="pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            <Link to="/" className="text-slate-400 hover:text-sky-400 transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-semibold text-rose-400">Favourites</span>
          </nav>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                <span>Saved Wishlist</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Your Favourite Hardware &amp; Deals
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {totalFavorites} saved item{totalFavorites !== 1 ? 's' : ''} ready
                to inspect or move to your cart anytime.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {totalFavorites > 0 && (
                <button
                  type="button"
                  onClick={clearFavorites}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <Link
                to="/catalog"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                Continue Shopping →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No favourites saved yet
            </h2>
            <p className="mt-1.5 mx-auto max-w-md text-xs text-slate-500">
              Tap the heart icon on any laptop, workstation, or PC component to
              keep track of your favourite builds and compare them later.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#0369a1] hover:to-[#0284c7] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Browse Hardware Catalog</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((item) => {
              const isAdded = Boolean(recentlyAdded[item.id]);
              return (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:-translate-y-1 hover:border-sky-300/80 hover:shadow-xl hover:shadow-slate-200/70 transition duration-300"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <Link to={item.href} className="block h-full w-full">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {item.badge && (
                      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#0d1726]/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                        {item.badge}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFavorite(item.id)}
                      aria-label={`Remove ${item.name} from favourites`}
                      title="Remove from favourites"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                    </button>

                    <Link
                      to={item.href}
                      className="absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1 rounded-full bg-[#0d1726]/90 px-3 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#0284c7]"
                    >
                      <span>Inspect Specs</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {item.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                        {item.category}
                      </span>
                    )}
                    <Link
                      to={item.href}
                      className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 hover:text-[#0284c7] transition"
                    >
                      {item.name}
                    </Link>

                    {item.warranty && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{item.warranty}</span>
                      </div>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3.5 mt-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Price
                        </p>
                        <p className="text-base font-extrabold text-slate-900">
                          Rs.{' '}
                          {item.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                          {item.priceSuffix ?? ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer',
                            isAdded
                              ? 'bg-emerald-600'
                              : 'bg-[#0284c7] hover:bg-[#0369a1]',
                          )}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
