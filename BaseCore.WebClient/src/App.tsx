import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence } from "framer-motion";
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ScrollToTop from "./components/ScrollToTop";
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import SupportPage from './pages/SupportPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';
import AdminChat from './pages/admin/AdminChat';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminStock from './pages/admin/AdminStock';
import AdminReturns from './pages/admin/AdminReturns';
import AdminSuppliers from './pages/admin/AdminSuppliers';

// Route chỉ cho Admin/Seller/Supplier
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isSeller, isSupplier, authLoading } = useAuth();

  // Chờ AuthContext load xong mới check
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-flower-100 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin && !isSeller && !isSupplier) return <Navigate to="/" />;
  return <>{children}</>;
};

// Tương tự PrivateRoute
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-flower-100 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};
function AppRoutes() {
  const location = useLocation();
  const hideLayout = ['/login', '/register'].includes(location.pathname)
    || location.pathname.startsWith('/admin');;

  return (
    <>
      {!hideLayout && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes — ai cũng vào được */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={
            <PrivateRoute><CartPage /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <ProfilePage initialTab="orders" />
            </PrivateRoute>
          } />
          <Route path="/wishlist" element={
            <PrivateRoute><WishlistPage /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }>

            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
          </Route>
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
      </AnimatePresence>
      {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
