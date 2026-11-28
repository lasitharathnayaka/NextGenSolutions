import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeUserOrders,
  type DbOrderRecord,
} from '@/services/ordersService';
import {
  approveRepairEstimate,
  subscribeUserRepairs,
  type DbRepairBooking,
} from '@/services/repairsService';
import {
  subscribeUserSupportTickets,
  type DbSupportTicket,
} from '@/services/supportService';
import {
  deleteUserAddress,
  saveUserAddress,
  subscribeUserAddresses,
  type SavedAddress,
} from '@/services/addressesService';
import { downloadOrderInvoicePdf } from '@/lib/invoicePdf';

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
  productId?: string;
  orderNumber: string;
  name: string;
  orderDate: string;
  maskedKey: string;
  fullKey: string;
  isDelivered: boolean;
  status: string;
}

function isSoftwareOrderItem(itemName: string, productId?: string | null) {
  if (productId && /^NGS-SW-/i.test(productId)) return true;
  return /\b(windows|office|kaspersky|adobe|visual studio|cybercraft|license|pro studio|antivirus|software)\b/i.test(
    itemName,
  );
}

function buildLicenseKey(orderNumber: string, itemIdx: number) {
  const digits = orderNumber.replace(/\D/g, '').padStart(4, '7').slice(-4);
  const seg1 = `NGS${digits.slice(0, 2)}`;
  const seg2 = `${String(itemIdx + 1).padStart(2, '0')}K9M`;
  const seg3 = `7Q${digits.slice(2, 4)}X`;
  const seg4 = `${digits}A`;
  return {
    fullKey: `${seg1}-${seg2}-${seg3}-${seg4}`,
    maskedKey: `XXXXX-XXXXX-${seg4}`,
  };
}

const REPAIR_STAGE_LIST = [
  'Received',
  'Diagnosing',
  'In Repair',
  'Ready for Pickup',
] as const;

export function AccountDashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [liveOrders, setLiveOrders] = useState<DbOrderRecord[]>([]);
  const [liveRepairs, setLiveRepairs] = useState<DbRepairBooking[]>([]);
  const [liveSupportTickets, setLiveSupportTickets] = useState<DbSupportTicket[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLiveOrders([]);
      setLiveRepairs([]);
      setLiveSupportTickets([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    const unsubOrders = subscribeUserOrders(user.uid, (rows) => {
      setLiveOrders(rows);
      setOrdersLoading(false);
    });
    const unsubRepairs = subscribeUserRepairs(user.uid, (rows) => {
      setLiveRepairs(rows);
    });
    const unsubSupport = subscribeUserSupportTickets(user.uid, (rows) => {
      setLiveSupportTickets(rows);
    });
    const unsubAddresses = subscribeUserAddresses(user.uid, (rows) => {
      setSavedAddresses(rows);
    });

    return () => {
      unsubOrders();
      unsubRepairs();
      unsubSupport();
      unsubAddresses();
    };
  }, [user?.uid]);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );
  const [addrLabel, setAddrLabel] = useState('Home Delivery');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddrLabel('Home Delivery');
    setAddrRecipient('');
    setAddrPhone('');
    setAddrStreet('');
    setAddrCity('');
    setAddrIsDefault(savedAddresses.length === 0);
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label);
    setAddrRecipient(addr.recipient_name);
    setAddrPhone(addr.phone);
    setAddrStreet(addr.street_address);
    setAddrCity(addr.city);
    setAddrIsDefault(addr.is_default);
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !addrRecipient.trim() || !addrStreet.trim()) return;
    setSavingAddress(true);
    setAddressFeedback(null);

    const payload: Omit<SavedAddress, 'created_at'> = {
      id: editingAddress?.id ?? `addr-${Date.now()}`,
      user_id: user.uid,
      label: addrLabel.trim() || 'Home Delivery',
      recipient_name: addrRecipient.trim(),
      phone: addrPhone.trim(),
      street_address: addrStreet.trim(),
      city: addrCity.trim(),
      is_default: addrIsDefault || savedAddresses.length === 0,
    };

    const nextLocal = editingAddress
      ? savedAddresses.map((a) =>
          a.id === editingAddress.id
            ? payload
            : payload.is_default
              ? { ...a, is_default: false }
              : a,
        )
      : [
          ...(payload.is_default
            ? savedAddresses.map((a) => ({ ...a, is_default: false }))
            : savedAddresses),
          payload,
        ];

    setSavedAddresses(nextLocal);
    const { error } = await saveUserAddress(payload, savedAddresses);
    setSavingAddress(false);
    setAddressModalOpen(false);
    setAddressFeedback(
      error
        ? `Saved locally. Sync warning: ${error}`
        : editingAddress
          ? 'Address updated successfully.'
          : 'New address saved successfully.',
    );
    window.setTimeout(() => setAddressFeedback(null), 3000);
  };

  const handleSetDefaultAddress = async (addr: SavedAddress) => {
    if (!user?.uid || addr.is_default) return;
    const updated: Omit<SavedAddress, 'created_at'> = {
      ...addr,
      is_default: true,
    };
    setSavedAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === addr.id })),
    );
    await saveUserAddress(updated, savedAddresses);
  };

  const handleDeleteAddress = async (addr: SavedAddress) => {
    if (!user?.uid) return;
    setSavedAddresses((prev) => prev.filter((a) => a.id !== addr.id));
    await deleteUserAddress(user.uid, addr.id, savedAddresses);
  };

  const displayName = profile?.full_name || user?.displayName || 'Customer';
  const displayEnterpriseId = profile?.enterprise_id || 'NGS-77210';
  const displayInitials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [downloadedOrderId, setDownloadedOrderId] = useState<string | null>(null);

  const handleApproveEstimate = async (repair: DbRepairBooking) => {
    if (repair.estimate_approved) return;
    await approveRepairEstimate(repair.ticket_number);
  };

  const handleCopyKey = async (row: SoftwareKeyRow) => {
    try {
      await navigator.clipboard.writeText(row.fullKey);
    } catch {
      // Clipboard fallback
    }
    setCopiedKeyId(row.id);
    window.setTimeout(() => setCopiedKeyId(null), 1800);
  };

  const handleDownloadInvoice = (order: DbOrderRecord) => {
    downloadOrderInvoicePdf(order);
    setDownloadedOrderId(order.id);
    window.setTimeout(() => setDownloadedOrderId(null), 1800);
  };

  const purchasedSoftwareKeys = useMemo<SoftwareKeyRow[]>(() => {
    const rows: SoftwareKeyRow[] = [];
    for (const order of liveOrders) {
      const orderDate = order.created_at?.toDate
        ? order.created_at.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recent Order';
      const isDelivered = order.fulfillment_status === 'Delivered';

      (order.order_items ?? []).forEach((item, idx) => {
        if (!isSoftwareOrderItem(item.item_name, item.product_id)) return;
        const { fullKey, maskedKey } = buildLicenseKey(order.order_number, idx);
        rows.push({
          id: `${order.id}-${idx}`,
          productId: item.product_id ?? undefined,
          orderNumber: order.order_number,
          name:
            item.quantity > 1
              ? `${item.item_name} × ${item.quantity}`
              : item.item_name,
          orderDate,
          maskedKey,
          fullKey,
          isDelivered,
          status: isDelivered ? 'Active' : order.fulfillment_status,
        });
      });
    }
    return rows;
  }, [liveOrders]);

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
      badge: liveOrders.length,
    },
    {
      id: 'keys',
      label: 'My Software Keys',
      icon: KeyRound,
      badge: purchasedSoftwareKeys.length,
    },
    {
      id: 'repairs',
      label: 'Active Repairs',
      icon: Wrench,
      badge: liveRepairs.length,
    },
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
              {displayInitials || 'NG'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Customer Account Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    {profile?.role === 'admin'
                      ? 'Verified Admin Account'
                      : 'Verified Enterprise Account'}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Welcome back,{' '}
                <span className="font-semibold text-slate-200">
                  {displayName}
                </span>{' '}
                — Enterprise ID{' '}
                <span className="font-mono text-sky-400">
                  #{displayEnterpriseId}
                </span>
                {!user && (
                  <>
                    {' '}
                    ·{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-sky-400 underline hover:text-sky-300"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Quick Summary & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#111c30]/90 px-4 py-2.5 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Active Repairs</p>
                <p className="font-extrabold text-white">
                  {liveRepairs.length} Ticket{liveRepairs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="h-6 w-px bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400">Software Keys</p>
                <p className="font-extrabold text-sky-400">
                  {purchasedSoftwareKeys.length} License
                  {purchasedSoftwareKeys.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="h-6 w-px bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400">Orders</p>
                <p className="font-extrabold text-white">
                  {liveOrders.length} Order{liveOrders.length !== 1 ? 's' : ''}
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
            {/* Active Repair Tracker Cards */}
            {showUnifiedDashboard && (
              <div className="space-y-4">
                {liveRepairs.length > 0 ? (
                  (activeTab === 'overview'
                    ? liveRepairs.slice(0, 1)
                    : liveRepairs
                  ).map((repair) => {
                    const normalizedStage =
                      repair.stage === 'Completed'
                        ? 'Ready for Pickup'
                        : repair.stage;
                    const currentIdx = Math.max(
                      0,
                      REPAIR_STAGE_LIST.indexOf(normalizedStage),
                    );
                    const progressWidth =
                      currentIdx === 0
                        ? 'w-0'
                        : currentIdx === 1
                          ? 'w-1/3'
                          : currentIdx === 2
                            ? 'w-2/3'
                            : 'w-full';

                    return (
                      <section
                        key={repair.id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-sky-50 border border-sky-200/70 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#0284c7]">
                                Order #{repair.ticket_number.replace(/^NGS-REP-/i, 'NGS-ORD-')}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-semibold',
                                  normalizedStage === 'Ready for Pickup'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-indigo-50 text-indigo-600',
                                )}
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>{normalizedStage}</span>
                              </span>
                            </div>
                            <h2 className="mt-2.5 text-base font-bold text-slate-900">
                              {repair.brand_model} — {repair.service_package}
                            </h2>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApproveEstimate(repair)}
                            className={cn(
                              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer',
                              repair.estimate_approved
                                ? 'bg-emerald-600'
                                : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7]',
                            )}
                          >
                            {repair.estimate_approved ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>
                                  Estimate Approved (Rs.{' '}
                                  {Number(repair.total_due).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                  })}
                                  )
                                </span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4" />
                                <span>
                                  Approve Estimate / Invoice (Rs.{' '}
                                  {Number(repair.total_due).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                  })}
                                  )
                                </span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Connected 4-Step Progress Tracker */}
                        <div className="relative mt-7">
                          <div
                            aria-hidden="true"
                            className="hidden sm:block absolute left-4 right-4 top-4 h-0.5 bg-slate-100"
                          >
                            <div
                              className={cn(
                                'h-full bg-gradient-to-r from-emerald-500 to-[#0284c7] rounded-full transition-all duration-500',
                                progressWidth,
                              )}
                            />
                          </div>

                          <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {REPAIR_STAGE_LIST.map((stageTitle, idx) => {
                              const isFinalReady =
                                normalizedStage === 'Ready for Pickup' && idx === 3;
                              const state =
                                idx < currentIdx || isFinalReady
                                  ? 'completed'
                                  : idx === currentIdx
                                    ? 'active'
                                    : 'pending';
                              return (
                                <div
                                  key={stageTitle}
                                  className="flex flex-col items-start"
                                >
                                  <span
                                    className={cn(
                                      'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shadow-xs',
                                      state === 'completed' &&
                                        'bg-emerald-500 text-white',
                                      state === 'active' &&
                                        'bg-[#0284c7] text-white ring-4 ring-sky-100',
                                      state === 'pending' &&
                                        'border border-slate-200 bg-white text-slate-400',
                                    )}
                                  >
                                    {state === 'completed' ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      idx + 1
                                    )}
                                  </span>
                                  <p
                                    className={cn(
                                      'mt-3 text-xs font-bold',
                                      state === 'active'
                                        ? 'text-[#0284c7]'
                                        : state === 'pending'
                                          ? 'text-slate-400'
                                          : 'text-slate-900',
                                    )}
                                  >
                                    {stageTitle}
                                  </p>
                                  <p
                                    className={cn(
                                      'mt-0.5 text-[11px]',
                                      state === 'active'
                                        ? 'font-semibold text-[#0284c7]'
                                        : isFinalReady
                                          ? 'font-semibold text-emerald-600'
                                          : 'text-slate-400',
                                    )}
                                  >
                                    {isFinalReady
                                      ? 'Ready for Pickup!'
                                      : state === 'completed'
                                        ? 'Completed'
                                        : state === 'active'
                                          ? 'In Progress'
                                          : 'Pending'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Technician Notes Box */}
                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-[#0284c7]">
                            <UserCog className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Technician Notes (Lead Engineer:{' '}
                              {repair.lead_engineer || 'Marcus Vance'})
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                              {repair.technician_notes ||
                                'Device received at Piliyandala Service Hub. Diagnostic check in progress.'}
                            </p>
                          </div>
                        </div>
                      </section>
                    );
                  })
                ) : (
                  <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                    <div className="py-8 text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                        <Wrench className="h-5 w-5" />
                      </span>
                      <h2 className="mt-3 text-sm font-bold text-slate-900">
                        No active repair tickets yet
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Book a hardware diagnostic, thermal repaste, or SSD/RAM
                        upgrade to track live progress here.
                      </p>
                      <Link
                        to="/book-repair"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0369a1] transition"
                      >
                        <span>Book a Repair</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </section>
                )}
              </div>
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
                      Your purchased software licenses appear here automatically.
                      Keys activate once Admin marks your order Delivered.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {purchasedSoftwareKeys.length} License
                    {purchasedSoftwareKeys.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {purchasedSoftwareKeys.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 px-4 text-center">
                    <KeyRound className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2.5 text-xs font-bold text-slate-800">
                      No purchased software keys yet
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Software licenses you order from our Software Store will
                      appear here with live activation status.
                    </p>
                    <Link
                      to="/software"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0369a1] transition"
                    >
                      <span>Browse Software Store</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
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
                        {purchasedSoftwareKeys.map((row) => {
                          const isCopied = copiedKeyId === row.id;
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="px-3.5 py-3.5">
                                <p className="font-semibold text-slate-900">
                                  {row.name}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    #{row.orderNumber}
                                  </span>
                                  {row.productId && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                      {row.productId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3.5 py-3.5 text-slate-500">
                                {row.orderDate}
                              </td>
                              <td className="px-3.5 py-3.5">
                                {row.isDelivered ? (
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
                                ) : (
                                  <span className="text-[11px] font-medium text-amber-600">
                                    Pending WhatsApp confirmation
                                  </span>
                                )}
                              </td>
                              <td className="px-3.5 py-3.5">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                                    row.isDelivered
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      row.isDelivered
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500',
                                    )}
                                  />
                                  <span>{row.status}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  {ordersLoading ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Loading your orders...
                    </p>
                  ) : liveOrders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 px-4 text-center">
                      <ShoppingBag className="mx-auto h-7 w-7 text-slate-400" />
                      <p className="mt-2.5 text-xs font-bold text-slate-800">
                        No hardware orders yet
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Orders you place from your cart will appear here with
                        live status updates from our team.
                      </p>
                      <Link
                        to="/catalog"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0369a1] transition"
                      >
                        <span>Browse Hardware Catalog</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    liveOrders.map((order) => {
                      const isDownloaded = downloadedOrderId === order.id;
                      const itemSummary =
                        order.order_items
                          ?.map((i) => `${i.item_name} × ${i.quantity}`)
                          .join(', ') || 'Hardware Order';
                      const isLaptopOrder = Boolean(
                        itemSummary
                          .toLowerCase()
                          .match(/laptop|xps|thinkpad|latitude|ultrabook|rog|book/),
                      );

                      return (
                        <div
                          key={order.id}
                          className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-sky-200 hover:bg-white transition sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-[#0284c7] shadow-2xs">
                              {isLaptopOrder ? (
                                <Laptop className="h-5 w-5" />
                              ) : (
                                <Cpu className="h-5 w-5" />
                              )}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-mono text-xs font-bold text-slate-900">
                                  Order #{order.order_number}
                                </p>
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                    order.payment_status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700',
                                  )}
                                >
                                  {order.payment_status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-slate-600">
                                {itemSummary}
                              </p>
                              <p className="mt-1 text-xs font-extrabold text-slate-900">
                                Rs.{' '}
                                {Number(order.total).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                            <div className="text-left sm:text-right">
                              <span
                                className={cn(
                                  'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                                  order.fulfillment_status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : order.fulfillment_status === 'Shipped (FedEx)'
                                      ? 'bg-sky-50 text-[#0284c7]'
                                      : order.fulfillment_status === 'Cancelled'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-amber-50 text-amber-700',
                                )}
                              >
                                {order.fulfillment_status}
                              </span>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {order.fulfillment_status === 'Delivered'
                                  ? 'Order completed & delivered'
                                  : order.fulfillment_status === 'Shipped (FedEx)'
                                    ? 'Dispatched via express courier'
                                    : 'Live status synced with admin'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(order)}
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
                    })
                  )}
                </div>
              </section>
            )}

            {/* Saved Addresses Sub-View */}
            {activeTab === 'addresses' && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Saved Shipping &amp; Pickup Addresses
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Manage your delivery and courier pickup locations across
                      Sri Lanka.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {addressFeedback && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                    {addressFeedback}
                  </div>
                )}

                {savedAddresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 px-4 text-center">
                    <MapPin className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2.5 text-xs font-bold text-slate-800">
                      No saved addresses yet
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Add your home or office address for faster WhatsApp
                      checkout and repair pickups.
                    </p>
                    <button
                      type="button"
                      onClick={openAddAddressModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0369a1] transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Your First Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={cn(
                          'flex flex-col justify-between rounded-xl p-4 transition',
                          addr.is_default
                            ? 'border-2 border-[#0284c7] bg-sky-50/30'
                            : 'border border-slate-200 bg-white',
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                                addr.is_default
                                  ? 'bg-sky-100 text-[#0284c7]'
                                  : 'bg-slate-100 text-slate-600',
                              )}
                            >
                              {addr.is_default
                                ? `Default · ${addr.label}`
                                : addr.label}
                            </span>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditAddressModal(addr)}
                                aria-label={`Edit ${addr.label}`}
                                className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-[#0284c7] transition cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr)}
                                aria-label={`Delete ${addr.label}`}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs font-bold text-slate-900">
                            {addr.recipient_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {addr.street_address}
                            {addr.city ? `, ${addr.city}` : ''}
                          </p>
                          {addr.phone && (
                            <p className="mt-1 font-mono text-[11px] text-slate-400">
                              {addr.phone}
                            </p>
                          )}
                        </div>

                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr)}
                            className="mt-3 self-start text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Support Tickets Sub-View */}
            {activeTab === 'tickets' && (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Support Tickets ({liveSupportTickets.length})
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      All active technical support and warranty conversations.
                    </p>
                  </div>
                  <Link
                    to="/support"
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0369a1] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Ticket</span>
                  </Link>
                </div>

                {liveSupportTickets.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 px-4 text-center">
                    <Headphones className="mx-auto h-6 w-6 text-slate-400" />
                    <p className="mt-2 text-xs font-bold text-slate-800">
                      No support tickets yet
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Need help with an order, warranty, or software activation? Submit a ticket on our Support page.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {liveSupportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            #{ticket.ticket_number} — {ticket.topic}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                            {ticket.message}
                          </p>
                          {ticket.reference_id && (
                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                              Ref: {ticket.reference_id}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            'self-start sm:self-center shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ticket.status === 'In Progress'
                                ? 'bg-sky-50 text-[#0284c7]'
                                : 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
      {/* Add / Edit Saved Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingAddress ? 'Edit Saved Address' : 'Add New Address'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Used for hardware delivery and courier repair pickups.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 p-6 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">
                  Address Label
                </label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Home Delivery">Home Delivery</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    placeholder="e.g. Kasun Perera"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="e.g. 077 123 4567"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="e.g. 45/2 Galle Road, Piliyandala"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  City / Postal Code
                </label>
                <input
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="e.g. Colombo, 10300"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-sky-500"
                />
                <span>Set as default shipping &amp; pickup address</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2 font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] disabled:opacity-60 cursor-pointer"
                >
                  {savingAddress
                    ? 'Saving...'
                    : editingAddress
                      ? 'Save Changes'
                      : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
