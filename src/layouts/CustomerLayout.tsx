import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/customer/Navbar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/customer/Footer';
import { WhatsAppFloatingButton } from '@/components/customer/WhatsAppFloatingButton';
import { useAuth } from '@/contexts/AuthContext';

export function CustomerLayout() {
  const { isAdminOrStaff } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      {isAdminOrStaff ? <AdminNavbar /> : <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {!isAdminOrStaff && <WhatsAppFloatingButton />}
    </div>
  );
}
