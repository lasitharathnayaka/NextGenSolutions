import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Wrench,
  ArrowRight,
  Laptop,
  Cpu,
  KeyRound,
  Heart,
  ShieldCheck,
  ShoppingCart,
  Check,
  Truck,
  Headphones,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  FEATURED_DEALS,
  type DealCategory,
  type FeaturedDealProduct,
} from '@/data/featuredProducts';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  {
    title: 'Laptops & Desktops',
    description:
      'Brand New & Certified Refurbished systems ready for deployment.',
    icon: Laptop,
    href: '/catalog',
    filter: null,
  },
  {
    title: 'PC Components',
    description:
      'High-performance RAM kits, NVMe SSDs, and flagship GPUs.',
    icon: Cpu,
    href: '/catalog?category=RAM',
    filter: null,
  },
  {
    title: 'Instant Software Keys',
    description:
      'OS licenses, development tools, and creative suite subscriptions.',
    icon: KeyRound,
    href: '/software',
    filter: null,
  },
  {
    title: 'Repair & Upgrades',
    description:
      'Same-day expert diagnostics, component repairs, and custom builds.',
    icon: Wrench,
    href: '/book-repair',
    filter: null,
  },
];

const BENEFITS = [
  {
    title: 'Express Dispatch',
    description:
      'Free secure shipping on all orders over Rs. 150,000 with real-time tracking.',
    icon: Truck,
  },
  {
    title: 'Certified Refurbished',
    description:
      'Rigorous 40-point inspection and multi-stage benchmark testing on all units.',
    icon: ShieldCheck,
  },
  {
    title: 'Expert Technician Support',
    description:
      'Direct access to certified hardware engineers for troubleshooting and config.',
    icon: Headphones,
  },
  {
    title: 'Hassle-Free Returns',
    description:
      '30-day money-back guarantee on all retail hardware and components.',
    icon: RefreshCw,
  },
];

const FILTER_TABS: { id: DealCategory; label: string }[] = [
  { id: 'all', label: 'All Products' },
  { id: 'workstations', label: 'Workstations' },
  { id: 'components', label: 'Components' },
];

const HERO_SLIDES = [
  {
    id: 'titan-rig',
    tag: 'Featured Rig',
    title: 'NextGen Titan X Pro Workstation',
    image: '/images/hero-workstation.jpg',
    bgImage: '/images/hero-bg-workstation.jpg',
    href: '/product/nextgen-titan-x-pro',
    glowClass: 'from-sky-500/20 via-cyan-500/10 to-indigo-600/15',
  },
  {
    id: 'cybercraft',
    tag: 'Instant Suite',
    title: 'CyberCraft Pro Studio Enterprise',
    image: '/images/cybercraft-studio.jpg',
    bgImage: '/images/hero-bg-workspace.jpg',
    href: '/software',
    glowClass: 'from-sky-600/20 via-blue-500/10 to-purple-500/15',
  },
  {
    id: 'xps-creator',
    tag: 'Certified Creator',
    title: 'Dell XPS 15 9530 Creator Edition',
    image: '/images/dell-xps-15.jpg',
    bgImage: '/images/hero-workstation.jpg',
    href: '/product/dell-xps-15-9530',
    glowClass: 'from-cyan-500/20 via-sky-500/10 to-emerald-500/15',
  },
  {
    id: 'omen-45l',
    tag: 'Flagship Tower',
    title: 'HP Omen 45L Gaming Workstation',
    image: '/images/hp-omen-45l.jpg',
    bgImage: '/images/cybercraft-studio.jpg',
    href: '/product/hp-omen-45l-gaming',
    glowClass: 'from-indigo-500/20 via-sky-500/10 to-cyan-500/15',
  },
];

export function HomePage() {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DealCategory>('all');
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = HERO_SLIDES[heroSlideIdx];

  const filteredProducts = FEATURED_DEALS.filter((product) => {
    if (activeTab === 'all') return true;
    return product.category === activeTab;
  });

  const toggleWishlist = (product: FeaturedDealProduct) => {
    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      priceSuffix: product.priceSuffix,
      image: product.image,
      badge: product.badge,
      category: product.category,
      warranty: product.warranty,
      href: product.category === 'software' ? '/software' : `/product/${product.id}`,
    });
  };

  const handleAddToCart = (product: FeaturedDealProduct) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: '/',
          notice: 'Please sign in to add items to your cart.',
        },
      });
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      priceSuffix: product.priceSuffix,
      image: product.image,
    });
    setRecentlyAdded((prev) => ({ ...prev, [product.id]: true }));
    window.setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <div>
      {/* Hero Section with Live Changing Background */}
      <section className="relative overflow-hidden bg-[#08101d] pt-12 pb-28 sm:pt-16 sm:pb-32">
        {/* Live Crossfading Full-Bleed Background Images */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 transition-all duration-1000 ease-in-out',
              idx === heroSlideIdx
                ? 'opacity-65 scale-100'
                : 'opacity-0 scale-105',
            )}
          >
            <img
              src={slide.bgImage}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}

        {/* Dynamic Color-Shifting Gradient Veil + Legibility Scrim */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br transition-all duration-1000',
            activeSlide.glowClass,
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070e1b]/95 via-[#081222]/75 to-[#070e1b]/35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070e1b]/90 via-transparent to-[#070e1b]/60"
        />

        {/* Animated Drifting Tech Grid */}
        <div
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56, 189, 248, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          className="pointer-events-none absolute inset-0 animate-grid-drift"
        />

        {/* Live Floating Aurora Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl animate-aurora-1"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl animate-aurora-2"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-400">
                <Sparkles className="h-3 w-3" />
                <span>Enterprise Hardware &amp; Diagnostics</span>
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl">
                Next-Gen Hardware,
                <br />
                Certified Refurbished &amp;
                <br />
                Expert Repairs
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
                Engineered for peak performance. Explore enterprise-grade
                workstations, high-speed storage components, and instant
                software licensing backed by industry-leading warranties.
              </p>

              {/* CTA Row */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0284c7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0369a1] transition"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Shop Hardware</span>
                </Link>
                <Link
                  to="/book-repair"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#152236] px-5 py-2.5 text-sm font-semibold text-white hover:border-slate-600 hover:bg-[#1b2b44] transition"
                >
                  <Wrench className="h-4 w-4 text-slate-300" />
                  <span>Book a Service</span>
                </Link>
              </div>

              {/* Metrics Row */}
              <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-800/90 pt-6">
                <div>
                  <p className="text-xl font-bold text-white sm:text-2xl">
                    99.9%
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Uptime Reliability
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white sm:text-2xl">
                    24h
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Diagnostic Turnaround
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white sm:text-2xl">
                    3-Year
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Global Warranty
                  </p>
                </div>
              </div>
            </div>

            {/* Right Featured Rig Showcase Card */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-xl border border-slate-700/70 bg-[#09111d]/90 shadow-2xl backdrop-blur-md">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a1322]">
                  {HERO_SLIDES.map((slide, idx) => (
                    <img
                      key={slide.id}
                      src={slide.image}
                      alt={slide.title}
                      className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105',
                        idx === heroSlideIdx
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-105 pointer-events-none',
                      )}
                    />
                  ))}

                  {/* Live Indicator Dots */}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/60 px-2.5 py-1 backdrop-blur-xs">
                    {HERO_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setHeroSlideIdx(idx)}
                        aria-label={`Show ${slide.title}`}
                        className={cn(
                          'h-1.5 rounded-full transition-all cursor-pointer',
                          idx === heroSlideIdx
                            ? 'w-4 bg-sky-400'
                            : 'w-1.5 bg-slate-400/60 hover:bg-white',
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Overlay Bar */}
                <div className="flex items-center justify-between border-t border-slate-700/60 bg-[#0d1726]/95 px-5 py-3.5 backdrop-blur-md">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      {activeSlide.tag}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      {activeSlide.title}
                    </p>
                  </div>
                  <Link
                    to={activeSlide.href}
                    aria-label={`View ${activeSlide.title}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1a2942] text-slate-200 hover:bg-[#0284c7] hover:text-white transition"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overlapping 4-Card Category Strip */}
      <section className="relative z-10 -mt-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const cardClasses =
              'group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-sky-300 hover:shadow-md transition text-left';

            if (category.filter !== null) {
              return (
                <a
                  key={category.title}
                  href={category.href}
                  onClick={() => setActiveTab(category.filter!)}
                  className={cardClasses}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
                  </div>
                  <div className="mt-4">
                    <h2 className="text-sm font-bold text-slate-900">
                      {category.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {category.description}
                    </p>
                  </div>
                </a>
              );
            }

            return (
              <Link key={category.title} to={category.href} className={cardClasses}>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
                </div>
                <div className="mt-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    {category.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {category.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Hardware & Software Deals */}
      <section
        id="featured-deals"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
              Curated Inventory
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Featured Hardware &amp; Software Deals
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex items-center gap-1 self-start rounded-lg bg-slate-100/80 p-1 sm:self-auto">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-xs font-medium transition cursor-pointer',
                    isActive
                      ? 'bg-white font-semibold text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const isWishlisted = isFavorite(product.id);
            const isAdded = Boolean(recentlyAdded[product.id]);

            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition"
              >
                {/* Product Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <Link to={`/product/${product.id}`} className="block h-full w-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </Link>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      'pointer-events-none absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold text-white shadow-xs',
                      product.badgeVariant === 'emerald'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500',
                    )}
                  >
                    {product.badge}
                  </span>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={`Save ${product.name} to favourites`}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-xs hover:text-rose-500 transition cursor-pointer"
                  >
                    <Heart
                      className={cn(
                        'h-3.5 w-3.5',
                        isWishlisted && 'fill-rose-500 text-rose-500',
                      )}
                    />
                  </button>
                </div>

                {/* Product Body */}
                <div className="flex flex-1 flex-col p-4">
                  <Link
                    to={`/product/${product.id}`}
                    className="text-[15px] font-bold text-slate-900 hover:text-[#0284c7] transition"
                  >
                    {product.name}
                  </Link>

                  <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                    {product.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <span>{product.warranty}</span>
                  </div>

                  {/* Price + Add CTA */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base font-extrabold text-slate-900">
                        Rs.{' '}
                        {product.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {product.priceSuffix && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {product.priceSuffix}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer',
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
              </article>
            );
          })}
        </div>
      </section>

      {/* Trust & Benefits Strip */}
      <section className="border-t border-slate-200/80 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
