const ADMIN_WHATSAPP_NUMBER = (
  (import.meta.env.VITE_ADMIN_WHATSAPP as string | undefined) || '94760336703'
).replace(/\D/g, '');

const DEFAULT_INQUIRY_MESSAGE =
  "Hi NextGenSolutions! I'd like to get more information about your products and services.";

export function WhatsAppFloatingButton() {
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    DEFAULT_INQUIRY_MESSAGE,
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with NextGenSolutions on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-[#0d1726]/95 px-3.5 py-3 text-white shadow-[0_0_26px_rgba(37,211,102,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-[0_0_36px_rgba(37,211,102,0.5)] sm:px-4"
    >
      {/* WhatsApp Icon Circle with Online Pulse */}
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#16a34a] text-white shadow-md shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-105">
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-3 w-3"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#0d1726] bg-emerald-400" />
        </span>
        <svg
          viewBox="0 0 32 32"
          className="h-6 w-6 fill-current"
          aria-hidden="true"
        >
          <path d="M16.002 3C8.832 3 3 8.832 3 16c0 2.29.598 4.525 1.735 6.494L3 29l6.678-1.75A12.94 12.94 0 0 0 16.002 29C23.17 29 29 23.168 29 16S23.17 3 16.002 3zm0 23.62c-2.06 0-4.075-.552-5.83-1.596l-.418-.248-3.963 1.038 1.058-3.864-.272-.434A10.56 10.56 0 0 1 5.38 16c0-5.857 4.765-10.62 10.622-10.62 2.838 0 5.505 1.106 7.51 3.112A10.553 10.553 0 0 1 26.62 16c0 5.857-4.764 10.62-10.618 10.62zm5.826-7.955c-.32-.16-1.89-.932-2.182-1.038-.293-.107-.506-.16-.72.16-.213.32-.826 1.038-1.012 1.252-.186.213-.373.24-.692.08-.32-.16-1.35-.498-2.57-1.586-.95-.847-1.592-1.894-1.778-2.214-.186-.32-.02-.493.14-.652.144-.144.32-.373.48-.56.16-.186.213-.32.32-.533.106-.213.053-.4-.027-.56-.08-.16-.72-1.732-.986-2.372-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.665s1.146 3.092 1.306 3.305c.16.213 2.256 3.445 5.465 4.83.763.33 1.36.526 1.825.673.767.244 1.465.21 2.017.127.615-.092 1.89-.773 2.156-1.52.266-.746.266-1.386.186-1.52-.08-.133-.293-.213-.613-.373z" />
        </svg>
      </span>

      {/* Text Copy (visible on sm+ screens) */}
      <div className="hidden sm:block pr-1 text-left leading-tight">
        <p className="text-sm font-extrabold tracking-tight text-white">
          Need Help?
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-emerald-300/95">
          Chat with us on WhatsApp!
        </p>
      </div>
    </a>
  );
}
