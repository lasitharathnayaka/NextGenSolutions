import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  SlidersHorizontal,
  X,
  ShieldCheck,
  ShoppingCart,
  Check,
  Scale,
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
import { cn } from '@/lib/utils';

type SortOption = 'condition' | 'price-asc' | 'price-desc' | 'name';

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

const MIN_PRICE = 100;
const MAX_PRICE = 3500;
const ITEMS_PER_PAGE = 6;

export function CatalogPage() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') as ProductCategory | null;

  const [selectedConditions, setSelectedConditions] = useState<ProductCondition[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    initialCategory && CATEGORIES.includes(initialCategory)
      ? [initialCategory]
      : [],
  );
  const [selectedBrands, setSelectedBrands] = useState<ProductBrand[]>([]);
  const [selectedRam, setSelectedRam] = useState<RamCapacity | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [sortBy, setSortBy] = useState<SortOption>('condition');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});

  // Toggle helpers
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

  const clearAllFilters = () => {
    setSelectedConditions([]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRam(null);
    setMaxPrice(MAX_PRICE);
    setCurrentPage(1);
    if (urlQuery || initialCategory) {
      setSearchParams({});
    }
  };

  // Condition counts across full catalog
  const conditionCounts = useMemo(() => {
    return CONDITIONS.reduce<Record<ProductCondition, number>>(
      (acc, cond) => {
        acc[cond] = CATALOG_PRODUCTS.filter((p) => p.condition === cond).length;
        return acc;
      },
      { 'Brand New': 0, 'Used - Grade A': 0, 'Used - Grade B': 0 },
    );
  }, []);

  // Filtered & sorted items
  const filteredProducts = useMemo(() => {
    const query = urlQuery.trim().toLowerCase();

    const filtered = CATALOG_PRODUCTS.filter((item) => {
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
      if (item.price > maxPrice) {
        return false;
      }
      if (query) {
        const haystack = [
          item.name,
          item.sku,
          item.brand,
          item.category,
          ...item.specs,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
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
        // Preserve default curated order while keeping best conditions first when filtered
        if (
          selectedConditions.length > 0 ||
          selectedCategories.length > 0 ||
          selectedBrands.length > 0 ||
          selectedRam !== null ||
          maxPrice < MAX_PRICE ||
          query.length > 0
        ) {
          sorted.sort((a, b) => a.conditionRank - b.conditionRank);
        }
        break;
    }

    return sorted;
  }, [
    selectedConditions,
    selectedCategories,
    selectedBrands,
    selectedRam,
    maxPrice,
    sortBy,
    urlQuery,
  ]);

  // Active filter chips
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

    if (maxPrice < MAX_PRICE) {
      chips.push({
        key: 'price',
        label: `Up to $${maxPrice.toLocaleString()}`,
        onRemove: () => {
          setMaxPrice(MAX_PRICE);
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
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

  // Page Title & Breadcrumb
  const headingLabel = useMemo(() => {
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (selectedCategories.length > 1) return selectedCategories.join(' & ');
    return 'Laptops & Desktops';
  }, [selectedCategories]);

  // Cart & Compare handlers
  const handleAddToCart = (product: CatalogProduct) => {
    addToCart({
      id: product.id,
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
    () => CATALOG_PRODUCTS.filter((p) => compareIds.includes(p.id)),
    [compareIds],
  );

  // Slider percentage fill
  const pricePercent = ((maxPrice - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  // Sidebar content (reused for desktop & mobile drawer)
  const renderFilterSidebar = () => (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <SlidersHorizontal className="h-4 w-4 text-slate-600" />
          <span>Filters</span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {activeChips.length} active
        </span>
      </div>

      {/* CONDITION */}
      <div className="py-4 border-b border-slate-100">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Condition
        </h3>
        <div className="space-y-2.5">
          {CONDITIONS.map((condition) => {
            const checked = selectedConditions.includes(condition);
            return (
              <label
                key={condition}
                className="flex cursor-pointer items-center justify-between text-xs text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCondition(condition)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0284c7] accent-[#0284c7] focus:ring-sky-500 cursor-pointer"
                  />
                  <span className={cn(checked && 'font-medium text-slate-900')}>
                    {condition}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {conditionCounts[condition]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* CATEGORY */}
      <div className="py-4 border-b border-slate-100">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Category
        </h3>
        <div className="space-y-2.5">
          {CATEGORIES.map((category) => {
            const checked = selectedCategories.includes(category);
            return (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0284c7] accent-[#0284c7] focus:ring-sky-500 cursor-pointer"
                />
                <span className={cn(checked && 'font-medium text-slate-900')}>
                  {category}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* PRICE RANGE */}
      <div className="py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Price Range
          </h3>
          <span className="text-[11px] font-semibold text-slate-700">
            ${MIN_PRICE} - ${maxPrice.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={50}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{
            background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${pricePercent}%, #e2e8f0 ${pricePercent}%, #e2e8f0 100%)`,
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#0284c7]"
        />

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>${MIN_PRICE}</span>
          <span>${MAX_PRICE.toLocaleString()}</span>
        </div>
      </div>

      {/* BRAND */}
      <div className="py-4 border-b border-slate-100">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Brand
        </h3>
        <div className="space-y-2.5">
          {BRANDS.map((brand) => {
            const checked = selectedBrands.includes(brand);
            return (
              <label
                key={brand}
                className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBrand(brand)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0284c7] accent-[#0284c7] focus:ring-sky-500 cursor-pointer"
                />
                <span className={cn(checked && 'font-medium text-slate-900')}>
                  {brand}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* RAM CAPACITY */}
      <div className="pt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          RAM Capacity
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {RAM_OPTIONS.map((ram) => {
            const isSelected = selectedRam === ram;
            return (
              <button
                key={ram}
                type="button"
                onClick={() => toggleRam(ram)}
                className={cn(
                  'rounded-md border py-1.5 text-xs font-medium transition cursor-pointer',
                  isSelected
                    ? 'border-[#0284c7] bg-sky-50 text-[#0284c7] font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                {ram}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-5 pb-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <Link
          to="/catalog"
          onClick={clearAllFilters}
          className="text-slate-400 hover:text-slate-700 transition"
        >
          Catalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800">{headingLabel}</span>
      </nav>

      {/* Top Category Header & Active Filters Bar */}
      <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {headingLabel}
            </h1>
            <span className="text-xs text-slate-400">
              ({filteredProducts.length} items)
            </span>
          </div>

          {activeChips.length > 0 && (
            <>
              <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700"
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
                  className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-700 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Controls: Mobile Filters + Sort By */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeChips.length > 0 && (
              <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-sky-700">
                {activeChips.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="catalog-sort"
              className="text-xs text-slate-500 whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="condition">Condition: Best First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Sidebar + Products */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          {renderFilterSidebar()}
        </aside>

        {/* Mobile Collapsible Sidebar */}
        {mobileFiltersOpen && (
          <aside className="lg:hidden">{renderFilterSidebar()}</aside>
        )}

        {/* Product Grid */}
        <section className="lg:col-span-9">
          {paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white px-6 py-16 text-center shadow-2xs">
              <p className="text-sm font-bold text-slate-900">
                No hardware matches your current filters
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing a filter or adjusting the price range to explore more inventory.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 rounded-md bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product) => {
                const isAdded = Boolean(recentlyAdded[product.id]);
                const isCompared = compareIds.includes(product.id);
                const isBrandNew = product.condition === 'Brand New';

                return (
                  <article
                    key={product.id}
                    className="group flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-md transition"
                  >
                    {/* Top Badge & SKU Row */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug',
                          isBrandNew
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            isBrandNew ? 'bg-emerald-500' : 'bg-amber-500',
                          )}
                        />
                        <span>{product.conditionLabel}</span>
                      </span>

                      <span className="shrink-0 text-[10px] font-medium text-slate-400">
                        SKU: {product.sku}
                      </span>
                    </div>

                    {/* Product Thumbnail */}
                    <Link
                      to={`/product/${product.id}`}
                      className="mb-4 block aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-50 p-2"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full rounded-md object-cover transition duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Title */}
                    <Link
                      to={`/product/${product.id}`}
                      title={product.name}
                      className="truncate text-[13px] font-bold text-slate-900 hover:text-[#0284c7] transition"
                    >
                      {product.name}
                    </Link>

                    {/* Spec Pills */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.specs.map((spec) => (
                        <span
                          key={spec}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Warranty Line */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          product.warrantyTone === 'official'
                            ? 'text-emerald-600'
                            : 'text-amber-500',
                        )}
                      />
                      <span>{product.warranty}</span>
                    </div>

                    {/* Bottom Price & Action Row */}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Price
                        </p>
                        <p className="text-base font-extrabold leading-tight text-slate-900">
                          $
                          {product.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCompare(product.id)}
                          className={cn(
                            'rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer',
                            isCompared
                              ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                          )}
                        >
                          {isCompared ? 'Selected' : 'Compare'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white transition cursor-pointer',
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
          )}
        </section>
      </div>

      {/* Bottom Pagination Bar */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 sm:flex-row">
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
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 transition cursor-pointer"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={cn(
                'h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold transition cursor-pointer',
                page === safePage
                  ? 'bg-[#0284c7] text-white shadow-2xs'
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
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 transition cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Floating Compare Tray */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-slate-700/80 bg-[#0d1726] px-4 py-3 text-white shadow-2xl">
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
                className="rounded-md bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0369a1] transition cursor-pointer"
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
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
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
                        ${p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
