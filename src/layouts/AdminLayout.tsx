import { Outlet } from 'react-router-dom';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/customer/Footer';

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <AdminNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
