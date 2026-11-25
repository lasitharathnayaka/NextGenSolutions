import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  ShoppingBag,
  KeyRound,
  Wrench,
  MapPin,
  Headphones,
  Settings,
  CreditCard,
  Check,
  Copy,
  Download,
  Laptop,
  Cpu,
  UserCog,
  CheckCircle2,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountTab =
  | 'overview'
  | 'orders'
  | 'keys'
  | 'repairs'
  | 'addresses'
  | 'tickets'
  | 'preferences';

interface SoftwareKeyRow {
  id: string;
  name: string;
  orderDate: string;
  maskedKey: string;
  fullKey: string;
  status: string;
}

const SOFTWARE_KEYS: SoftwareKeyRow[] = [
  {
    id: 'win-11-pro',
    name: 'Windows 11 Pro (Workstation Edition)',
    orderDate: 'Sep 14, 2024',
    maskedKey: 'XXXXX-XXXXX-8921A',
    fullKey: 'W11P8-9K4M2-7Q9X3-8921A',
    status: 'Active',
  },
  {
    id: 'office-2024',
    name: 'Microsoft Office 2024 Pro Plus',
    orderDate: 'Aug 22, 2024',
    maskedKey: 'XXXXX-XXXXX-4419B',
    fullKey: 'OFF24-7N2V9-5P8C1-4419B',
    status: 'Active',
  },
  {
    id: 'kaspersky-total',
    name: 'Kaspersky Total Security (3-Device)',
    orderDate: 'Jul 10, 2024',
    maskedKey: 'XXXXX-XXXXX-9912X',
    fullKey: 'KASP3-4M8Q2-1R6T5-9912X',
    status: 'Active',
  },
];

const HARDWARE_ORDERS = [
  {
    id: 'NGS-8842',
    badge: 'Used - Grade A',
    badgeTone: 'amber' as const,
    product: 'Dell XPS 15 Creator Edition (32GB RAM, 1TB NVMe)',
    statusLabel: 'Shipped - Tracking via FedEx',
    statusTone: 'sky' as const,
    deliveryText: 'Est. Delivery: Tomorrow, 2:00 PM',
    icon: 'laptop' as const,
  },
  {
    id: 'NGS-8710',
    badge: 'Brand New',
    badgeTone: 'emerald' as const,
    product: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    statusLabel: 'Delivered',
    statusTone: 'emerald' as const,
    deliveryText: 'Delivered on Oct 02',
    icon: 'component' as const,
  },
];

const REPAIR_STEPS = [
  {
    number: 1,
    title: 'Received',
    subtitle: 'Oct 12, 09:30 AM',
    state: 'completed' as const,
  },
  {
    number: 2,
    title: 'Diagnosing',
    subtitle: 'Oct 12, 02:15 PM',
    state: 'completed' as const,
  },
  {
    number: 3,
    title: 'In Repair',
    subtitle: 'Active Stress Test',
    state: 'active' as const,
  },
  {
    number: 4,
    title: 'Ready for Pickup',
    subtitle: 'Pending completion',
    state: 'pending' as const,
  },
];

export function AccountDashboardPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('repairs');
  const [estimateApproved, setEstimateApproved] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [downloadedOrderId, setDownloadedOrderId] = useState<string | null>(null);

  const handleCopyKey = async (row: SoftwareKeyRow) => {
    try {
      await navigator.clipboard.writeText(row.fullKey);
    } catch {
      // Clipboard fallback
    }
    setCopiedKeyId(row.id);
    window.setTimeout(() => setCopiedKeyId(null), 1800);
  };

  const handleDownloadInvoice = (orderId: string) => {
    setDownloadedOrderId(orderId);
    window.setTimeout(() => setDownloadedOrderId(null), 1800);
  };

  const showUnifiedDashboard =
    activeTab === 'repairs' || activeTab === 'overview';

  const accountMenuItems: {
    id: AccountTab;
    label: string;
    icon: typeof LayoutGrid;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    {
      id: 'orders',
      label: 'Hardware Orders',
      icon: ShoppingBag,
      badge: HARDWARE_ORDERS.length,
    },
    {
      id: 'keys',
      label: 'My Software Keys',
      icon: KeyRound,
      badge: SOFTWARE_KEYS.length,
    },
    { id: 'repairs', label: 'Active Repairs', icon: Wrench, badge: 1 },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  ];

  const supportMenuItems: {
    id: AccountTab;
    label: string;
    icon: typeof Headphones;
  }[] = [
    { id: 'tickets', label: 'Support Tickets', icon: Headphones },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <div className="bg-[#f8fafc]">
      {/* Modern Dark-Navy Account Header Banner */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 py-7 sm:py-9">
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

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          {/* Left Profile Identity */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] text-lg font-extrabold text-white shadow-lg shadow-sky-500/20">
              AM
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Customer Account Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Enterprise Account</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Welcome back, <span className="font-semibold text-slate-200">Alex Miller</span> — Enterprise ID{' '}
                <span className="font-mono text-sky-400">#NGS-77210</span>
              </p>
            </div>
          </div>

          {/* Right Quick Summary & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#111c30]/90 px-4 py-2.5 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Active Repairs</p>
                <p className="font-extrabold text-white">1 Ticket</p>
              </div>
              <span className="h-6 w-px bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400">Software Keys</p>
                <p className="font-extrabold text-sky-400">
                  {SOFTWARE_KEYS.length} Active
                </p>
              </div>
              <span className="h-6 w-px bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400">Orders</p>
                <p className="font-extrabold text-white">
                  {HARDWARE_ORDERS.length} Units
                </p>
              </div>
            </div>

            <Link
              to="/book-repair"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] transition"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Book New Repair</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Account Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <div className="bg-[#0d1726] px-4 py-3 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Account Portal
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-200">
                  Manage Hardware &amp; Repairs
                </p>
              </div>

              <div className="p-3">
                <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account Menu
                </p>
                <nav className="space-y-1">
                  {accountMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition cursor-pointer',
                          isActive
                            ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] font-semibold text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-white' : 'text-slate-400',
                            )}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold',
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="my-3 border-t border-slate-100" />

                <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Support &amp; System
                </p>
                <nav className="space-y-1">
                  {supportMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition cursor-pointer',
                          isActive
                            ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] font-semibold text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-white' : 'text-slate-400',
                          )}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Right Main Dashboard Content */}
          <div className="space-y-5 lg:col-span-9">
            {/* Active Repair Tracker Card */}
            {showUnifiedDashboard && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-sky-50 border border-sky-200/70 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#0284c7]">
                        Ticket #NGS-4092
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                        <Sparkles className="h-3 w-3" />
                        <span>Priority Diagnostics</span>
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-base font-bold text-slate-900">
                      Dell XPS 15 — Thermal Repaste &amp; SSD Upgrade
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEstimateApproved(true)}
                    className={cn(
                      'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer',
                      estimateApproved
                        ? 'bg-emerald-600'
                        : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7]',
                    )}
                  >
                    {estimateApproved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Estimate Approved ($45.00)</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Approve Estimate / Invoice ($45.00)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Connected 4-Step Progress Tracker */}
                <div className="relative mt-7">
                  {/* Connector Track Line (Desktop) */}
                  <div
                    aria-hidden="true"
                    className="hidden sm:block absolute left-4 right-4 top-4 h-0.5 bg-slate-100"
                  >
                    <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-[#0284c7] rounded-full" />
                  </div>

                  <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {REPAIR_STEPS.map((step) => (
                      <div key={step.number} className="flex flex-col items-start">
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shadow-xs',
                            step.state === 'completed' &&
                              'bg-emerald-500 text-white',
                            step.state === 'active' &&
                              'bg-[#0284c7] text-white ring-4 ring-sky-100',
                            step.state === 'pending' &&
                              'border border-slate-200 bg-white text-slate-400',
                          )}
                        >
                          {step.state === 'completed' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            step.number
                          )}
                        </span>
                        <p
                          className={cn(
                            'mt-3 text-xs font-bold',
                            step.state === 'active'
                              ? 'text-[#0284c7]'
                              : step.state === 'pending'
                                ? 'text-slate-400'
                                : 'text-slate-900',
                          )}
                        >
                          {step.title}
                        </p>
                        <p
                          className={cn(
                            'mt-0.5 text-[11px]',
                            step.state === 'active'
                              ? 'font-semibold text-[#0284c7]'
                              : 'text-slate-400',
                          )}
                        >
                          {step.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician Notes Box */}
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-[#0284c7]">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Technician Notes (Lead Engineer: Marcus Vance)
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Thermal paste replacement completed successfully.
                      Currently running 24-hour stress test and SSD sector
                      verification.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Purchased Software Keys Table */}
            {(showUnifiedDashboard || activeTab === 'keys') && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Purchased Software Keys
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Click the copy icon to reveal and copy your retail key.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {SOFTWARE_KEYS.length} Active Licenses
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="rounded-l-lg px-3.5 py-2.5">
                          Software Name
                        </th>
                        <th className="px-3.5 py-2.5">Order Date</th>
                        <th className="px-3.5 py-2.5">License Key</th>
                        <th className="rounded-r-lg px-3.5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SOFTWARE_KEYS.map((row) => {
                        const isCopied = copiedKeyId === row.id;
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-3.5 font-semibold text-slate-900">
                              {row.name}
                            </td>
                            <td className="px-3.5 py-3.5 text-slate-500">
                              {row.orderDate}
                            </td>
                            <td className="px-3.5 py-3.5">
                              <div className="inline-flex items-center gap-2">
                                <code className="rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-700">
                                  {isCopied ? row.fullKey : row.maskedKey}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(row)}
                                  aria-label={`Copy key for ${row.name}`}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-sky-50 hover:text-[#0284c7] transition cursor-pointer"
                                >
                                  {isCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-3.5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>{row.status}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Recent Hardware Orders */}
            {(showUnifiedDashboard || activeTab === 'orders') && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Recent Hardware Orders
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#0284c7] hover:underline cursor-pointer"
                  >
                    View All Orders
                  </button>
                </div>

                <div className="space-y-3">
                  {HARDWARE_ORDERS.map((order) => {
                    const isDownloaded = downloadedOrderId === order.id;
                    return (
                      <div
                        key={order.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-sky-200 hover:bg-white transition sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-[#0284c7] shadow-2xs">
                            {order.icon === 'laptop' ? (
                              <Laptop className="h-5 w-5" />
                            ) : (
                              <Cpu className="h-5 w-5" />
                            )}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-xs font-bold text-slate-900">
                                Order #{order.id}
                              </p>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  order.badgeTone === 'amber'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-700',
                                )}
                              >
                                {order.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {order.product}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <span
                              className={cn(
                                'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                                order.statusTone === 'sky'
                                  ? 'bg-sky-50 text-[#0284c7]'
                                  : 'bg-emerald-50 text-emerald-700',
                              )}
                            >
                              {order.statusLabel}
                            </span>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {order.deliveryText}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-sky-300 hover:text-[#0284c7] transition cursor-pointer"
                          >
                            {isDownloaded ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5" />
                                <span>Invoice PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Saved Addresses Sub-View */}
            {activeTab === 'addresses' && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">
                    Saved Shipping &amp; Pickup Addresses
                  </h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border-2 border-[#0284c7] bg-sky-50/30 p-4">
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      Default Office
                    </span>
                    <p className="mt-2.5 text-xs font-bold text-slate-900">
                      Alex Miller — NextGen Enterprise Lab
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      420 Tech Plaza, Suite 800, Colombo 03
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Home Delivery
                    </span>
                    <p className="mt-2.5 text-xs font-bold text-slate-900">
                      Alex Miller
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      18 Park Avenue, Nawala, Rajagiriya
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Support Tickets Sub-View */}
            {activeTab === 'tickets' && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">
                  Support Tickets
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  All active technical support and warranty conversations.
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      #SUP-2041 — Thunderbolt 4 Dock Firmware Assistance
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Last reply by Engineer Marcus Vance · 4 hours ago
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Open
                  </span>
                </div>
              </section>
            )}

            {/* Preferences Sub-View */}
            {activeTab === 'preferences' && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Account Preferences
                </h2>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-xs">
                  <span>
                    <strong className="block text-slate-900">
                      Repair Status SMS &amp; Email Alerts
                    </strong>
                    <span className="text-slate-500">
                      Receive instant notifications when your repair advances
                      stages.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-[#0284c7]"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-xs">
                  <span>
                    <strong className="block text-slate-900">
                      Enterprise PDF Invoices
                    </strong>
                    <span className="text-slate-500">
                      Automatically attach VAT invoices to order confirmation
                      emails.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-[#0284c7]"
                  />
                </label>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
