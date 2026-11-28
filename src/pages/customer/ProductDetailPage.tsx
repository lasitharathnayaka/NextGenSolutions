import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
  Truck,
  RefreshCw,
  Sparkles,
  ImagePlus,
} from 'lucide-react';
import {
  getProductDetailById,
  type ProductReview,
} from '@/data/productDetails';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeProducts,
  uploadProductImage,
  type DbProduct,
} from '@/services/productsService';
import {
  createProductReview,
  subscribeProductReviews,
} from '@/services/reviewsService';
import { cn } from '@/lib/utils';

type DetailTab = 'specs' | 'compatibility' | 'reviews';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const product = getProductDetailById(id);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedConditionId, setSelectedConditionId] = useState(
    product.defaultConditionId,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>('specs');
  const [selectedDockId, setSelectedDockId] = useState(product.docks[0].id);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [liveProducts, setLiveProducts] = useState<DbProduct[]>([]);

  useEffect(() => {
    const unsub = subscribeProducts((rows) => setLiveProducts(rows));
    return () => unsub();
  }, []);

  const matchedDbProduct = liveProducts.find(
    (p) =>
      p.slug === product.id ||
      p.id === product.id ||
      p.sku.toLowerCase() === product.sku.toLowerCase(),
  );
  const isInStock = matchedDbProduct ? Number(matchedDbProduct.stock) > 0 : true;

  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewImage, setNewReviewImage] = useState<string | null>(null);
  const [uploadingReviewImage, setUploadingReviewImage] = useState(false);
  const [reviewImageError, setReviewImageError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedConditionId(product.defaultConditionId);
    setQuantity(1);
    setActiveTab('specs');
    setSelectedDockId(product.docks[0].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const unsubReviews = subscribeProductReviews(product.id, (liveRows) => {
      const mapped: ProductReview[] = liveRows.map((r) => ({
        id: r.id,
        initials: r.initials,
        author: r.author,
        date: r.date_label || 'Recently',
        rating: r.rating,
        comment: r.comment,
        verified: r.verified,
        ...(r.image_url ? { imageUrl: r.image_url } : {}),
      }));
      const liveIds = new Set(mapped.map((r) => r.id));
      setReviews([
        ...mapped,
        ...product.reviews.filter((r) => !liveIds.has(r.id)),
      ]);
    });

    return () => unsubReviews();
  }, [product.id]);

  const activeCondition =
    product.conditions.find((c) => c.id === selectedConditionId) ??
    product.conditions[1];

  const activeDock =
    product.docks.find((d) => d.id === selectedDockId) ?? product.docks[0];

  const totalPrice = activeCondition.price * quantity;

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: `/product/${product.id}`,
          notice: 'Please sign in to add items to your cart.',
        },
      });
      return;
    }
    for (let i = 0; i < quantity; i += 1) {
      addToCart({
        id: `${product.id}-${activeCondition.id}`,
        sku: product.sku,
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

  const handleReviewPhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setReviewImageError('Please choose a valid image file (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReviewImageError('Image must be smaller than 5 MB.');
      return;
    }
    setReviewImageError(null);
    setUploadingReviewImage(true);
    try {
      const uploadedUrl = await uploadProductImage(file);
      if (uploadedUrl) {
        setNewReviewImage(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setNewReviewImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      setReviewImageError('Could not upload photo. Please try another image.');
    } finally {
      setUploadingReviewImage(false);
    }
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    const parts = newReviewName.trim().split(/\s+/);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');

    const reviewId = `rev-${Date.now()}`;
    const commentText = `"${newReviewComment.trim()}"`;
    const created: ProductReview = {
      id: reviewId,
      initials: initials || 'NG',
      author: newReviewName.trim(),
      date: 'Just now',
      rating: newReviewRating,
      comment: commentText,
      verified: true,
      ...(newReviewImage ? { imageUrl: newReviewImage } : {}),
    };

    setReviews((prev) => [created, ...prev]);

    await createProductReview({
      id: reviewId,
      product_id: product.id,
      product_name: product.breadcrumbName,
      product_sku: product.sku,
      user_id: user?.uid ?? null,
      author: created.author,
      initials: created.initials,
      rating: created.rating,
      comment: created.comment,
      image_url: newReviewImage ?? null,
      date_label: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      verified: true,
    });

    setNewReviewName('');
    setNewReviewComment('');
    setNewReviewRating(5);
    setNewReviewImage(null);
    setReviewImageError(null);
    setReviewModalOpen(false);
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark-Navy Breadcrumb & Assurance Strip */}
      <div className="bg-[#0a1220] border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5"
          >
            <Link to="/" className="text-slate-400 hover:text-sky-400 transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <Link
              to="/catalog"
              className="text-slate-400 hover:text-sky-400 transition"
            >
              Catalog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <Link
              to="/catalog"
              className="text-slate-400 hover:text-sky-400 transition"
            >
              {product.categoryLabel}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-semibold text-sky-400">
              {product.breadcrumbName}
            </span>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>40-Point Bench Tested</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-sky-400" />
              <span>Free Express Shipping &gt; Rs. 150,000</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        {/* Top 2-Column Product Showcase */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Gallery + Highlights */}
          <div className="lg:col-span-7 space-y-4">
            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <img
                src={product.gallery[selectedImageIdx]?.src}
                alt={product.gallery[selectedImageIdx]?.alt}
                style={{
                  objectPosition:
                    product.gallery[selectedImageIdx]?.objectPosition ?? 'center',
                }}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />

              {/* Top-left Condition Certified Pill */}
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 px-3.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                <span>{activeCondition.photoBadge}</span>
              </span>

              {/* Bottom-right Verified Lab Pill */}
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#0d1726]/85 px-3 py-1 text-[10px] font-semibold text-slate-200 shadow-md backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-sky-400" />
                <span>Inspected &amp; Ready to Ship</span>
              </span>
            </div>

            {/* 4 Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3">
              {product.gallery.map((img, idx) => {
                const isSelected = idx === selectedImageIdx;
                return (
                  <button
                    key={`${img.src}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View image ${idx + 1}: ${img.alt}`}
                    className={cn(
                      'aspect-[4/3] overflow-hidden rounded-xl bg-white transition cursor-pointer',
                      isSelected
                        ? 'border-2 border-[#0284c7] ring-4 ring-sky-500/15 shadow-xs'
                        : 'border border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300',
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

            {/* 3-Card Trust Highlights */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">
                    24h Dispatch
                  </p>
                  <p className="text-[10px] text-slate-500">Insured courier</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">
                    Verified Diagnostics
                  </p>
                  <p className="text-[10px] text-slate-500">40-point tested</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">
                    30-Day Returns
                  </p>
                  <p className="text-[10px] text-slate-500">Money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Configuration & Purchase Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              {/* SKU & Rating Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Product ID: {product.sku}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
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
                <a
                  href="#customer-reviews"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs hover:bg-amber-100/70 transition"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">
                    {product.rating}
                  </span>
                  <span className="text-slate-500">
                    (
                    {product.reviewCount +
                      (reviews.length - product.reviews.length)}{' '}
                    reviews)
                  </span>
                </a>
              </div>

              {/* Product Title */}
              <h1 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl">
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
                            ? 'border-2 border-[#0284c7] bg-sky-50/50 shadow-2xs'
                            : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                        )}
                      >
                        <div className="flex items-start gap-3">
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
                                <span className="rounded-full bg-[#0284c7]/10 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
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
                          Rs.{' '}
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
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/60">
                <div className="flex items-center justify-between border-b border-slate-200/70 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-xs font-bold text-slate-900">
                      Hardware Inspection Report
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verified
                  </span>
                </div>

                <dl className="space-y-2 p-4 text-[11px]">
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
                    <dd className="inline-flex items-center gap-1 font-bold text-emerald-600">
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
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-sky-200/70 bg-sky-50/60 px-4 py-3">
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
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition cursor-pointer"
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
                    className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!isInStock}
                  onClick={handleAddToCart}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-sm transition',
                    !isInStock
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : addedFeedback
                        ? 'bg-emerald-600 text-white cursor-pointer'
                        : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] cursor-pointer',
                  )}
                >
                  {!isInStock ? (
                    <span>Currently Out of Stock</span>
                  ) : addedFeedback ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        Add to Cart — Rs.{' '}
                        {totalPrice.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
                >
                  Compare Specs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Tabbed Technical Specs & Dock Compatibility Section */}
        <section className="mt-14">
          <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabClick('specs')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
                activeTab === 'specs'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              Full Technical Specifications
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('compatibility')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
                activeTab === 'compatibility'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              Upgrade &amp; Compatibility Checker
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('reviews')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer',
                activeTab === 'reviews'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              Customer Reviews (
              {product.reviewCount + (reviews.length - product.reviews.length)})
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left: Specs Table or Upgrade Guide */}
            <div className="lg:col-span-7">
              {activeTab === 'compatibility' ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
                      <Cpu className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Hardware Upgradeability Matrix
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-900">
                        NVMe M.2 Storage Slot
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        Upgradeable (up to 4TB PCIe Gen4)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Single M.2 2280 slot accessible via bottom service panel.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-900">
                        System Memory (RAM)
                      </p>
                      <p className="mt-1 text-xs text-slate-700 font-semibold">
                        Onboard LPDDR5 (Soldered)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Factory dual-channel configuration for maximum battery
                        efficiency.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-900">
                        Wireless &amp; WWAN
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        Wi-Fi 6E + Bluetooth 5.3 Ready
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Supports optional 5G WWAN card installation via M.2
                        key-B slot.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-900">
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
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                  <dl className="divide-y divide-slate-100">
                    {product.specs.map((row, idx) => (
                      <div
                        key={row.label}
                        className={cn(
                          'grid grid-cols-1 gap-1 px-5 py-3.5 text-xs sm:grid-cols-12 sm:gap-4',
                          idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white',
                        )}
                      >
                        <dt className="font-semibold text-slate-500 sm:col-span-4">
                          {row.label}
                        </dt>
                        <dd className="font-bold text-slate-800 sm:col-span-8">
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
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Accessory &amp; Dock Compatibility
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
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
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    Select Docking Station / Hub
                  </label>
                  <select
                    id="dock-select"
                    value={selectedDockId}
                    onChange={(e) => setSelectedDockId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {product.docks.map((dock) => (
                      <option key={dock.id} value={dock.id}>
                        {dock.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status Card */}
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      activeDock.compatible
                        ? 'bg-emerald-100/70 text-emerald-600'
                        : 'bg-amber-100/70 text-amber-600',
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
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
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
                  {product.reviewCount +
                    (reviews.length - product.reviews.length)}{' '}
                  verified orders
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-sky-300 hover:text-[#0284c7] transition cursor-pointer"
              >
                Write a Review
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
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

                  {review.imageUrl && (
                    <a
                      href={review.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50"
                    >
                      <img
                        src={review.imageUrl}
                        alt={`Customer photo by ${review.author}`}
                        className="h-36 w-full object-cover hover:scale-[1.02] transition"
                      />
                    </a>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-[11px] font-bold text-[#0284c7]">
                    {review.initials}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {review.author}
                    </p>
                    {review.verified && (
                      <p className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
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
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
                  placeholder="e.g. Kasun P."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Optional Single Photo Upload (Max 1 image) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Add Photo (Optional)
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">
                    Max 1 image
                  </span>
                </div>

                {newReviewImage ? (
                  <div className="relative mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={newReviewImage}
                      alt="Selected review photo"
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewReviewImage(null)}
                      aria-label="Remove review photo"
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-600 transition cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-center hover:border-[#0284c7] hover:bg-sky-50/40 transition">
                    <ImagePlus className="h-5 w-5 text-[#0284c7]" />
                    <span className="text-[11px] font-semibold text-slate-700">
                      {uploadingReviewImage
                        ? 'Uploading photo...'
                        : 'Click to import 1 photo'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, or WebP (up to 5 MB)
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={uploadingReviewImage}
                      onChange={handleReviewPhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {reviewImageError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {reviewImageError}
                  </p>
                )}
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
                  disabled={uploadingReviewImage}
                  className="rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] disabled:opacity-60 cursor-pointer"
                >
                  {uploadingReviewImage ? 'Uploading...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
