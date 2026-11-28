import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  Monitor,
  Store,
  Truck,
  CheckCircle2,
  Lock,
  ShieldCheck,
  X,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { createRepairBooking } from '@/services/repairsService';
import {
  DEFAULT_REPAIR_SERVICES,
  subscribeRepairServices,
  type RepairServicePackage,
} from '@/services/repairServicesCatalog';

type DeviceType = 'laptop' | 'desktop';
type LogisticsType = 'drop-off' | 'courier';

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '01:00 PM - 03:00 PM',
  '04:00 PM - 06:00 PM',
];

const COURIER_FEE = 1500;
const TAX_RATE = 0.08;
const ADMIN_WHATSAPP_NUMBER = (
  (import.meta.env.VITE_ADMIN_WHATSAPP as string | undefined) || '94760336703'
).replace(/\D/g, '');

export function BookRepairPage() {
  const { user, profile } = useAuth();
  const [deviceType, setDeviceType] = useState<DeviceType>('laptop');
  const [allServices, setAllServices] = useState<RepairServicePackage[]>(
    isFirebaseConfigured ? [] : DEFAULT_REPAIR_SERVICES,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    isFirebaseConfigured ? '' : DEFAULT_REPAIR_SERVICES[0].id,
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [logistics, setLogistics] = useState<LogisticsType>('drop-off');
  const [pickupAddress, setPickupAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[1]);

  const customerId = profile?.enterprise_id || 'NGS-CUST-001';

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<string | null>(null);
  const [confirmedWhatsAppUrl, setConfirmedWhatsAppUrl] = useState<
    string | null
  >(null);

  useEffect(() => {
    const unsub = subscribeRepairServices((services) => {
      setAllServices(services);
    });
    return unsub;
  }, []);

  const visibleServices = useMemo(() => {
    const active = allServices.filter((s) => s.is_active);
    const matching = active.filter((s) => {
      if (s.device_scope === 'All Devices') return true;
      if (deviceType === 'laptop') return s.device_scope === 'Laptop & Notebook';
      return s.device_scope === 'Desktop & Workstation';
    });
    return isFirebaseConfigured
      ? matching
      : matching.length > 0
        ? matching
        : DEFAULT_REPAIR_SERVICES;
  }, [allServices, deviceType]);

  const selectedService =
    visibleServices.find((s) => s.id === selectedServiceId) ??
    visibleServices[0] ??
    null;

  const shippingFee = logistics === 'courier' ? COURIER_FEE : 0;
  const subtotal = (selectedService?.price ?? 0) + shippingFee;
  const estimatedTax = Number((subtotal * TAX_RATE).toFixed(2));
  const totalDue = subtotal + estimatedTax;

  const handleConfirmBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      setFormError('No repair service package is currently available. Please contact us via WhatsApp.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Please enter your Full Name.');
      return;
    }
    if (!customerAddress.trim()) {
      setFormError('Please enter your Address.');
      return;
    }
    if (!brandModel.trim()) {
      setFormError('Please enter your device Brand / Model.');
      return;
    }
    if (!issueDescription.trim()) {
      setFormError('Please provide a brief description of the issue.');
      return;
    }
    if (!preferredDate) {
      setFormError('Please select a preferred service date.');
      return;
    }
    if (logistics === 'courier' && !pickupAddress.trim()) {
      setFormError('Please enter your pickup address for Doorstep Courier.');
      return;
    }

    setFormError(null);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const ticketNum = `NGS-ORD-${randomCode}`;

    const waLines = [
      `*New Repair Booking — NextGenSolution*`,
      `Order ID: *#${ticketNum}*`,
      ``,
      `*Customer Details:*`,
      `• Customer ID: ${customerId}`,
      `• Name: ${customerName.trim()}`,
      ...(customerPhone.trim() ? [`• Phone: ${customerPhone.trim()}`] : []),
      ...(user?.email ? [`• Email: ${user.email}`] : []),
      `• Address: ${customerAddress.trim()}`,
      ``,
      `*Repair Details:*`,
      `• Device Type: ${deviceType === 'laptop' ? 'Laptop & Notebook' : 'Desktop & Workstation'}`,
      `• Brand / Model: ${brandModel.trim()}`,
      ...(serialNumber.trim() ? [`• Serial Number: ${serialNumber.trim()}`] : []),
      `• Service: [${selectedService.service_id}] ${selectedService.name}`,
      `• Issue: ${issueDescription.trim()}`,
      ``,
      `*Logistics:* ${logistics === 'drop-off' ? 'In-Store Drop-Off (Piliyandala Hub)' : `Doorstep Courier (${pickupAddress.trim()})`}`,
      `*Date & Time:* ${preferredDate} · ${selectedSlot}`,
      `*Total Due:* Rs. ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}${selectedService.plus_parts ? ' (+ Parts)' : ''}`,
      ``,
      `Please confirm my repair booking. Thank you!`,
    ];
    const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      waLines.join('\n'),
    )}`;

    // Open Admin WhatsApp immediately inside user gesture so popups are not blocked
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    await createRepairBooking({
      ticketNumber: ticketNum,
      userId: user?.uid ?? null,
      customerId,
      customerName: customerName.trim(),
      customerEmail: user?.email ?? null,
      customerPhone: customerPhone.trim() || null,
      customerAddress: customerAddress.trim(),
      deviceType,
      servicePackage: selectedService.name,
      brandModel: brandModel.trim(),
      serialNumber: serialNumber.trim() || undefined,
      issueDescription: issueDescription.trim(),
      logisticsType: logistics,
      pickupAddress: pickupAddress.trim() || undefined,
      preferredDate,
      timeSlot: selectedSlot,
      subtotal,
      tax: estimatedTax,
      totalDue,
    });

    setConfirmedWhatsAppUrl(waUrl);
    setConfirmedTicket(ticketNum);
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark-Navy Service Booking Hero Header */}
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
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            <Link to="/" className="text-slate-400 hover:text-sky-400 transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-slate-400">Services</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-semibold text-sky-400">
              Repair &amp; Technical Booking
            </span>
          </nav>

          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                <Sparkles className="h-3 w-3" />
                <span>Certified Diagnostics Lab</span>
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Repair &amp; Technical Service Booking
              </h1>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
                Expert diagnostics, component upgrades, and precision repairs
                with transparent pricing and a 90-day labor warranty.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#121e31] px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>No Fix, No Fee</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#121e31] px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                <span>Piliyandala Service Hub</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-7 pb-16 sm:px-6 lg:px-8">
        {/* Main 2-Column Layout */}
        <form
          onSubmit={handleConfirmBooking}
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
        >
          {/* Left Column: 3 Numbered Step Cards */}
          <div className="space-y-5 lg:col-span-8">
            {/* Step 1: Select Device & Service Package */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] text-xs font-bold text-white shadow-xs">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Select Device &amp; Service Package
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Choose your hardware category and the required technical
                    service.
                  </p>
                </div>
              </div>

              {/* Device Category Cards */}
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeviceType('laptop')}
                  className={cn(
                    'flex flex-col rounded-xl p-4 text-left transition cursor-pointer',
                    deviceType === 'laptop'
                      ? 'border-2 border-[#0284c7] bg-sky-50/50 shadow-2xs'
                      : 'border border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        deviceType === 'laptop'
                          ? 'bg-sky-100 text-[#0284c7]'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Laptop className="h-4.5 w-4.5" />
                    </span>
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border',
                        deviceType === 'laptop'
                          ? 'border-[#0284c7] bg-[#0284c7]'
                          : 'border-slate-300 bg-white',
                      )}
                    >
                      {deviceType === 'laptop' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-900">
                    Laptop &amp; Notebook
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    MacBooks, Windows Ultrabooks, Gaming Laptops
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceType('desktop')}
                  className={cn(
                    'flex flex-col rounded-xl p-4 text-left transition cursor-pointer',
                    deviceType === 'desktop'
                      ? 'border-2 border-[#0284c7] bg-sky-50/50 shadow-2xs'
                      : 'border border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        deviceType === 'desktop'
                          ? 'bg-sky-100 text-[#0284c7]'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Monitor className="h-4.5 w-4.5" />
                    </span>
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border',
                        deviceType === 'desktop'
                          ? 'border-[#0284c7] bg-[#0284c7]'
                          : 'border-slate-300 bg-white',
                      )}
                    >
                      {deviceType === 'desktop' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-900">
                    Desktop &amp; Workstation
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Custom Rigs, All-in-Ones, Enterprise Towers
                  </p>
                </button>
              </div>

              {/* Service Package Radio Rows */}
              <div className="mt-4 space-y-2.5">
                {visibleServices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
                    <p className="text-xs font-bold text-slate-800">
                      No repair services listed yet
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Service packages added in the Admin Console will appear here automatically.
                    </p>
                  </div>
                ) : (
                  visibleServices.map((pkg) => {
                    const isSelected = pkg.id === selectedService?.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedServiceId(pkg.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#0284c7] bg-sky-50/40 shadow-2xs'
                          : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
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
                            <p className="text-xs font-bold text-slate-900">
                              {pkg.name}
                            </p>
                            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                              {pkg.service_id}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {pkg.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'shrink-0 text-xs font-extrabold',
                          isSelected ? 'text-[#0284c7]' : 'text-slate-900',
                        )}
                      >
                        {pkg.price_display}
                      </span>
                    </button>
                  );
                }))}
              </div>
            </section>

            {/* Step 2: Device Details & Issue Summary */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] text-xs font-bold text-white shadow-xs">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Device Details &amp; Issue Summary
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Provide your exact hardware specifications and describe the
                    fault.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand-model"
                    className="block text-[11px] font-semibold text-slate-700"
                  >
                    Brand / Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="brand-model"
                    type="text"
                    value={brandModel}
                    onChange={(e) => setBrandModel(e.target.value)}
                    placeholder="e.g. Dell XPS 15, MacBook Pro M2"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="serial-number"
                    className="block text-[11px] font-semibold text-slate-700"
                  >
                    Serial Number (Optional)
                  </label>
                  <input
                    id="serial-number"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. C02G901NMD6R"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="issue-description"
                  className="block text-[11px] font-semibold text-slate-700"
                >
                  Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="issue-description"
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe symptoms, error codes, unusual sounds, or recent liquid spills..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            </section>

            {/* Step 3: Logistics & Service Schedule */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] text-xs font-bold text-white shadow-xs">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Logistics &amp; Service Schedule
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Select how you want to hand over your device and pick a
                    convenient slot.
                  </p>
                </div>
              </div>

              {/* Segmented Logistics Control */}
              <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setLogistics('drop-off')}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition cursor-pointer',
                    logistics === 'drop-off'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>In-Store Drop-off</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogistics('courier')}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition cursor-pointer',
                    logistics === 'courier'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Doorstep Courier Pickup</span>
                </button>
              </div>

              {logistics === 'courier' && (
                <div className="mt-4">
                  <label
                    htmlFor="pickup-address"
                    className="block text-[11px] font-semibold text-slate-700"
                  >
                    Courier Pickup Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="pickup-address"
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Street address, apartment/suite, and postal code"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
              )}

              {/* Preferred Date */}
              <div className="mt-4 max-w-xs">
                <label
                  htmlFor="preferred-date"
                  className="block text-[11px] font-semibold text-slate-700"
                >
                  Preferred Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              {/* Time Slots */}
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-slate-700">
                  Select Time Slot <span className="text-rose-500">*</span>
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = slot === selectedSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'rounded-xl py-2.5 text-center text-[11px] font-semibold transition cursor-pointer',
                          isSelected
                            ? 'border-2 border-[#0284c7] bg-sky-50/60 text-[#0284c7] shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/60">
              {/* Dark Navy Header */}
              <div className="flex items-center justify-between bg-[#0d1726] px-6 py-4 text-white">
                <h2 className="text-sm font-bold">Booking Summary</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Center</span>
                </span>
              </div>

              <div className="p-6">
                {/* Line Items */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {selectedService ? selectedService.name : 'No service selected'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {deviceType === 'laptop'
                          ? 'Laptop Hardware Service'
                          : 'Desktop Hardware Service'}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-slate-900">
                      Rs. {(selectedService?.price ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Diagnostic Bench Test
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Component Stress Check
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-bold text-slate-900">Rs. 0.00</span>{' '}
                      <span className="text-[10px] font-bold text-emerald-600">
                        Included
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {logistics === 'drop-off'
                          ? 'In-Store Drop-Off'
                          : 'Doorstep Courier Pickup'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {logistics === 'drop-off'
                          ? 'Piliyandala Service Hub'
                          : 'Insured Two-Way Transit'}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-slate-900">
                      {shippingFee === 0 ? 'Free' : `Rs. ${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-700">
                      Rs. {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Estimated Tax</span>
                    <span className="font-semibold text-slate-700">
                      Rs. {estimatedTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="font-bold text-slate-900">
                      Total Due at Service
                    </span>
                    <span className="text-lg font-extrabold text-[#0284c7]">
                      Rs. {totalDue.toFixed(2)}
                      {selectedService?.plus_parts ? '*' : ''}
                    </span>
                  </div>
                </div>

                {/* Turnaround & Warranty Mini Cards */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Turnaround
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-900">
                      {selectedService?.turnaround ?? 'TBD'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Warranty
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-900">
                      90-Day Guarantee
                    </p>
                  </div>
                </div>

                {/* Customer Details (for Admin identification & WhatsApp) */}
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer Details
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      ID: {customerId}
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
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
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 077 123 4567"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. 45/2 Galle Road, Piliyandala, 10300"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Inline Validation Error */}
                {formError && (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
                    {formError}
                  </p>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] py-3 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 hover:from-[#15803d] hover:to-[#16a34a] transition cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Confirm Service Booking via WhatsApp</span>
                </button>

                {/* Trust Micro-Footer */}
                <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Secure Booking</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>No Fix, No Fee</span>
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>

      {/* Booking Confirmed Modal */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-900">
                  Service Booking Confirmed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmedTicket(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <div className="rounded-xl border border-sky-200/70 bg-sky-50/60 p-3.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Repair Order Reference
                </p>
                <p className="mt-1 font-mono text-lg font-extrabold text-[#0284c7]">
                  #{confirmedTicket}
                </p>
              </div>

              <dl className="space-y-2 text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Device:</dt>
                  <dd className="font-semibold text-slate-900">{brandModel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Service:</dt>
                  <dd className="font-semibold text-slate-900">
                    {selectedService?.name ?? 'Repair Service'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="inline-flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> Date:
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {preferredDate}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="h-3.5 w-3.5" /> Slot:
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {selectedSlot}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                  <dt className="font-bold text-slate-900">Total Due:</dt>
                  <dd className="font-extrabold text-slate-900">
                    Rs. {totalDue.toFixed(2)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                {confirmedWhatsAppUrl && (
                  <a
                    href={confirmedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white hover:bg-[#1ebe5d] transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Open WhatsApp Chat</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmedTicket(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
