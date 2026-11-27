import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Mail,
  Phone,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Zap,
  Wrench,
} from 'lucide-react';
import { subscribeNewsletter } from '@/services/supportService';
import { useAuth } from '@/contexts/AuthContext';

export function Footer() {
  const { isAdminOrStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setStatusMessage(null);

    const { error } = await subscribeNewsletter(trimmed);
    setSubmitting(false);

    if (error && error.toLowerCase().includes('permission')) {
      setStatusMessage({
        type: 'info',
        text: `${trimmed} is already subscribed to restock alerts!`,
      });
      setEmail('');
    } else if (error) {
      setStatusMessage({
        type: 'error',
        text: 'Could not subscribe right now. Please try again.',
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Subscribed! Restock & deal alerts will be sent to ${trimmed}.`,
      });
      setEmail('');
    }
    window.setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <footer className="relative overflow-hidden bg-[#0a1220] text-slate-300 border-t border-slate-800/90">
      {/* Subtle top ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[640px] -translate-x-1/2 rounded-full bg-sky-500/8 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        {/* Newsletter / Tech Dispatch Banner */}
        <div className="mb-12 flex flex-col justify-between gap-6 rounded-2xl border border-slate-800/90 bg-[#0f1a2d]/90 p-6 sm:p-7 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              <Zap className="h-3 w-3" />
              <span>Hardware &amp; Restock Alerts</span>
            </div>
            <h2 className="mt-2.5 text-base font-bold tracking-tight text-white sm:text-lg">
              Get priority access to Grade-A workstation drops &amp; firmware updates
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Weekly enterprise stocklists, seasonal component deals, and diagnostic tips — zero spam.
            </p>
          </div>

          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubscribe}
              className="flex w-full flex-col gap-2.5 sm:flex-row"
            >
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work or personal email"
                  className="w-full rounded-lg border border-slate-700/80 bg-[#0a1220] py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0369a1] disabled:opacity-60 transition cursor-pointer"
              >
                {statusMessage?.type === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>{submitting ? 'Saving...' : 'Subscribe'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
            {statusMessage && (
              <p
                className={`mt-2 text-[11px] font-medium ${
                  statusMessage.type === 'error'
                    ? 'text-rose-400'
                    : statusMessage.type === 'info'
                      ? 'text-sky-300'
                      : 'text-emerald-400'
                }`}
              >
                {statusMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Main Navigation & Info Grid */}
        <div className="grid grid-cols-1 gap-10 pb-10 border-b border-slate-800/80 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Contact Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16263f] border border-slate-700/70 text-sky-400 group-hover:border-sky-500/60 transition">
                <Cpu className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">
                NextGenSolutions
              </span>
            </Link>

            <p className="max-w-xs text-xs leading-relaxed text-slate-400">
              Enterprise-grade workstations, certified refurbished hardware,
              instant software licensing, and precision diagnostics backed by
              industry-leading warranties.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>
                  130/55, Wijaya Sewana, Honnanthara South, Piliyandala
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <a
                  href="mailto:support@nextgensolutions.io"
                  className="hover:text-sky-400 transition"
                >
                  support@nextgensolutions.io
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <a
                  href="tel:+94760336703"
                  className="hover:text-sky-400 transition"
                >
                  +94 76 033 6703
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Mon – Sat · 9:00 AM – 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Hardware & Store */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Hardware Store
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/catalog" className="hover:text-sky-400 transition">
                  All Hardware
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=Laptops"
                  className="hover:text-sky-400 transition"
                >
                  Laptops &amp; Workstations
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=RAM"
                  className="hover:text-sky-400 transition"
                >
                  RAM &amp; PC Components
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?category=SSD%20%2F%20Storage"
                  className="hover:text-sky-400 transition"
                >
                  NVMe Storage
                </Link>
              </li>
              <li>
                <Link to="/software" className="hover:text-sky-400 transition">
                  Software Licenses
                </Link>
              </li>
            </ul>
          </div>

          {/* Repair & Diagnostics */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Repair &amp; Lab
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link
                  to="/book-repair"
                  className="hover:text-sky-400 transition"
                >
                  Book a Repair
                </Link>
              </li>
              <li>
                <Link
                  to="/repair-status"
                  className="hover:text-sky-400 transition"
                >
                  Track Repair Status
                </Link>
              </li>
              <li>
                <Link
                  to="/book-repair"
                  className="hover:text-sky-400 transition"
                >
                  Thermal Repaste
                </Link>
              </li>
              <li>
                <Link
                  to="/book-repair"
                  className="hover:text-sky-400 transition"
                >
                  Hardware Upgrades
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-sky-400 transition">
                  Warranty Claims
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Portals */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Portals
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/account" className="hover:text-sky-400 transition">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-sky-400 transition">
                  Saved Favourites
                </Link>
              </li>
              <li>
                <Link
                  to="/product/dell-latitude-7430"
                  className="hover:text-sky-400 transition"
                >
                  Inspection Reports
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-sky-400 transition">
                  Support &amp; Help Center
                </Link>
              </li>
              {isAdminOrStaff && (
                <li>
                  <Link to="/admin" className="text-sky-400 hover:text-sky-300 transition">
                    Admin Console
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Quality Guarantees */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Standards
            </h3>
            <div className="mt-4 space-y-2.5 text-[11px]">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0f1a2d] px-3 py-2 text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>40-Point Bench Tested</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0f1a2d] px-3 py-2 text-slate-300">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>90-Day Repair Warranty</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0f1a2d] px-3 py-2 text-slate-300">
                <Lock className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Verified Key Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Security Row */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-[11px] text-slate-500 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
            <span>© 2026 NextGenSolutions Inc. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <Link to="/support" className="hover:text-slate-300 transition">
              Privacy Policy
            </Link>
            <Link to="/support" className="hover:text-slate-300 transition">
              Terms of Service
            </Link>
            <Link to="/support" className="hover:text-slate-300 transition">
              Warranty Policy
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['WhatsApp Checkout', 'Bank Transfer', 'Cash on Delivery', '256-bit SSL'].map((badge) => (
              <span
                key={badge}
                className="rounded border border-slate-800 bg-[#0f1a2d] px-2 py-0.5 text-[10px] font-semibold text-slate-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
