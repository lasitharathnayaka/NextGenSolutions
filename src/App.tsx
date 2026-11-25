import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/customer/HomePage';
import { CatalogPage } from '@/pages/customer/CatalogPage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { SoftwarePage } from '@/pages/customer/SoftwarePage';
import { BookRepairPage } from '@/pages/customer/BookRepairPage';
import { AccountDashboardPage } from '@/pages/customer/AccountDashboardPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product" element={<ProductDetailPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/software" element={<SoftwarePage />} />
        <Route path="/book-repair" element={<BookRepairPage />} />
        <Route path="/account" element={<AccountDashboardPage />} />
        <Route path="/repair-status" element={<AccountDashboardPage />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
