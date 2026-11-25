import { useState, type FormEvent } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceType = 'laptop' | 'desktop';
type LogisticsType = 'drop-off' | 'courier';

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  plusParts?: boolean;
  turnaround: string;
}

const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'thermal-repaste',
    name: 'Full Thermal Repaste & Deep Clean',
    description:
      'Removes dust, replaces liquid metal/paste, lowers temps up to 15°C.',
    price: 25,
    priceDisplay: '$25',
    turnaround: 'Est. 24–48 Hours',
  },
  {
    id: 'ssd-ram-upgrade',
    name: 'SSD/RAM Hardware Upgrade',
    description: 'Professional component installation and stress testing.',
    price: 15,
    priceDisplay: '$15 + Parts',
    plusParts: true,
    turnaround: 'Same Day (4–6 Hrs)',
  },
  {
    id: 'os-install-backup',
    name: 'OS Install & Data Backup',
    description:
      'Clean OS reinstallation, driver updates, and user data migration.',
    price: 20,
    priceDisplay: '$20',
    turnaround: 'Est. 12–24 Hours',
  },
  {
    id: 'advanced-diagnostics',
    name: 'Advanced Hardware Diagnostics',
    description:
      'Full component bench test, motherboard short detection & report.',
    price: 10,
    priceDisplay: '$10',
    turnaround: 'Est. 24 Hours',
  },
];

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '01:00 PM - 03:00 PM',
  '04:00 PM - 06:00 PM',
];

const COURIER_FEE = 12;
const TAX_RATE = 0.08;

export function BookRepairPage() {
  const [deviceType, setDeviceType] = useState<DeviceType>('laptop');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    SERVICE_PACKAGES[0].id,
  );
  const [brandModel, setBrandModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [logistics, setLogistics] = useState<LogisticsType>('drop-off');
  const [pickupAddress, setPickupAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[1]);

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<string | null>(null);

  const selectedService =
    SERVICE_PACKAGES.find((s) => s.id === selectedServiceId) ??
    SERVICE_PACKAGES[0];

  const shippingFee = logistics === 'courier' ? COURIER_FEE : 0;
  const subtotal = selectedService.price + shippingFee;
  const estimatedTax = Number((subtotal * TAX_RATE).toFixed(2));
  const totalDue = subtotal + estimatedTax;

  const handleConfirmBooking = (e: FormEvent) => {
    e.preventDefault();
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
    setConfirmedTicket(`NGS-REP-${randomCode}`);
  };

  return (
    <div className="bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-400"
        >
          <Link to="/catalog" className="hover:text-slate-700 transition">
            Catalog
          </Link>
          <span>/</span>
          <span>Services</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">
            Repair &amp; Technical Booking
          </span>
        </nav>

        {/* Page Title */}
        <div className="mt-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
            Repair &amp; Technical Service Booking
          </h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
            Expert diagnostics, component upgrades, and professional repairs
            with transparent pricing and 90-day labor warranty.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <form
          onSubmit={handleConfirmBooking}
          className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
        >
          {/* Left Column: 3 Numbered Step Cards */}
          <div className="space-y-5 lg:col-span-8">
            {/* Step 1: Select Device & Service Package */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0284c7]">
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
                      ? 'border-2 border-[#0284c7] bg-sky-50/40'
                      : 'border border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Laptop
                      className={cn(
                        'h-5 w-5',
                        deviceType === 'laptop'
                          ? 'text-[#0284c7]'
                          : 'text-slate-500',
                      )}
                    />
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
                      ? 'border-2 border-[#0284c7] bg-sky-50/40'
                      : 'border border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Monitor
                      className={cn(
                        'h-5 w-5',
                        deviceType === 'desktop'
                          ? 'text-[#0284c7]'
                          : 'text-slate-500',
                      )}
                    />
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
                {SERVICE_PACKAGES.map((pkg) => {
                  const isSelected = pkg.id === selectedServiceId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedServiceId(pkg.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#0284c7] bg-sky-50/35'
                          : 'border border-slate-200 bg-white hover:border-slate-300',
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
                          <p className="text-xs font-bold text-slate-900">
                            {pkg.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {pkg.description}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-xs font-extrabold text-slate-900">
                        {pkg.priceDisplay}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Device Details & Issue Summary */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0284c7]">
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
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
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
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
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
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            </section>

            {/* Step 3: Logistics & Service Schedule */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0284c7]">
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
              <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setLogistics('drop-off')}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition cursor-pointer',
                    logistics === 'drop-off'
                      ? 'bg-white text-slate-900 shadow-2xs'
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
                    'inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition cursor-pointer',
                    logistics === 'courier'
                      ? 'bg-white text-slate-900 shadow-2xs'
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
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
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
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
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
                          'rounded-lg py-2.5 text-center text-[11px] font-semibold transition cursor-pointer',
                          isSelected
                            ? 'border-2 border-[#0284c7] bg-sky-50/50 text-[#0284c7]'
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
            <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Booking Summary
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Verified Center</span>
                </span>
              </div>

              {/* Line Items */}
              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedService.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {deviceType === 'laptop'
                        ? 'Laptop Hardware Service'
                        : 'Desktop Hardware Service'}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-slate-900">
                    ${selectedService.price.toFixed(2)}
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
                    <span className="font-bold text-slate-900">$0.00</span>{' '}
                    <span className="text-[10px] font-semibold text-emerald-600">
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
                        ? 'Tech Hub Downtown Branch'
                        : 'Insured Two-Way Transit'}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-slate-900">
                    {shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-slate-700">
                    ${estimatedTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="font-bold text-slate-900">
                    Total Due at Service
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    ${totalDue.toFixed(2)}
                    {selectedService.plusParts ? '*' : ''}
                  </span>
                </div>
              </div>

              {/* Turnaround & Warranty Mini Cards */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400">Turnaround</p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-800">
                    {selectedService.turnaround}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400">Warranty</p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-800">
                    90-Day Guarantee
                  </p>
                </div>
              </div>

              {/* Inline Validation Error */}
              {formError && (
                <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
                  {formError}
                </p>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0284c7] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#0369a1] transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Service Booking</span>
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
          </aside>
        </form>
      </div>

      {/* Booking Confirmed Modal */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
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
              <div className="rounded-lg border border-sky-200/70 bg-sky-50/60 p-3.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Repair Ticket Reference
                </p>
                <p className="mt-1 font-mono text-lg font-extrabold text-[#0284c7]">
                  {confirmedTicket}
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
                    {selectedService.name}
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
                    ${totalDue.toFixed(2)}
                  </dd>
                </div>
              </dl>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmedTicket(null)}
                  className="flex-1 rounded-lg bg-[#0284c7] py-2.5 text-xs font-semibold text-white hover:bg-[#0369a1] cursor-pointer"
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
