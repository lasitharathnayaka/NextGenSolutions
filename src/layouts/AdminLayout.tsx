import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Admin Sidebar & Topbar will be built from your UI design */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
