import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';

// Pages
import AdminAuthPage from './pages/admin/AdminAuth';
import AdminLogoutPage from './pages/admin/AdminLogout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrdersPage from './pages/admin/OrdersPage';
import PaymentDetails from './pages/admin/Payments';
import AdminDeposits from './pages/admin/Deposits';
import UsersView from './pages/admin/UsersPage';
import AdminServicesPage from './pages/admin/ServicesPage';
import BlogsUpdate from './pages/admin/BlogsPage';
import ConfigView from './pages/admin/AdminConfigPage';
import AdminTicketsPage from './pages/admin/TicketsPage';

// ============= Admin Guard =============
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  return <>{children}</>;
};

// ============= App Content =============
function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Root redirect */}
        <Route path='/' element={<Navigate to='/admin/login' replace />} />

        {/* Public routes */}
        <Route path='/admin/login'  element={<AdminAuthPage />} />
        <Route path='/admin/logout' element={<AdminLogoutPage />} />

        {/* Protected routes */}
        <Route path='/admin/dashboard' element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path='/admin/orders'    element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
        <Route path='/admin/payments'  element={<AdminGuard><PaymentDetails /></AdminGuard>} />
        <Route path='/admin/deposits'  element={<AdminGuard><AdminDeposits /></AdminGuard>} />
        <Route path='/admin/users'     element={<AdminGuard><UsersView /></AdminGuard>} />
        <Route path='/admin/services'  element={<AdminGuard><AdminServicesPage /></AdminGuard>} />
        <Route path='/admin/blogs'     element={<AdminGuard><BlogsUpdate /></AdminGuard>} />
        <Route path='/admin/configs'   element={<AdminGuard><ConfigView /></AdminGuard>} />
        <Route path='/admin/tickets'   element={<AdminGuard><AdminTicketsPage /></AdminGuard>} />

        {/* Catch all → redirect to login */}
        <Route path='*' element={<Navigate to='/admin/login' replace />} />

      </Routes>
    </AnimatePresence>
  );
}

// ============= Root App =============
export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AppContent />
    </Router>
  );
}
