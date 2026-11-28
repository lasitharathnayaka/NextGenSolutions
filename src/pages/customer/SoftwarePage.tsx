import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Zap,
  Headphones,
  ChevronRight,
  LayoutGrid,
  List,
  Monitor,
  FileText,
  ShieldCheck,
  Palette,
  Code2,
  Check,
  ShoppingCart,
  HelpCircle,
  MessageSquare,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeSoftwareProducts,
  type DbSoftwareProduct,
} from '@/services/softwareService';
import { cn } from '@/lib/utils';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';
type ViewMode = 'grid' | 'list';
type SoftwareCategory = 'All' | 'OS' | 'Productivity' | 'Security' | 'Creative & Dev';

interface SoftwareLicense {
  id: string;
  sku?: string;
  name: string;
  vendor: string;
  category: Exclude<SoftwareCategory, 'All'>;
  platform: string;
  description: string;
  features: string[];
  priceLabel: 'Retail Price' | 'Annual Price';
  price: number;
  icon: 'monitor' | 'office' | 'shield' | 'palette' | 'code';
  accentBg: string;
  accentText: string;
  isWideFeatured?: boolean;
  popularTag?: string;
}

const SOFTWARE_LICENSES: SoftwareLicense[] = [
  {
    id: 'windows-11-pro',
    name: 'Windows 11 Pro',
    vendor: 'Microsoft · Lifetime Retail',
    category: 'OS',
    platform: 'Windows Platform',
    description:
      'Lifetime 1-PC Retail Key with full Microsoft updates and direct activation.',
    features: [
      'BitLocker Device Encryption',
      'Remote Desktop & Hyper-V',
      'Lifetime Activation Guarantee',
    ],
    priceLabel: 'Retail Price',
    price: 14500,
    icon: 'monitor',
    accentBg: 'bg-sky-50 border border-sky-100',
    accentText: 'text-sky-600',
    popularTag: 'Best Seller',
  },
  {
    id: 'microsoft-office-2024-pro',
    name: 'Microsoft Office 2024 Pro Plus',
    vendor: 'Microsoft · Lifetime Suite',
    category: 'Productivity',
    platform: 'Win / Mac',
    description:
      'Lifetime 1-PC Retail Key including Word, Excel, PowerPoint, and Outlook.',
    features: [
      'Advanced Data Analysis tools',
      'Commercial & Personal Use',
      'Offline Desktop Apps',
    ],
    priceLabel: 'Retail Price',
    price: 18500,
    icon: 'office',
    accentBg: 'bg-orange-50 border border-orange-100',
    accentText: 'text-orange-600',
  },
  {
    id: 'kaspersky-total-security',
    name: 'Kaspersky Total Security',
    vendor: 'Kaspersky · 5-Device Shield',
    category: 'Security',
    platform: 'Multi-Platform',
    description:
      '1-Year Subscription for up to 5 Devices with premium cyber defense.',
    features: [
      'Real-time Anti-Malware',
      'Secure VPN & Password Manager',
      'Safe Money Banking Protection',
    ],
    priceLabel: 'Annual Price',
    price: 9500,
    icon: 'shield',
    accentBg: 'bg-emerald-50 border border-emerald-100',
    accentText: 'text-emerald-600',
  },
  {
    id: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud Suite',
    vendor: 'Adobe · All Apps Pass',
    category: 'Creative & Dev',
    platform: 'Win / macOS',
    description:
      '1-Year Full Access Pass to 20+ creative applications including Photoshop & Premiere.',
    features: [
      '100GB Cloud Storage Included',
      'Adobe Fonts & Stock Integration',
      'Priority feature updates',
    ],
    priceLabel: 'Annual Price',
    price: 179000,
    icon: 'palette',
    accentBg: 'bg-rose-50 border border-rose-100',
    accentText: 'text-rose-600',
  },
  {
    id: 'visual-studio-2022-enterprise',
    name: 'Visual Studio 2022 Enterprise',
    vendor: 'Microsoft · Enterprise DevOps',
    category: 'Creative & Dev',
    platform: 'Windows Enterprise',
    description:
      'Lifetime Subscription & Developer Tools for scalable enterprise engineering teams.',
    features: [
      'Advanced debugging tools',
      'Enterprise testing suites',
      'Azure DevOps integration',
    ],
    priceLabel: 'Retail Price',
    price: 295000,
    icon: 'code',
    accentBg: 'bg-indigo-50 border border-indigo-100',
    accentText: 'text-indigo-600',
    isWideFeatured: true,
    popularTag: 'Enterprise Pick',
  },
];

const CATEGORIES: SoftwareCategory[] = [
  'All',
  'OS',
  'Productivity',
  'Security',
  'Creative & Dev',
];

function LicenseIcon({ type }: { type: SoftwareLicense['icon'] }) {
  switch (type) {
    case 'monitor':
      return <Monitor className="h-5 w-5" />;
    case 'office':
      return <FileText className="h-5 w-5" />;
    case 'shield':
      return <ShieldCheck className="h-5 w-5" />;
    case 'palette':
      return <Palette className="h-5 w-5" />;
    case 'code':
      return <Code2 className="h-5 w-5" />;
  }
}

export function SoftwarePage() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<SoftwareCategory>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const [liveDbSoftware, setLiveDbSoftware] = useState<DbSoftwareProduct[]>([]);

  useEffect(() => {
    const unsub = subscribeSoftwareProducts((rows) => {
      setLiveDbSoftware(rows);
    });
    return unsub;
  }, []);

  const allLicenses = useMemo<SoftwareLicense[]>(() => {
    const mappedLive: SoftwareLicense[] = liveDbSoftware.map((dbItem) => ({
      id: dbItem.id,
      sku: dbItem.batch_code || dbItem.id,
      vendor: (dbItem.vendor || 'NEXTGEN · DIGITAL LICENSE').toUpperCase(),
      name: dbItem.name,
      category:
        dbItem.category === 'OS' ||
        dbItem.category === 'Productivity' ||
        dbItem.category === 'Security' ||
        dbItem.category === 'Creative & Dev'
          ? dbItem.category
          : 'OS',
      platform: dbItem.platform || 'Multi-Platform',
      description:
        dbItem.description ||
        `Verified digital retail license for ${dbItem.name}.`,
      features:
        dbItem.features && dbItem.features.length > 0
          ? dbItem.features
          : ['Instant Key Delivery', 'Official Updates', '24/7 Support'],
      priceLabel:
        dbItem.price_label === 'Annual Price' ? 'Annual Price' : 'Retail Price',
      price: Number(dbItem.price) || 0,
      icon:
        dbItem.icon === 'office' ||
        dbItem.icon === 'shield' ||
        dbItem.icon === 'palette' ||
        dbItem.icon === 'code'
          ? dbItem.icon
          : 'monitor',
      accentBg: 'bg-sky-50 border border-sky-100',
      accentText: 'text-[#0284c7]',
      isWideFeatured: false,
    }));

    const existingSkus = new Set(
      mappedLive.map((s) => (s.sku || '').toLowerCase()),
    );
    const existingNames = new Set(mappedLive.map((s) => s.name.toLowerCase()));
    const fallback = SOFTWARE_LICENSES.filter(
      (s) =>
        !(s.sku && existingSkus.has(s.sku.toLowerCase())) &&
        !existingNames.has(s.name.toLowerCase()),
    );

    return [...mappedLive, ...fallback];
  }, [liveDbSoftware]);

  // Engineer Chat modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'engineer',
      text: 'Hello! I am a certified NextGenSolution activation engineer. Share your Hardware ID or license SKU and I will assist you right away.',
    },
  ]);

  const filteredAndSortedLicenses = useMemo(() => {
    const filtered = allLicenses.filter((item) =>
      selectedCategory === 'All' ? true : item.category === selectedCategory,
    );

    const list = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        break;
    }
    return list;
  }, [allLicenses, selectedCategory, sortBy]);

  const handleBuyLicense = (license: SoftwareLicense) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: '/software',
          notice: 'Please sign in to purchase software licenses.',
        },
      });
      return;
    }
    const swSkuMap: Record<string, string> = {
      'windows-11-pro': 'NGS-SW-001',
      'microsoft-office-2024-pro': 'NGS-SW-002',
      'kaspersky-total-security': 'NGS-SW-003',
      'adobe-creative-cloud': 'NGS-SW-004',
      'visual-studio-2022-enterprise': 'NGS-SW-005',
    };
    addToCart({
      id: license.id,
      sku: swSkuMap[license.id] || `NGS-SW-${license.id.slice(0, 4).toUpperCase()}`,
      name: license.name,
      price: license.price,
      image: '/images/cybercraft-studio.jpg',
    });
    setRecentlyAdded((prev) => ({ ...prev, [license.id]: true }));
    window.setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [license.id]: false }));
    }, 1200);
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: trimmed },
      {
        sender: 'engineer',
        text: 'Thanks! Your activation request has been prioritized. A live technician will reply here in under 2 minutes.',
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Modern Dark-Navy Software Hero Banner */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 py-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl"
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
            <span className="font-semibold text-sky-400">
              Software &amp; Digital Licenses
            </span>
          </nav>

          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3 w-3" />
                <span>Instant Vault Key Delivery</span>
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Software &amp; Digital Licenses
              </h1>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
                100% genuine, OEM &amp; retail-verified enterprise licenses
                delivered directly to your encrypted License Vault with 24/7
                activation engineering support.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
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

          {/* Trust Pills Strip */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800/80 pt-4 text-[11px] font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Genuine Verified Enterprise Licenses</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-400" />
              <span>Instant Email &amp; Dashboard Key Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-3.5 w-3.5 text-sky-400" />
              <span>24/7 Technical Activation Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-2xs sm:flex-row sm:items-center">
          <p className="text-xs font-bold text-slate-900">
            Showing {filteredAndSortedLicenses.length} authentic software license
            {filteredAndSortedLicenses.length !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <select
              aria-label="Sort software licenses"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Sort by: Price Low to High</option>
              <option value="price-desc">Sort by: Price High to Low</option>
              <option value="name">Sort by: Name A to Z</option>
            </select>

            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
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
          </div>
        </div>

        {/* Full-Width License Catalog */}
        <div className="mt-6">
          <div
            className={cn(
              'grid gap-5',
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1',
            )}
          >
              {filteredAndSortedLicenses.map((license) => {
                const isAdded = Boolean(recentlyAdded[license.id]);
                const renderWide =
                  viewMode === 'list' ||
                  (viewMode === 'grid' &&
                    sortBy === 'featured' &&
                    selectedCategory === 'All' &&
                    license.isWideFeatured);

                if (renderWide) {
                  return (
                    <article
                      key={license.id}
                      className={cn(
                        'group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:-translate-y-0.5 hover:border-sky-300/80 hover:shadow-xl hover:shadow-slate-200/60 transition duration-300',
                        viewMode === 'grid' && 'md:col-span-2 lg:col-span-3',
                      )}
                    >
                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-xl',
                                  license.accentBg,
                                  license.accentText,
                                )}
                              >
                                <LicenseIcon type={license.icon} />
                              </span>
                              <div>
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-600">
                                  {license.vendor}
                                </span>
                                <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                                  {license.name}
                                </h2>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <Zap className="h-3 w-3" />
                                <span>Instant Key</span>
                              </span>
                              <p className="mt-1 text-[10px] font-medium text-slate-400">
                                {license.platform}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            {license.description}
                          </p>

                          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-medium text-slate-600">
                            {license.features.map((feat) => (
                              <li key={feat} className="inline-flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="hidden md:block w-px self-stretch bg-slate-100" />

                        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4 md:min-w-[175px] md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                          <div className="md:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {license.priceLabel}
                            </p>
                            <p className="text-xl font-extrabold text-slate-900">
                              Rs.{' '}
                              {license.price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleBuyLicense(license)}
                            className={cn(
                              'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer md:w-full',
                              isAdded
                                ? 'bg-emerald-600'
                                : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7]',
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
                                <span>Buy License</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={license.id}
                    className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:-translate-y-1 hover:border-sky-300/80 hover:shadow-xl hover:shadow-slate-200/60 transition duration-300"
                  >
                    {/* Top Icon & Platform Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl',
                          license.accentBg,
                          license.accentText,
                        )}
                      >
                        <LicenseIcon type={license.icon} />
                      </span>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Zap className="h-3 w-3" />
                          <span>Instant Key</span>
                        </span>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          {license.platform}
                        </p>
                      </div>
                    </div>

                    {/* Vendor Eyebrow + Title */}
                    <span className="mt-4 text-[10px] font-bold uppercase tracking-wider text-sky-600">
                      {license.vendor}
                    </span>
                    <h2 className="mt-0.5 text-[15px] font-bold text-slate-900">
                      {license.name}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {license.description}
                    </p>

                    {/* Features List */}
                    <ul className="mt-4 space-y-2 text-[11px] font-medium text-slate-600">
                      {license.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer Price & CTA */}
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4 mt-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {license.priceLabel}
                        </p>
                        <p className="text-lg font-extrabold text-slate-900">
                          Rs.{' '}
                          {license.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyLicense(license)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer',
                          isAdded
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7]',
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
                            <span>Buy License</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>

          {/* Activation Assistance Banner */}
          <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Need Activation Assistance?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Our specialized engineers are available around the clock to
                  assist with phone or digital token activations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-800 hover:border-sky-300 hover:bg-sky-50 hover:text-[#0284c7] transition cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Start Engineer Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Engineer Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0d1726] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold">
                  24/7 Activation Engineer Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed',
                    msg.sender === 'engineer'
                      ? 'bg-white border border-slate-200 text-slate-700'
                      : 'ml-auto bg-[#0284c7] text-white',
                  )}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Enter your license SKU or activation question..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0284c7] text-white hover:bg-[#0369a1] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
