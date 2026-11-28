import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
  ShieldCheck,
  ShoppingCart,
  Check,
  Scale,
  Heart,
  LayoutGrid,
  List,
  Sparkles,
  RotateCcw,
  ArrowUpRight,
  Laptop,
  Monitor,
  Cpu,
  HardDrive,
  Truck,
} from 'lucide-react';
import {
  CATALOG_PRODUCTS,
  type CatalogProduct,
  type ProductBrand,
  type ProductCategory,
  type ProductCondition,
  type RamCapacity,
} from '@/data/catalogProducts';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { subscribeProducts, type DbProduct } from '@/services/productsService';
import { cn } from '@/lib/utils';

function mapDbProductToCatalog(p: DbProduct): CatalogProduct {
  const category: ProductCategory =
    p.category === 'Laptops' ||
    p.category === 'Desktops' ||
    p.category === 'RAM' ||
    p.category === 'SSD / Storage'
      ? p.category
      : 'RAM';
  const brand: ProductBrand =
    p.brand === 'Dell' ||
    p.brand === 'Lenovo' ||
    p.brand === 'HP' ||
    p.brand === 'ASUS' ||
    p.brand === 'Samsung' ||
    p.brand === 'Kingston'
      ? p.brand
      : 'Dell';
  const conditionRank =
    p.condition === 'Brand New' ? 1 : p.condition === 'Used - Grade A' ? 2 : 3;

  return {
    id: p.slug || p.id,
    sku: p.sku,
    name: p.name,
    condition: p.condition,
    conditionLabel: p.condition_label || p.condition,
    conditionRank,
    category,
    brand,
    ramCapacity: p.ram_capacity ?? undefined,
    specs: p.specs && p.specs.length > 0 ? p.specs : [p.subtitle || 'Enterprise Grade'],
    warranty: p.warranty || '1 Yr Official Warranty',
    warrantyTone: p.warranty_tone || 'official',
    price: Number(p.price),
    inStock: Number(p.stock) > 0,
    image: p.image_urls?.[0] || '/images/dell-xps-15.jpg',
  };
}

type SortOption = 'condition' | 'price-asc' | 'price-desc' | 'name';
type ViewMode = 'grid' | 'list';

const CONDITIONS: ProductCondition[] = [
  'Brand New',
  'Used - Grade A',
  'Used - Grade B',
];

const CATEGORIES: ProductCategory[] = [
  'Laptops',
  'Desktops',
  'RAM',
  'SSD / Storage',
];

const BRANDS: ProductBrand[] = ['Dell', 'Lenovo', 'HP', 'ASUS', 'Samsung'];

const RAM_OPTIONS: RamCapacity[] = ['16GB', '32GB', '64GB'];

const MIN_PRICE = 25000;
const MAX_PRICE = 1050000;
const ITEMS_PER_PAGE = 6;

export function CatalogPage() {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') as ProductCategory | null;

  const [catalogItems, setCatalogItems] = useState<CatalogProduct[]>(
    isFirebaseConfigured ? [] : CATALOG_PRODUCTS,
  );
  const [selectedConditions, setSelectedConditions] = useState<ProductCondition[]>([]);

  useEffect(() => {
    const unsub = subscribeProducts((rows) => {
      if (!isFirebaseConfigured) {
        if (!rows || rows.length === 0) {
          setCatalogItems(CATALOG_PRODUCTS);
          return;
        }
      }
      const liveMapped = (rows ?? [])
        .filter((r) => r.is_active !== false)
        .map(mapDbProductToCatalog);
      setCatalogItems(liveMapped);
    });
    return () => unsub();
  }, []);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    initialCategory && CATEGORIES.includes(initialCategory)
      ? [initialCategory]
      : [],
  );
  const [selectedBrands, setSelectedBrands] = useState<ProductBrand[]>([]);
  const [selectedRam, setSelectedRam] = useState<RamCapacity | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('condition');

  const catalogMaxPrice = useMemo(() => {
    const highest = catalogItems.reduce(
      (max, item) => Math.max(max, item.price),
      MAX_PRICE,
    );
    return Math.ceil(highest / 50000) * 50000;
  }, [catalogItems]);

  const effectiveMaxPrice = maxPrice ?? catalogMaxPrice;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [urlQuery]);

  useEffect(() => {
    if (initialCategory && CATEGORIES.includes(initialCategory)) {
      setSelectedCategories([initialCategory]);
      setCurrentPage(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialCategory]);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState({
    condition: true,
    category: true,
    price: true,
    brand: true,
    ram: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCondition = (cond: ProductCondition) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond],
    );
    setCurrentPage(1);
  };

  const toggleCategory = (cat: ProductCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setCurrentPage(1);
  };

  const selectSingleCategory = (cat: ProductCategory | null) => {
    setSelectedCategories(cat ? [cat] : []);
    setCurrentPage(1);
  };

  const toggleBrand = (brand: ProductBrand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
    setCurrentPage(1);
  };

  const toggleRam = (ram: RamCapacity) => {
    setSelectedRam((prev) => (prev === ram ? null : ram));
    setCurrentPage(1);
  };

  const toggleWishlist = (product: CatalogProduct) => {
    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      badge: product.conditionLabel,
      category: `${product.brand} · ${product.category}`,
      warranty: product.warranty,
      href: `/product/${product.id}`,
    });
  };

  const clearAllFilters = () => {
    setSelectedConditions([]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRam(null);
    setMaxPrice(null);
    setCurrentPage(1);
    if (urlQuery || initialCategory) {
      setSearchParams({});
    }
  };

  const conditionCounts = useMemo(() => {
    return CONDITIONS.reduce<Record<ProductCondition, number>>(
      (acc, cond) => {
        acc[cond] = catalogItems.filter((p) => p.condition === cond).length;
        return acc;
      },
      { 'Brand New': 0, 'Used - Grade A': 0, 'Used - Grade B': 0 },
    );
  }, [catalogItems]);

  const filteredProducts = useMemo(() => {
    const query = urlQuery.trim().toLowerCase();

    const filtered = catalogItems.filter((item) => {
      if (
        selectedConditions.length > 0 &&
        !selectedConditions.includes(item.condition)
      ) {
        return false;
      }
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(item.category)
      ) {
        return false;
      }
      if (selectedBrands.length > 0 && !selectedBrands.includes(item.brand)) {
        return false;
      }
      if (selectedRam && item.ramCapacity !== selectedRam) {
        return false;
      }
      if (maxPrice !== null && item.price > maxPrice) {
        return false;
      }
      if (query) {
        const haystack = [
          item.name,
          item.sku,
          item.brand,
          item.category,
          item.condition,
          ...item.specs,
        ]
          .join(' ')
          .toLowerCase();
        const tokens = query.split(/\s+/);
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'condition':
      default:
        if (
          selectedConditions.length > 0 ||
          selectedCategories.length > 0 ||
          selectedBrands.length > 0 ||
          selectedRam !== null ||
          (maxPrice !== null && maxPrice < catalogMaxPrice) ||
          query.length > 0
        ) {
          sorted.sort((a, b) => a.conditionRank - b.conditionRank);
        }
        break;
    }

    return sorted;
  }, [
    catalogItems,
    selectedConditions,
    selectedCategories,
    selectedBrands,
    selectedRam,
    maxPrice,
    sortBy,
    urlQuery,
  ]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (urlQuery.trim()) {
      chips.push({
        key: `q-${urlQuery}`,
        label: `"${urlQuery.trim()}"`,
        onRemove: () => {
          const next = new URLSearchParams(searchParams);
          next.delete('q');
          setSearchParams(next);
          setCurrentPage(1);
        },
      });
    }

    selectedConditions.forEach((c) =>
      chips.push({
        key: `cond-${c}`,
        label: c,
        onRemove: () => toggleCondition(c),
      }),
    );

    selectedCategories.forEach((cat) =>
      chips.push({
        key: `cat-${cat}`,
        label: cat,
        onRemove: () => toggleCategory(cat),
      }),
    );

    if (selectedRam) {
      chips.push({
        key: `ram-${selectedRam}`,
        label: `${selectedRam} RAM`,
        onRemove: () => {
          setSelectedRam(null);
          setCurrentPage(1);
        },
      });
    }

    selectedBrands.forEach((b) =>
      chips.push({
        key: `brand-${b}`,
        label: b,
        onRemove: () => toggleBrand(b),
      }),
    );

    if (maxPrice !== null && maxPrice < catalogMaxPrice) {
      chips.push({
        key: 'price',
        label: `Up to Rs. ${maxPrice.toLocaleString()}`,
        onRemove: () => {
          setMaxPrice(null);
          setCurrentPage(1);
        },
      });
    }

    return chips;
  }, [
    urlQuery,
    selectedConditions,
    selectedCategories,
    selectedRam,
    selectedBrands,
    maxPrice,
    searchParams,
    setSearchParams,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const showingFrom = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  const headingLabel = useMemo(() => {
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (selectedCategories.length > 1) return selectedCategories.join(' & ');
    return 'All Enterprise Hardware';
  }, [selectedCategories]);

  const handleAddToCart = (product: CatalogProduct) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: '/catalog',
          notice: 'Please sign in to add items to your cart.',
        },
      });
      return;
    }
    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setRecentlyAdded((prev) => ({ ...prev, [product.id]: true }));
    window.setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [product.id]: false }));
    }, 1100);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const comparedProducts = useMemo(
    () => catalogItems.filter((p) => compareIds.includes(p.id)),
    [catalogItems, compareIds],
  );

  const pricePercent = Math.min(
    100,
    Math.max(
      0,
      ((effectiveMaxPrice - MIN_PRICE) / (catalogMaxPrice - MIN_PRICE)) * 100,
    ),
  );

  const categoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'Laptops':
        return Laptop;
      case 'Desktops':
        return Monitor;
      case 'RAM':
        return Cpu;
      case 'SSD / Storage':
        return HardDrive;
    }
  };

  const renderFilterSidebar = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 lg:sticky lg:top-20">
      {/* Stylish Dark Navy Sidebar Header */}
      <div className="flex items-center justify-between bg-[#0d1726] px-5 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="block text-xs font-bold tracking-tight">
              Hardware Filters
            </span>
            <span className="block text-[10px] text-slate-400">
              {activeChips.length === 0
                ? 'Refine specifications'
                : `${activeChips.length} active filter${activeChips.length > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-sky-400 hover:bg-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 px-5">
        {/* CONDITION */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => toggleSection('condition')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Condition Grade
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform',
                openSections.condition && 'rotate-180',
              )}
            />
          </button>

          {openSections.condition && (
            <div className="mt-3 space-y-2">
              {CONDITIONS.map((condition) => {
                const checked = selectedConditions.includes(condition);
                const isNew = condition === 'Brand New';
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleCondition(condition)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs transition cursor-pointer',
                      checked
                        ? 'border-[#0284c7] bg-sky-50/70 font-semibold text-slate-900 shadow-2xs'
                        : 'border-slate-200/80 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isNew ? 'bg-emerald-500' : 'bg-amber-500',
                        )}
                      />
                      <span>{condition}</span>
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        checked
                          ? 'bg-[#0284c7] text-white'
                          : 'bg-white text-slate-500 border border-slate-200/80',
                      )}
                    >
                      {conditionCounts[condition]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CATEGORY */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Category
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform',
                openSections.category && 'rotate-180',
              )}
            />
          </button>

          {openSections.category && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => {
                const checked = selectedCategories.includes(category);
                const Icon = categoryIcon(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left text-[11px] transition cursor-pointer',
                      checked
                        ? 'border-[#0284c7] bg-sky-50/80 font-bold text-[#0284c7] shadow-2xs'
                        : 'border-slate-200/80 bg-slate-50/40 font-medium text-slate-600 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        checked ? 'text-[#0284c7]' : 'text-slate-400',
                      )}
                    />
                    <span className="truncate w-full">{category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRICE RANGE */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Max Budget
            </span>
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0284c7]">
              Up to Rs. {effectiveMaxPrice.toLocaleString()}
            </span>
          </button>

          {openSections.price && (
            <div className="mt-3.5">
              <input
                type="range"
                min={MIN_PRICE}
                max={catalogMaxPrice}
                step={5000}
                value={effectiveMaxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxPrice(val >= catalogMaxPrice ? null : val);
                  setCurrentPage(1);
                }}
                style={{
                  background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${pricePercent}%, #e2e8f0 ${pricePercent}%, #e2e8f0 100%)`,
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#0284c7]"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-400">
                <span>Rs. {MIN_PRICE.toLocaleString()}</span>
                <span>Rs. {catalogMaxPrice.toLocaleString()}</span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {[150000, 450000, catalogMaxPrice].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setMaxPrice(preset >= catalogMaxPrice ? null : preset);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'rounded-lg border py-1 text-[10px] font-semibold transition cursor-pointer',
                      effectiveMaxPrice === preset
                        ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    ≤ Rs. {preset >= 1000000 ? `${(preset / 1000000).toFixed(2)}M` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BRAND */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => toggleSection('brand')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Manufacturer
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform',
                openSections.brand && 'rotate-180',
              )}
            />
          </button>

          {openSections.brand && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {BRANDS.map((brand) => {
                const checked = selectedBrands.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold transition cursor-pointer',
                      checked
                        ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RAM CAPACITY */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => toggleSection('ram')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Memory (RAM)
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform',
                openSections.ram && 'rotate-180',
              )}
            />
          </button>

          {openSections.ram && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {RAM_OPTIONS.map((ram) => {
                const isSelected = selectedRam === ram;
                return (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => toggleRam(ram)}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-bold transition cursor-pointer',
                      isSelected
                        ? 'border-[#0284c7] bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    {ram}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8fafc]">
      {/* Modern Dark-Navy Catalog Hero Header */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 py-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            <Link
              to="/"
              className="text-slate-400 hover:text-sky-400 transition"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <Link
              to="/catalog"
              onClick={clearAllFilters}
              className="text-slate-400 hover:text-sky-400 transition"
            >
              Catalog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-semibold text-sky-400">{headingLabel}</span>
          </nav>

          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                <Sparkles className="h-3 w-3" />
                <span>40-Point Certified Inventory</span>
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {headingLabel}
              </h1>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
                Browse factory-sealed workstations, Grade-A certified laptops,
                and enterprise-grade components backed by full warranty coverage.
              </p>
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => selectSingleCategory(null)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer',
                  selectedCategories.length === 0
                    ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/25'
                    : 'border border-slate-700/80 bg-[#121e31] text-slate-300 hover:border-slate-600 hover:text-white',
                )}
              >
                All ({catalogItems.length})
              </button>
              {CATEGORIES.map((cat) => {
                const isSelected =
                  selectedCategories.length === 1 &&
                  selectedCategories[0] === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => selectSingleCategory(cat)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer',
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/25'
                        : 'border border-slate-700/80 bg-[#121e31] text-slate-300 hover:border-slate-600 hover:text-white',
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        {/* Active Filters & Sort Toolbar */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-2xs lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-900">
              {filteredProducts.length} Hardware Units
            </span>

            {activeChips.length > 0 && (
              <>
                <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-[#0284c7]"
                    >
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`Remove ${chip.label} filter`}
                        className="text-sky-500 hover:text-sky-800 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-slate-700 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Controls: Mobile Filters + View Toggle + Sort By */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeChips.length > 0 && (
                <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-[#0284c7]">
                  {activeChips.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'rounded-md p-1.5 transition cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn(
                    'rounded-md p-1.5 transition cursor-pointer',
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700',
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="catalog-sort"
                  className="text-xs text-slate-500 whitespace-nowrap"
                >
                  Sort:
                </label>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="condition">Condition: Best First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Sidebar + Products */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <aside className="hidden lg:block lg:col-span-3">
            {renderFilterSidebar()}
          </aside>

          {mobileFiltersOpen && (
            <aside className="lg:hidden">{renderFilterSidebar()}</aside>
          )}

          <section className="lg:col-span-9">
            {paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-2xs">
                <p className="text-sm font-bold text-slate-900">
                  No hardware matches your current filters
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try clearing a filter or adjusting the price range to explore
                  more inventory.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-5',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1',
                )}
              >
                {paginatedProducts.map((product) => {
                  const isAdded = Boolean(recentlyAdded[product.id]);
                  const isCompared = compareIds.includes(product.id);
                  const isWishlisted = isFavorite(product.id);
                  const isBrandNew = product.condition === 'Brand New';
                  const isInStock = product.inStock !== false;

                  if (viewMode === 'list') {
                    return (
                      <article
                        key={product.id}
                        className="group flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-sky-200 hover:shadow-lg transition sm:flex-row sm:items-center"
                      >
                        <Link
                          to={`/product/${product.id}`}
                          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:w-52"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </Link>

                        <div className="flex flex-1 flex-col justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                                  isBrandNew
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700',
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    isBrandNew
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500',
                                  )}
                                />
                                <span>{product.conditionLabel}</span>
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                                    isInStock
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      isInStock ? 'bg-emerald-500' : 'bg-rose-500',
                                    )}
                                  />
                                  <span>{isInStock ? 'In Stock' : 'Out of Stock'}</span>
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                  Product ID: {product.sku}
                                </span>
                              </span>
                            </div>

                            <Link
                              to={`/product/${product.id}`}
                              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-[#0284c7] transition"
                            >
                              <span>{product.name}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                            </Link>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {product.specs.map((spec) => (
                                <span
                                  key={spec}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-4">
                              <p className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                                Rs.{' '}
                                {product.price.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <ShieldCheck
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    product.warrantyTone === 'official'
                                      ? 'text-emerald-600'
                                      : 'text-amber-500',
                                  )}
                                />
                                {product.warranty}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCompare(product.id)}
                                className={cn(
                                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer',
                                  isCompared
                                    ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                                )}
                              >
                                {isCompared ? 'Selected' : 'Compare'}
                              </button>
                              <button
                                type="button"
                                disabled={!isInStock}
                                onClick={() => handleAddToCart(product)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                                  !isInStock
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : isAdded
                                      ? 'bg-emerald-600 text-white cursor-pointer'
                                      : 'bg-[#0284c7] text-white hover:bg-[#0369a1] cursor-pointer',
                                )}
                              >
                                {!isInStock ? (
                                  <span>Out of Stock</span>
                                ) : isAdded ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    <span>Add to Cart</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:-translate-y-1 hover:border-sky-300/80 hover:shadow-xl hover:shadow-slate-200/70 transition duration-300"
                    >
                      {/* Full-Bleed Image Header */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <Link
                          to={`/product/${product.id}`}
                          className="block h-full w-full"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </Link>

                        {/* Top-Left Condition Pill */}
                        <span
                          className={cn(
                            'pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md',
                            isBrandNew
                              ? 'bg-emerald-600/90 text-white'
                              : 'bg-amber-500/95 text-white',
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                          <span>{product.conditionLabel}</span>
                        </span>

                        {/* Top-Right Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          aria-label={`Save ${product.name} to favourites`}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-xs hover:text-rose-500 transition cursor-pointer"
                        >
                          <Heart
                            className={cn(
                              'h-4 w-4',
                              isWishlisted && 'fill-rose-500 text-rose-500',
                            )}
                          />
                        </button>

                        {/* Hover Quick-View Pill */}
                        <Link
                          to={`/product/${product.id}`}
                          className="absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1 rounded-full bg-[#0d1726]/90 px-3 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md backdrop-blur-xs transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#0284c7]"
                        >
                          <span>Inspect Specs</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-1 flex-col p-4">
                        {/* Product ID + Stock Status */}
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                            {product.sku}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                              isInStock
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700',
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                isInStock ? 'bg-emerald-500' : 'bg-rose-500',
                              )}
                            />
                            <span>{isInStock ? 'In Stock' : 'Out of Stock'}</span>
                          </span>
                        </div>

                        {/* 2-line Clamped Product Title */}
                        <Link
                          to={`/product/${product.id}`}
                          title={product.name}
                          className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[14px] font-bold leading-snug text-slate-900 hover:text-[#0284c7] transition"
                        >
                          {product.name}
                        </Link>

                        {/* Spec Pills */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {product.specs.map((spec) => (
                            <span
                              key={spec}
                              className="rounded-md border border-slate-200/70 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>

                        {/* Warranty & Free Dispatch Row */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck
                              className={cn(
                                'h-3.5 w-3.5 shrink-0',
                                product.warrantyTone === 'official'
                                  ? 'text-emerald-600'
                                  : 'text-amber-500',
                              )}
                            />
                            <span>{product.warranty}</span>
                          </span>
                          {product.price >= 150000 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <Truck className="h-3 w-3" />
                              <span>Free Dispatch</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Price & Action Bar */}
                        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3.5 mt-4">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                              Enterprise Price
                            </p>
                            <p className="text-[13px] font-extrabold leading-tight text-slate-900 whitespace-nowrap">
                              Rs.{' '}
                              {product.price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleCompare(product.id)}
                              title="Compare device"
                              className={cn(
                                'rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition cursor-pointer',
                                isCompared
                                  ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                              )}
                            >
                              {isCompared ? 'Selected' : 'Compare'}
                            </button>

                            <button
                              type="button"
                              disabled={!isInStock}
                              onClick={() => handleAddToCart(product)}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold shadow-xs transition',
                                !isInStock
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : isAdded
                                    ? 'bg-emerald-600 text-white cursor-pointer'
                                    : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white hover:from-[#0369a1] hover:to-[#0284c7] cursor-pointer',
                              )}
                            >
                              {!isInStock ? (
                                <span>Out of Stock</span>
                              ) : isAdded ? (
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
          </section>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {showingFrom}-{showingTo}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {filteredProducts.length}
            </span>{' '}
            items
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 transition cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'h-8 min-w-8 rounded-lg px-2.5 text-xs font-semibold transition cursor-pointer',
                  page === safePage
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Compare Tray */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-700/80 bg-[#0d1726]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Scale className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-semibold">
                Comparing {comparedProducts.length} of 3 devices
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                className="rounded-lg bg-[#0284c7] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0369a1] transition cursor-pointer"
              >
                Compare Specs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">
                Hardware Comparison ({comparedProducts.length})
              </h2>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 font-semibold text-slate-400">
                      Spec
                    </th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="px-3 py-2 font-bold text-slate-900">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-500">SKU</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-2.5 text-slate-700">
                        {p.sku}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-500">
                      Condition
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-2.5 text-slate-700">
                        {p.conditionLabel}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-500">
                      Configuration
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-2.5 text-slate-700">
                        {p.specs.join(' · ')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-500">
                      Warranty
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-2.5 text-slate-700">
                        {p.warranty}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-500">
                      Price
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        className="px-3 py-2.5 font-extrabold text-slate-900"
                      >
                        Rs. {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
