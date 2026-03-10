import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAuthPage from './pages/admin/AdminAuth';
import AdminLogoutPage from './pages/admin/AdminLogout';
import axios from 'axios';

//dashboard
import AdminOrdersPage from './pages/admin/OrdersPage';
import PaymentDetails from './pages/admin/Payments';
import AdminDeposits from './pages/admin/Deposits';
import UsersView from './pages/admin/UsersPage';
import AdminServicesPage from './pages/admin/ServicesPage';
import BlogsUpdate from './pages/admin/BlogsPage';
import ConfigView from './pages/admin/AdminConfigPage';
import AdminTicketsPage from './pages/admin/TicketsPage';

// ── Admin Guard ───────────────────────────────────────────────────────────
// Wrap any admin page with this to block unauthenticated access.
// If no adminToken in localStorage → redirects to /admin/login automatically.
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  // Don't render children until token is confirmed
  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

    const showNavbar = !location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin');

  return (
    <AnimatePresence mode="wait">
      <>
        <Routes location={location} key={location.pathname}>

          {/* ── Admin Auth (public — no guard) ── */}
          <Route path='/admin/login' element={<AdminAuthPage />} />
          <Route path='/admin/logout' element={<AdminLogoutPage />} />

          {/* ── Admin Pages (all protected by AdminGuard) ── */}
          <Route path='/admin/dashboard' element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path='/admin/orders'    element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
          <Route path='/admin/payments'  element={<AdminGuard><PaymentDetails /></AdminGuard>} />
          <Route path='/admin/deposits'  element={<AdminGuard><AdminDeposits /></AdminGuard>} />
          <Route path='/admin/users'     element={<AdminGuard><UsersView /></AdminGuard>} />
          <Route path='/admin/services'  element={<AdminGuard><AdminServicesPage /></AdminGuard>} />
          <Route path='/admin/blogs'     element={<AdminGuard><BlogsUpdate /></AdminGuard>} />
          <Route path='/admin/configs'   element={<AdminGuard><ConfigView /></AdminGuard>} />
          <Route path='/admin/tickets'   element={<AdminGuard><AdminTicketsPage /></AdminGuard>} />

        </Routes>
      </>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AppContent />
    </Router>
  );
}