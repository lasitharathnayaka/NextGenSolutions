import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/customer/Navbar';
import { Footer } from '@/components/customer/Footer';

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
