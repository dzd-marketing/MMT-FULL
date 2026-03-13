import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './components/HomePage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import VerifyEmail from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import CompleteProfile from './pages/CompleteProfile';
import ServicesPage from './pages/services';
import MaintenancePage from './components/Maintains';
import GlobalAlert from './components/GlobalAlert';
import SocialChat from './components/SocialChat';
import SnowEffect from './components/SnowEffect';
import FestivalEffect from './components/FestivalEffect';
import SEOHead from './components/SEOHead';
import axios from 'axios';

// Dashboard 
import DashboardLayout from './pages/dashboard/DashboardLayout'; 
import DashboardHomeView from './pages/dashboard/DashboardHomeView';
import TermsView from './pages/dashboard/TermsView';
import AddFundsView  from './pages/dashboard/AddFunds';
import NewOrderPage  from './pages/dashboard/NewOrderPage';
import OrdersPage  from './pages/dashboard/OrdersPage';
import ApiView from './pages/dashboard/ApiView';
import TicketsPage from './pages/dashboard/TicketsPage';
import ChildPanelsPage from './pages/dashboard/ChildPanelsPage';
import ProfileView from './pages/dashboard/ProfileView';
import DailyUpdatesPage from './pages/dashboard/DailyUpdatesPage';
import LuckySpin from './pages/dashboard/LuckySpinPage';
import TransferFundsView from './pages/dashboard/TransferFundsView';
import BlogsView from './pages/dashboard/BlogsView';
import ContactsPage from './components/ContactsPage';
import BlogView from './components/BlogView';

function AppContent() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const [effects, setEffects] = useState({
    snow_effect: false,
    festival_effect: false
  });

    const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    checkMaintenanceMode();
    fetchEffects();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/config/check-maintenance`);
      if (response.data.success) {
        setMaintenanceMode(response.data.maintenance_mode);
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setCheckingMaintenance(false);
    }
  };

  const fetchEffects = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/config/effects`);
      if (response.data.success) {
        setEffects(response.data.effects);
      }
    } catch (error) {
      console.error('Error fetching effects:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

 
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  
  if (maintenanceMode) {
    return <MaintenancePage />;
  }

  
  const showNavbar = !location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin');

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loading" />
      ) : (
        <>
          {/* Effects */}
          <SnowEffect enabled={effects.snow_effect} intensity="medium" />
          <FestivalEffect enabled={effects.festival_effect} type="default" />
          
          
          <GlobalAlert />
          <SocialChat />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1A1A',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {showNavbar && <Navbar />}
          <Routes location={location} key={location.pathname}>
            {/* Main */}
            <Route path="/" element={<HomePage key="home" />} />
            <Route path="/login" element={<Login key="login" />} />
            <Route path="/signup" element={<Signup key="signup" />} />
            <Route path='/contact' element={<ContactsPage/>} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path='/profile' element={<ProfileView/>} />
            <Route path='/updates' element={<DailyUpdatesPage/>} />
            <Route path='/lucky-spin' element={<LuckySpin/>} />
            
            {/* Out of the dashboard */}
            <Route path="/terms" element={<TermsView />} />
            <Route path="/api" element={<ApiView />} />
            <Route path="/blogs/:slug" element={<BlogView />} />

            {/* --- DASHBOARD NESTED ROUTES --- */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHomeView />} />
              <Route path="terms" element={<TermsView />} />
              <Route path="add-funds" element={<AddFundsView />} /> 
              <Route path="new-order" element={<NewOrderPage />} /> 
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<Navigate to="/dashboard/orders" replace />} />
              <Route path="tickets" element={<TicketsPage />} />              
              <Route path="api" element={<ApiView />} /> 
              <Route path="child-panel" element={<ChildPanelsPage />} />
              <Route path="child-panel/:id" element={<ChildPanelsPage />} />
              <Route path='profile' element={<ProfileView/>} />
              <Route path='updates' element={<DailyUpdatesPage/>} />
              <Route path='lucky-spin' element={<LuckySpin/>} />
               <Route path="blogs" element={<BlogsView />} />
              <Route path="transfer" element={<TransferFundsView />} />
            </Route>
          </Routes>
        </>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      <SEOHead />
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <AppContent />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}
