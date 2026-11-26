import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Search,
  MessageSquare,
  Ticket,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Send,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { submitSupportTicket } from '@/services/supportService';

type FaqCategory =
  | 'All'
  | 'Hardware & Warranty'
  | 'Software Keys'
  | 'Repairs & Diagnostics'
  | 'Shipping & Returns';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Hardware & Warranty',
    question: 'What is included in the 40-Point Certified Refurbished inspection?',
    answer:
      'Every Grade-A and Grade-B workstation undergoes a 40-point hardware audit: CPU/GPU thermal stress testing, NVMe SMART health verification, battery cycle & capacity testing (guaranteed ≥90% on Grade A), port & Thunderbolt passthrough checks, and a clean bloatware-free OS installation.',
  },
  {
    id: 'faq-2',
    category: 'Software Keys',
    question: 'How quickly do I receive my software license key after purchase?',
    answer:
      'All digital software licenses (Windows 11 Pro, Office 2024 Pro Plus, Kaspersky, Adobe, Visual Studio) are delivered instantly to your encrypted My License Vault and sent via email within seconds of checkout.',
  },
  {
    id: 'faq-3',
    category: 'Repairs & Diagnostics',
    question: 'How long does thermal repaste and hardware diagnostics take?',
    answer:
      'Standard diagnostics and thermal repaste services are completed within 24–48 hours at our Piliyandala service lab. Same-day express turnaround (4–6 hours) is available for SSD/RAM upgrades.',
  },
  {
    id: 'faq-4',
    category: 'Repairs & Diagnostics',
    question: 'What does your "No Fix, No Fee" & 90-Day Labor Warranty cover?',
    answer:
      'If our engineers cannot resolve the diagnosed hardware fault, you pay Rs. 0 for labor. All completed repairs carry a 90-day warranty covering both replaced components and technician workmanship.',
  },
  {
    id: 'faq-5',
    category: 'Shipping & Returns',
    question: 'Do you offer free shipping and a return window on hardware?',
    answer:
      'Yes! Orders over Rs. 150,000 qualify for free insured express dispatch with real-time tracking. All retail and certified refurbished hardware includes a 30-day hassle-free return guarantee.',
  },
  {
    id: 'faq-6',
    category: 'Software Keys',
    question: 'What if I run into an activation error with a retail or OEM key?',
    answer:
      'Our 24/7 activation engineering team can assist with phone or digital token activation at no extra cost. Use the Live Engineer Chat or submit a ticket with your Hardware ID.',
  },
];

const FAQ_CATEGORIES: FaqCategory[] = [
  'All',
  'Hardware & Warranty',
  'Software Keys',
  'Repairs & Diagnostics',
  'Shipping & Returns',
];

export function SupportPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('All');
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0].id);

  // Ticket Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [topic, setTopic] = useState('Hardware Warranty & RMA');
  const [message, setMessage] = useState('');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Live Chat Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'engineer',
      text: 'Hello! Welcome to NextGenSolutions Engineering Support. How can we help with your hardware, software key, or repair today?',
    },
  ]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleTicketSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) return;
    const code = Math.floor(2000 + Math.random() * 8000);
    const ticketNum = `SUP-${code}`;

    await submitSupportTicket({
      ticketNumber: ticketNum,
      userId: user?.uid ?? null,
      fullName: fullName.trim(),
      email: email.trim(),
      topic,
      referenceId: referenceId.trim() || undefined,
      message: message.trim(),
    });

    setSubmittedTicketId(ticketNum);
    setFullName('');
    setEmail('');
    setReferenceId('');
    setMessage('');
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
        text: 'Got it! An engineer from our Piliyandala diagnostics desk is reviewing your request and will respond here shortly.',
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark-Navy Support Hero Header */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 pt-8 pb-20 sm:pt-10 sm:pb-24">
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
            <span className="font-semibold text-sky-400">Support Center</span>
          </nav>

          <div className="mt-5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              <Sparkles className="h-3 w-3" />
              <span>24/7 Engineering &amp; Warranty Desk</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Technical Support &amp; Diagnostics Help Center
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Get direct assistance from certified hardware engineers, check
              warranty policies, or submit a priority support ticket.
            </p>

            {/* Search Input */}
            <div className="relative mt-6 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search warranty terms, software activation, repair turnaround..."
                className="w-full rounded-xl border border-slate-700/80 bg-[#121e31]/90 py-3 pl-11 pr-4 text-xs text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Overlapping 4 Quick Support Channel Cards */}
      <section className="relative z-10 -mt-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <MessageSquare className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Online Now
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-sm font-bold text-slate-900">
                Live Engineer Chat
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Instant help with activations, dock compatibility &amp; orders.
              </p>
            </div>
          </button>

          <a
            href="#submit-ticket"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Ticket className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                &lt; 2h Reply
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-sm font-bold text-slate-900">
                Submit Support Ticket
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Open a tracked case for RMA, billing, or enterprise quotes.
              </p>
            </div>
          </a>

          <Link
            to="/repair-status"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Wrench className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold text-[#0284c7]">
                Live Tracker →
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-sm font-bold text-slate-900">
                Track Repair Status
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                View bench-test notes, stage progress, and approve estimates.
              </p>
            </div>
          </Link>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Walk-in Lab
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-sm font-bold text-slate-900">
                Piliyandala Service Hub
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                130/55, Wijaya Sewana, Honnanthara South, Piliyandala
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Content: Knowledge Base FAQ (Left) + Ticket Form (Right) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Knowledge Base & FAQs */}
          <div className="lg:col-span-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Knowledge Base
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
                  Frequently Asked Questions
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {FAQ_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer',
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* FAQ Accordion List */}
            <div className="mt-5 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm font-bold text-slate-900">
                    No matching support articles
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another search keyword or submit a ticket on the right.
                  </p>
                </div>
              ) : (
                filteredFaqs.map((item) => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'overflow-hidden rounded-2xl border bg-white transition',
                        isOpen
                          ? 'border-sky-300 shadow-sm'
                          : 'border-slate-200/80 hover:border-slate-300',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqId(isOpen ? '' : item.id)
                        }
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                      >
                        <div>
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {item.category}
                          </span>
                          <p className="mt-1.5 text-xs font-bold text-slate-900 sm:text-[13px]">
                            {item.question}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                            isOpen && 'rotate-180 text-[#0284c7]',
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs leading-relaxed text-slate-600">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Submit a Support Ticket + Direct Contact */}
          <div id="submit-ticket" className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Submit a Support Ticket
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Priority SLA</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Our certified technicians respond within 2 business hours.
              </p>

              {submittedTicketId && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">
                      Ticket #{submittedTicketId} Created
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      We&apos;ve sent a confirmation copy to your email and
                      assigned an engineer.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="mt-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Miller"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option>Hardware Warranty &amp; RMA</option>
                      <option>Software License Activation</option>
                      <option>Repair Status Inquiry</option>
                      <option>Order &amp; Shipping</option>
                      <option>Enterprise Bulk Quote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">
                      Order / Ticket ID
                    </label>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. NGS-8842"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">
                    How can we help? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your hardware issue, order question, or license key request..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] py-2.5 text-xs font-bold text-white shadow-sm shadow-sky-500/20 hover:from-[#0369a1] hover:to-[#0284c7] transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Support Ticket</span>
                </button>
              </form>
            </div>

            {/* Direct Lab Contact Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1726] p-5 text-white shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Direct Service Lab Contact
              </p>
              <h3 className="mt-1 text-sm font-bold">
                NextGenSolutions Piliyandala Hub
              </h3>
              <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <span>
                    130/55, Wijaya Sewana, Honnanthara South, Piliyandala
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>support@nextgensolutions.io</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>Mon – Sat · 9:00 AM – 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Engineer Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0d1726] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold">
                  Live Hardware &amp; Software Support
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
                placeholder="Type your question here..."
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
