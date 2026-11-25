import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  ClipboardCheck,
  Check,
  ShieldCheck,
  ShoppingCart,
  Minus,
  Plus,
  Zap,
  AlertTriangle,
  CheckCircle2,
  X,
  Cpu,
} from 'lucide-react';
import {
  getProductDetailById,
  type ProductReview,
} from '@/data/productDetails';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

type DetailTab = 'specs' | 'compatibility' | 'reviews';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = getProductDetailById(id);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedConditionId, setSelectedConditionId] = useState(
    product.defaultConditionId,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>('specs');
  const [selectedDockId, setSelectedDockId] = useState(product.docks[0].id);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Local reviews state (so "Write a Review" actually appends a live review)
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Reset selections when navigating to a different product id
  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedConditionId(product.defaultConditionId);
    setQuantity(1);
    setActiveTab('specs');
    setSelectedDockId(product.docks[0].id);
    setReviews(product.reviews);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const activeCondition =
    product.conditions.find((c) => c.id === selectedConditionId) ??
    product.conditions[1];

  const activeDock =
    product.docks.find((d) => d.id === selectedDockId) ?? product.docks[0];

  const totalPrice = activeCondition.price * quantity;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) {
      addToCart({
        id: `${product.id}-${activeCondition.id}`,
        name: `${product.breadcrumbName} (${activeCondition.title})`,
        price: activeCondition.price,
        image: product.gallery[0].src,
      });
    }
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1400);
  };

  const handleTabClick = (tab: DetailTab) => {
    setActiveTab(tab);
    if (tab === 'reviews') {
      const el = document.getElementById('customer-reviews');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    const parts = newReviewName.trim().split(/\s+/);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');

    const created: ProductReview = {
      id: `rev-${Date.now()}`,
      initials: initials || 'NG',
      author: newReviewName.trim(),
      date: 'Just now',
      rating: newReviewRating,
      comment: `"${newReviewComment.trim()}"`,
      verified: true,
    };

    setReviews((prev) => [created, ...prev]);
    setNewReviewName('');
    setNewReviewComment('');
    setNewReviewRating(5);
    setReviewModalOpen(false);
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
          <Link to="/catalog" className="text-slate-400 hover:text-slate-700 transition">
            Catalog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link to="/catalog" className="text-slate-400 hover:text-slate-700 transition">
            {product.categoryLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {product.breadcrumbName}
          </span>
        </nav>

        {/* Top 2-Column Product Showcase */}
        <div className="mt-5 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100">
              <img
                src={product.gallery[selectedImageIdx]?.src}
                alt={product.gallery[selectedImageIdx]?.alt}
                style={{
                  objectPosition:
                    product.gallery[selectedImageIdx]?.objectPosition ?? 'center',
                }}
                className="h-full w-full object-cover transition duration-300"
              />

              {/* Top-left Condition Certified Pill */}
              <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-600/95 px-3 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                <span>{activeCondition.photoBadge}</span>
              </span>
            </div>

            {/* 4 Thumbnail Strip */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.gallery.map((img, idx) => {
                const isSelected = idx === selectedImageIdx;
                return (
                  <button
                    key={`${img.src}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View image ${idx + 1}: ${img.alt}`}
                    className={cn(
                      'aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 transition cursor-pointer',
                      isSelected
                        ? 'border-2 border-[#0284c7] ring-2 ring-sky-500/20'
                        : 'border border-slate-200 opacity-85 hover:opacity-100 hover:border-slate-300',
                    )}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      style={{ objectPosition: img.objectPosition ?? 'center' }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Configuration & Purchase Column */}
          <div className="lg:col-span-5">
            {/* SKU & Rating Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                SKU: {product.sku}
              </span>
              <a
                href="#customer-reviews"
                className="inline-flex items-center gap-1 text-xs hover:underline"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-800">{product.rating}</span>
                <span className="text-slate-400">
                  ({product.reviewCount + (reviews.length - product.reviews.length)} reviews)
                </span>
              </a>
            </div>

            {/* Product Title */}
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
              {product.title}
            </h1>

            {/* Condition Selector */}
            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Hardware Condition
              </p>

              <div className="mt-2.5 space-y-2.5">
                {product.conditions.map((tier) => {
                  const isSelected = tier.id === selectedConditionId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedConditionId(tier.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#0284c7] bg-sky-50/40 shadow-2xs'
                          : 'border border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Custom Radio Dot */}
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition',
                            isSelected
                              ? 'border-[#0284c7] bg-[#0284c7]'
                              : 'border-slate-300 bg-white',
                          )}
                        >
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {tier.title}
                            </span>
                            {tier.badgeTag && (
                              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                {tier.badgeTag}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {tier.subtitle}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'shrink-0 text-sm font-extrabold',
                          isSelected ? 'text-[#0284c7]' : 'text-slate-900',
                        )}
                      >
                        $
                        {tier.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hardware Inspection Report */}
            <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  Hardware Inspection Report
                </h2>
              </div>

              <dl className="mt-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Battery Health:</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {activeCondition.batteryHealth}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Cosmetic Grade:</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {activeCondition.cosmeticGrade}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Thermal &amp; Stress Tested:</dt>
                  <dd className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    <span>{product.thermalStatus}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">OS Installation:</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {product.osInstallation}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Warranty Info Callout */}
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {activeCondition.warrantyTitle}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {activeCondition.warrantySubtitle}
                </p>
              </div>
            </div>

            {/* Quantity + Add to Cart + Compare Specs */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
              {/* Stepper */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-8 items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  aria-label="Increase quantity"
                  className="flex h-10 w-8 items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer',
                  addedFeedback
                    ? 'bg-emerald-600'
                    : 'bg-[#0284c7] hover:bg-[#0369a1]',
                )}
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>
                      Add to Cart - $
                      {totalPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </>
                )}
              </button>

              {/* Compare Specs Button */}
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
              >
                Compare Specs
              </button>
            </div>
          </div>
        </div>

        {/* Middle Tabbed Technical Specs & Dock Compatibility Section */}
        <section className="mt-14">
          <div className="flex flex-wrap gap-6 border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleTabClick('specs')}
              className={cn(
                'pb-3 text-xs font-semibold transition cursor-pointer border-b-2 -mb-px',
                activeTab === 'specs'
                  ? 'border-[#0284c7] text-[#0284c7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900',
              )}
            >
              Full Technical Specifications
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('compatibility')}
              className={cn(
                'pb-3 text-xs font-semibold transition cursor-pointer border-b-2 -mb-px',
                activeTab === 'compatibility'
                  ? 'border-[#0284c7] text-[#0284c7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900',
              )}
            >
              Upgrade &amp; Compatibility Checker
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('reviews')}
              className={cn(
                'pb-3 text-xs font-semibold transition cursor-pointer border-b-2 -mb-px',
                activeTab === 'reviews'
                  ? 'border-[#0284c7] text-[#0284c7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900',
              )}
            >
              Customer Reviews (
              {product.reviewCount + (reviews.length - product.reviews.length)})
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left: Specs Table (or Upgrade Guide if tab === 'compatibility') */}
            <div className="lg:col-span-7">
              {activeTab === 'compatibility' ? (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#0284c7]" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Hardware Upgradeability Matrix
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        NVMe M.2 Storage Slot
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        Upgradeable (up to 4TB PCIe Gen4)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Single M.2 2280 slot accessible via bottom service panel.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        System Memory (RAM)
                      </p>
                      <p className="mt-1 text-xs text-slate-700 font-semibold">
                        Onboard LPDDR5 (Soldered)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Factory dual-channel configuration for maximum battery efficiency.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        Wireless &amp; WWAN
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        Wi-Fi 6E + Bluetooth 5.3 Ready
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Supports optional 5G WWAN card installation via M.2 key-B slot.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        External Display Support
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        Up to 3 External Displays (4K@60Hz)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Via dual Thunderbolt 4 ports and onboard HDMI 2.0 output.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                  <dl className="divide-y divide-slate-100">
                    {product.specs.map((row, idx) => (
                      <div
                        key={row.label}
                        className={cn(
                          'grid grid-cols-1 gap-1 px-5 py-3 text-xs sm:grid-cols-12 sm:gap-4',
                          idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white',
                        )}
                      >
                        <dt className="font-medium text-slate-500 sm:col-span-4">
                          {row.label}
                        </dt>
                        <dd className="font-semibold text-slate-800 sm:col-span-8">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Right: Accessory & Dock Compatibility Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Accessory &amp; Dock Compatibility
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                      activeDock.compatible
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700',
                    )}
                  >
                    {activeDock.compatible ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    <span>{activeDock.badgeText}</span>
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Select your current docking station or accessory model to
                  verify hardware fit, power delivery, and port compatibility.
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="dock-select"
                    className="block text-[10px] font-semibold text-slate-500"
                  >
                    Select Docking Station / Hub
                  </label>
                  <select
                    id="dock-select"
                    value={selectedDockId}
                    onChange={(e) => setSelectedDockId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {product.docks.map((dock) => (
                      <option key={dock.id} value={dock.id}>
                        {dock.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status Card */}
                <div className="mt-3.5 flex items-start gap-3 rounded-lg border border-slate-200/80 bg-white p-3.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                      activeDock.compatible
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    {activeDock.compatible ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {activeDock.headline}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {activeDock.details}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Customer Reviews & Verification Section */}
        <section
          id="customer-reviews"
          className="mt-14 border-t border-slate-200/80 pt-10"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Customer Reviews &amp; Verification
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Real feedback from engineers and professionals who purchased
                certified used hardware.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <p className="text-xl font-extrabold leading-none text-slate-900">
                  {product.rating}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    / 5.0
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Based on{' '}
                  {product.reviewCount + (reviews.length - product.reviews.length)}{' '}
                  verified orders
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
              >
                Write a Review
              </button>
            </div>
          </div>

          {/* 3-Column Reviews Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200',
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {review.date}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                    {review.initials}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {review.author}
                    </p>
                    {review.verified && (
                      <p className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                Write a Verified Review
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Alex P."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Rating
                </label>
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          star <= newReviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Your Feedback
                </label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share your experience with condition, battery health, and performance..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
