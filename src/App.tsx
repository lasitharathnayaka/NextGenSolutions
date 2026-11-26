import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { RequireAdmin, RequireAuth } from '@/components/common/ProtectedRoute';
import { HomePage } from '@/pages/customer/HomePage';
import { CatalogPage } from '@/pages/customer/CatalogPage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { SoftwarePage } from '@/pages/customer/SoftwarePage';
import { BookRepairPage } from '@/pages/customer/BookRepairPage';
import { AccountDashboardPage } from '@/pages/customer/AccountDashboardPage';
import { SupportPage } from '@/pages/customer/SupportPage';
import { CartPage } from '@/pages/customer/CartPage';
import { FavoritesPage } from '@/pages/customer/FavoritesPage';
import { AuthPage } from '@/pages/customer/AuthPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        {/* Public Browsing Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product" element={<ProductDetailPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/software" element={<SoftwarePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/signup" element={<AuthPage initialMode="register" />} />

        {/* Authenticated Customer Routes */}
        <Route
          path="/book-repair"
          element={
            <RequireAuth>
              <BookRepairPage />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/repair-status"
          element={
            <RequireAuth>
              <AccountDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
      </Route>

      {/* Admin & Staff Protected Routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
