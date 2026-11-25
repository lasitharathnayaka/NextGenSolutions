export function Footer() {
  return (
    <footer className="bg-[#0d1726] border-t border-slate-800/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:text-left">
          <span className="text-xs font-bold tracking-tight text-white">
            NextGenSolutions Platform
          </span>
          <span className="text-xs text-slate-400">
            Enterprise Hardware Diagnostics &amp; Repair
          </span>
        </div>
        <p className="text-xs text-slate-400">
          © 2026 NextGenSolutions Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
