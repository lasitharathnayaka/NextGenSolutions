import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Loader2,
  Clock,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { placeOrder } from '@/services/ordersService';

// Admin WhatsApp number (international format, digits only, e.g. 94760336703)
const ADMIN_WHATSAPP_NUMBER = (
  (import.meta.env.VITE_ADMIN_WHATSAPP as string | undefined) || '94760336703'
).replace(/\D/g, '');

function buildWhatsAppOrderUrl(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: { productId?: string; name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  total: number;
}) {
  const itemLines = params.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productId ? `[${item.productId}] ` : ''}${item.name} × ${item.quantity} — Rs. ${(
          item.unitPrice * item.quantity
        ).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    )
    .join('\n');

  const message = [
    `*New Order — NextGenSolution*`,
    `Order Ref: *#${params.orderNumber}*`,
    ``,
    `*Customer Details:*`,
    `• Name: ${params.customerName}`,
    `• Email: ${params.customerEmail}`,
    `• Delivery Address: ${params.shippingAddress}`,
    ``,
    `*Order Items:*`,
    itemLines,
    ``,
    `*Order Summary:*`,
    `• Subtotal: Rs. ${params.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `• Delivery: Confirmed via WhatsApp`,
    `• *Total: Rs. ${params.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}*`,
    ``,
    `Please confirm my order and share payment/delivery details. Thank you!`,
  ].join('\n');

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function CartPage() {
  const { user } = useAuth();
  const {
    items,
    totalItems,
    expiredRemovedCount,
    dismissExpiredNotice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderNumber: string;
    whatsappUrl: string;
  } | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal;

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitting(true);

    const code = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `NGS-ORD-${code}`;
    const orderItems = items.map((i) => ({
      productId: i.sku || i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
    }));

    const whatsappUrl = buildWhatsAppOrderUrl({
      orderNumber: orderNum,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      shippingAddress: shippingAddress.trim(),
      items: orderItems,
      subtotal,
      total,
    });

    await placeOrder({
      orderNumber: orderNum,
      userId: user?.uid ?? null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      shippingAddress: shippingAddress.trim(),
      subtotal,
      shippingFee: 0,
      tax: 0,
      total,
      items: orderItems,
    });

    setSubmitting(false);
    setOrderConfirmation({ orderNumber: orderNum, whatsappUrl });
    clearCart();

    // Redirect customer to Admin WhatsApp with pre-filled order summary
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Dark-Navy Cart Header */}
      <section className="relative overflow-hidden bg-[#0a1220] border-b border-slate-800/80 py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
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
            <span className="font-semibold text-sky-400">Shopping Cart</span>
          </nav>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Your Hardware &amp; License Cart
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {totalItems} item{totalItems !== 1 ? 's' : ''} ready for instant
                WhatsApp order confirmation and express dispatch.
              </p>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {expiredRemovedCount > 0 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <span className="inline-flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                {expiredRemovedCount} item{expiredRemovedCount !== 1 ? 's were' : ' was'}{' '}
                automatically removed because unpaid cart items expire after 24 hours.
              </span>
            </span>
            <button
              type="button"
              onClick={dismissExpiredNotice}
              className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {orderConfirmation ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              Order Saved &amp; Ready on WhatsApp!
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Your order has been recorded and we&apos;ve opened WhatsApp so you can
              confirm payment and delivery directly with our team.
            </p>
            <p className="mt-3 inline-block rounded-xl border border-sky-200 bg-sky-50 px-5 py-2 font-mono text-base font-extrabold text-[#0284c7]">
              #{orderConfirmation.orderNumber}
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <a
                href={orderConfirmation.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 hover:bg-[#1ebe5d] transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send Order on WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <div className="flex flex-wrap justify-center gap-3 pt-1">
                <Link
                  to="/account"
                  className="rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0369a1] transition"
                >
                  View in Account Dashboard
                </Link>
                <Link
                  to="/catalog"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back to Catalog
                </Link>
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#0284c7]">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Your cart is currently empty
            </h2>
            <p className="mt-1.5 mx-auto max-w-md text-xs text-slate-500">
              Explore our 40-point certified laptops, workstations, NVMe storage,
              and instant software licenses to add items to your cart.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#0369a1] hover:to-[#0284c7] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Browse Hardware Catalog</span>
              </Link>
              <Link
                to="/software"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>Explore Software Keys</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left: Cart Items List */}
            <div className="space-y-4 lg:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-slate-900">
                      Cart Items ({totalItems})
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      <Clock className="h-3 w-3 text-sky-500" />
                      <span>Auto-clears after 24h</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-24 shrink-0 rounded-xl border border-slate-200/80 object-cover bg-slate-50"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Unit Price: Rs.{' '}
                            {item.price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                            {item.priceSuffix ?? ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        {/* Stepper */}
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <p className="w-28 text-right text-sm font-extrabold text-slate-900">
                          Rs.{' '}
                          {(item.price * item.quantity).toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </p>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Order Summary & WhatsApp Checkout Form */}
            <aside className="lg:col-span-4 lg:sticky lg:top-20">
              <form
                onSubmit={handlePlaceOrder}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/60"
              >
                <div className="bg-[#0d1726] px-6 py-4 text-white flex items-center justify-between">
                  <h2 className="text-sm font-bold">Order Summary &amp; Checkout</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp Order
                  </span>
                </div>

                <div className="space-y-4 p-6">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">
                        Rs.{' '}
                        {subtotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery</span>
                      <span className="font-semibold text-slate-500">
                        Confirmed via WhatsApp
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-lg font-extrabold text-[#0284c7]">
                        Rs.{' '}
                        {total.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
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
                        Email for Receipt &amp; Keys *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. kasun.perera@gmail.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="e.g. 45/2 Galle Road, Piliyandala, 10300"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-[11px] text-emerald-800">
                    No online card payment needed. Clicking below saves your order
                    and opens WhatsApp directly with our admin to confirm payment
                    &amp; delivery.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#25D366] py-3 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 hover:from-[#15803d] hover:to-[#16a34a] disabled:opacity-60 transition cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparing WhatsApp Order...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        <span>Place Order via WhatsApp</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-emerald-500" /> Direct Admin Chat
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Express Insured
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> 30-Day Return
                    </span>
                  </div>
                </div>
              </form>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
