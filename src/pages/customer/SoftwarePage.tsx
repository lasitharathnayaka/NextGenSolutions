import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
  Lock,
  Eye,
  EyeOff,
  Download,
  HelpCircle,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';
type ViewMode = 'grid' | 'list';

interface SoftwareLicense {
  id: string;
  name: string;
  platform: string;
  description: string;
  features: string[];
  priceLabel: 'Retail Price' | 'Annual Price';
  price: number;
  icon: 'monitor' | 'office' | 'shield' | 'palette' | 'code';
  accentBg: string;
  accentText: string;
  isWideFeatured?: boolean;
}

const SOFTWARE_LICENSES: SoftwareLicense[] = [
  {
    id: 'windows-11-pro',
    name: 'Windows 11 Pro',
    platform: 'Windows Platform',
    description:
      'Lifetime 1-PC Retail Key with full Microsoft updates and direct activation.',
    features: [
      'BitLocker Device Encryption',
      'Remote Desktop & Hyper-V',
      'Lifetime Activation Guarantee',
    ],
    priceLabel: 'Retail Price',
    price: 199,
    icon: 'monitor',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-600',
  },
  {
    id: 'microsoft-office-2024-pro',
    name: 'Microsoft Office 2024 Pro Plus',
    platform: 'Win / Mac',
    description:
      'Lifetime 1-PC Retail Key including Word, Excel, PowerPoint, and Outlook.',
    features: [
      'Advanced Data Analysis tools',
      'Commercial & Personal Use',
      'Offline Desktop Apps',
    ],
    priceLabel: 'Retail Price',
    price: 249,
    icon: 'office',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-600',
  },
  {
    id: 'kaspersky-total-security',
    name: 'Kaspersky Total Security',
    platform: 'Multi-Platform',
    description:
      '1-Year Subscription for up to 5 Devices with premium cyber defense.',
    features: [
      'Real-time Anti-Malware',
      'Secure VPN & Password Manager',
      'Safe Money Banking Protection',
    ],
    priceLabel: 'Annual Price',
    price: 79.99,
    icon: 'shield',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
  },
  {
    id: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud Suite',
    platform: 'Win / macOS',
    description:
      '1-Year Full Access Pass to 20+ creative applications including Photoshop & Premiere.',
    features: [
      '100GB Cloud Storage Included',
      'Adobe Fonts & Stock Integration',
      'Priority feature updates',
    ],
    priceLabel: 'Annual Price',
    price: 599,
    icon: 'palette',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-600',
  },
  {
    id: 'visual-studio-2022-enterprise',
    name: 'Visual Studio 2022 Enterprise',
    platform: 'Windows Enterprise',
    description:
      'Lifetime Subscription & Developer Tools for scalable enterprise engineering teams.',
    features: [
      'Advanced debugging tools',
      'Enterprise testing suites',
      'Azure DevOps integration',
    ],
    priceLabel: 'Retail Price',
    price: 2999,
    icon: 'code',
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-600',
    isWideFeatured: true,
  },
];

const MASKED_KEY = 'XXXXX-XXXXX-XXXXX-89A2F';
const REVEALED_KEY = 'W11P8-9K4M2-7Q9X3-89A2F';

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
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});

  // Vault state
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Engineer Chat modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'engineer',
      text: 'Hello! I am a certified NextGenSolutions activation engineer. Share your Hardware ID or license SKU and I will assist you right away.',
    },
  ]);

  const sortedLicenses = useMemo(() => {
    const list = [...SOFTWARE_LICENSES];
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
  }, [sortBy]);

  const handleBuyLicense = (license: SoftwareLicense) => {
    addToCart({
      id: license.id,
      name: license.name,
      price: license.price,
      image: '/images/cybercraft-studio.jpg',
    });
    setRecentlyAdded((prev) => ({ ...prev, [license.id]: true }));
    window.setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [license.id]: false }));
    }, 1200);
  };

  const handleRevealAndCopy = async () => {
    if (!keyRevealed) {
      setKeyRevealed(true);
      try {
        await navigator.clipboard.writeText(REVEALED_KEY);
      } catch {
        // Fallback when clipboard is restricted
      }
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2000);
    } else {
      setKeyRevealed(false);
    }
  };

  const handleDownloadIso = () => {
    setDownloadStarted(true);
    window.setTimeout(() => setDownloadStarted(false), 2500);
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
        text: 'Thanks! Your activation ticket has been prioritized for Hardware ID WIN-8849-PRO. A live technician will reply here in under 2 minutes.',
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark Trust Strip Directly Below Navbar */}
      <div className="bg-[#111c2d] border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-[11px] font-medium text-slate-200 sm:px-6 lg:px-8">
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

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-14 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/catalog"
            className="text-slate-400 hover:text-slate-700 transition"
          >
            Catalog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400">Digital Software</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-[#0284c7]">Licenses</span>
        </nav>

        {/* Page Title & Controls Row */}
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Software &amp; Digital Licenses
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Showing {sortedLicenses.length} authentic enterprise &amp;
              professional software licenses ready for instant deployment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <select
              aria-label="Sort software licenses"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Sort by: Price Low to High</option>
              <option value="price-desc">Sort by: Price High to Low</option>
              <option value="name">Sort by: Name A to Z</option>
            </select>

            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn(
                  'rounded-md p-1.5 transition cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-slate-900'
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
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:text-slate-700',
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout: License Catalog (Left) + License Vault Sidebar (Right) */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: Licenses Grid / List */}
          <div className="lg:col-span-8">
            <div
              className={cn(
                'grid gap-5',
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1',
              )}
            >
              {sortedLicenses.map((license) => {
                const isAdded = Boolean(recentlyAdded[license.id]);
                const renderWide =
                  viewMode === 'list' ||
                  (viewMode === 'grid' &&
                    sortBy === 'featured' &&
                    license.isWideFeatured);

                if (renderWide) {
                  return (
                    <article
                      key={license.id}
                      className={cn(
                        'rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-md transition',
                        viewMode === 'grid' && 'md:col-span-2',
                      )}
                    >
                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                license.accentBg,
                                license.accentText,
                              )}
                            >
                              <LicenseIcon type={license.icon} />
                            </span>

                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                <Zap className="h-3 w-3" />
                                <span>Instant Key</span>
                              </span>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {license.platform}
                              </p>
                            </div>
                          </div>

                          <h2 className="mt-3.5 text-sm font-bold text-slate-900">
                            {license.name}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            {license.description}
                          </p>

                          <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-slate-600">
                            {license.features.map((feat) => (
                              <li key={feat} className="inline-flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="hidden md:block w-px self-stretch bg-slate-100" />

                        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4 md:min-w-[165px] md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                          <div className="md:text-right">
                            <p className="text-[10px] text-slate-400">
                              {license.priceLabel}
                            </p>
                            <p className="text-lg font-extrabold text-slate-900">
                              $
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
                              'inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition cursor-pointer md:w-full',
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
                    className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-md transition"
                  >
                    {/* Top Icon & Platform Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          license.accentBg,
                          license.accentText,
                        )}
                      >
                        <LicenseIcon type={license.icon} />
                      </span>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          <Zap className="h-3 w-3" />
                          <span>Instant Key</span>
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {license.platform}
                        </p>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h2 className="mt-4 text-sm font-bold text-slate-900">
                      {license.name}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {license.description}
                    </p>

                    {/* Features List */}
                    <ul className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                      {license.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer Price & CTA */}
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4 mt-5">
                      <div>
                        <p className="text-[10px] text-slate-400">
                          {license.priceLabel}
                        </p>
                        <p className="text-base font-extrabold text-slate-900">
                          $
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
                          'inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-white transition cursor-pointer',
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
                            <span>Buy License</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar: My License Vault + Activation Assistance */}
          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-20">
            {/* Dark Navy License Vault Card */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1726] p-5 text-white shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0284c7] px-2.5 py-1 text-[10px] font-bold text-white">
                  <Lock className="h-3 w-3" />
                  <span>My License Vault</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Active Instance
                </span>
              </div>

              <h2 className="mt-4 text-sm font-bold text-white">
                Windows 11 Pro - Workstation
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Your purchased license key is securely encrypted and stored in
                your profile vault.
              </p>

              {/* Product License Key Box */}
              <div className="mt-4 rounded-lg border border-slate-700/70 bg-[#142033] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Product License Key
                  </span>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Verified
                  </span>
                </div>

                <div className="mt-2.5 rounded-md border border-slate-800 bg-[#09101c] px-3 py-2.5 text-center font-mono text-xs tracking-widest text-slate-100 select-all">
                  {keyRevealed ? REVEALED_KEY : MASKED_KEY}
                </div>

                <button
                  type="button"
                  onClick={handleRevealAndCopy}
                  className={cn(
                    'mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold text-white transition cursor-pointer',
                    copiedNotice
                      ? 'bg-emerald-600'
                      : 'bg-[#0284c7] hover:bg-[#0369a1]',
                  )}
                >
                  {copiedNotice ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Key Revealed &amp; Copied</span>
                    </>
                  ) : keyRevealed ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide License Key</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Reveal &amp; Copy Key</span>
                    </>
                  )}
                </button>
              </div>

              {/* Official ISO Installer Box */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-700/70 bg-[#142033] p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-300">
                    <Download className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Official ISO Installer
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Direct Microsoft CDN (5.1 GB)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadIso}
                  className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                >
                  {downloadStarted ? 'Starting...' : 'Download'}
                </button>
              </div>

              {/* Hardware ID Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[10px]">
                <span className="font-mono text-slate-400">
                  Hardware ID: WIN-8849-PRO
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ready to Activate</span>
                </span>
              </div>
            </div>

            {/* Activation Assistance Card */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0284c7]" />
                <h3 className="text-xs font-bold text-slate-900">
                  Need Activation Assistance?
                </h3>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Our specialized engineers are available around the clock to
                assist with phone or digital token activations.
              </p>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Start Engineer Chat</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Engineer Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
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
                    'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
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
