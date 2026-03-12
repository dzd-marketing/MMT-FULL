import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import axios from 'axios';
import { 
  Layout, PlusCircle, ShoppingCart, List, Ticket, Cpu, 
  Users, ShieldCheck, RefreshCw, Send, BookOpen, 
  Wallet, Menu, X, ChevronRight, LogOut, Globe
} from 'lucide-react';
import authService from '../../services/auth';


const currencySymbols = {
  USD: '$ ',
  LKR: 'LKR ',
  INR: '₹ '
};


const mapBackendCurrency = (backendCurrency: string): 'USD' | 'LKR' | 'INR' => {
  if (backendCurrency === 'USD' || backendCurrency === 'LKR' || backendCurrency === 'INR') {
    return backendCurrency;
  }
  const map = {
    '1': 'USD',
    '2': 'LKR',
    '3': 'INR'
  };
  return (map[backendCurrency as keyof typeof map] || 'USD') as 'USD' | 'LKR' | 'INR';
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCurrency, setUserCurrency] = useState<'USD' | 'LKR' | 'INR'>('LKR');
  const [conversionRates, setConversionRates] = useState({
    usdToLkr: 309.45,
    inrToLkr: 3.37
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const dataCache = useRef({
    user: null as any,
    wallet: null as any,
    timestamp: 0
  });
  
  const [userData, setUserData] = useState({ 
    id: null,
    full_name: 'User', 
    email: '',
    phone: '',
    whatsapp: '',
    profile_picture: null,
    available_balance: '0.00',
    spent_balance: '0.00',
    total_history_balance: '0.00'
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  
  useEffect(() => {
    const fetchSiteLogo = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/config/public`);
        if (response.data.success) {
          const config = response.data.config;
          if (config.site_logo) {
            setSiteLogo(config.site_logo);
          }
        }
      } catch (error) {
        console.error('Error fetching site logo:', error);
      }
    };

    fetchSiteLogo();
  }, [API_URL]);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads')) return `${BASE_URL}${path}`;
    return `${BASE_URL}${path}`;
  };

  useEffect(() => {
    const fetchConversionRates = async () => {
      setRatesLoading(true);
      
      try {
        const usdToLkrResponse = await axios.get('https://hexarate.paikama.co/api/rates/USD/LKR/latest');
        if (usdToLkrResponse.data?.data?.mid) {
          setConversionRates(prev => ({
            ...prev,
            usdToLkr: usdToLkrResponse.data.data.mid
          }));
        }

        const inrToUsdResponse = await axios.get('https://hexarate.paikama.co/api/rates/INR/USD/latest');
        if (inrToUsdResponse.data?.data?.mid) {
          const inrToUsd = inrToUsdResponse.data.data.mid;
          const usdToLkr = conversionRates.usdToLkr || 309.45;
          const inrToLkr = (1 / inrToUsd) * usdToLkr;
          setConversionRates(prev => ({
            ...prev,
            inrToLkr: inrToLkr
          }));
        }
      } catch (error) {
        console.log('Using default conversion rates');
      } finally {
        setRatesLoading(false);
      }
    };

    fetchConversionRates();
  }, []);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (!forceRefresh && dataCache.current.user && dataCache.current.wallet && 
          (now - dataCache.current.timestamp) < fiveMinutes) {
        setUserData({
          id: dataCache.current.user.id,
          full_name: dataCache.current.user.name || 'User',
          email: dataCache.current.user.email || '',
          phone: dataCache.current.user.phone || '',
          whatsapp: dataCache.current.user.whatsapp || '',
          profile_picture: dataCache.current.user.profilePicture || null,
          available_balance: dataCache.current.wallet?.available_balance || '0.00',
          spent_balance: dataCache.current.wallet?.spent_balance || '0.00',
          total_history_balance: dataCache.current.wallet?.total_history_balance || '0.00'
        });
        setLoading(false);
        return;
      }

      setLoading(true);

      const user = await authService.getCurrentUser();
      
      if (user) {
        const [profileResponse, walletResponse] = await Promise.allSettled([
          axios.get('/api/user/profiles', { withCredentials: true }),
          axios.get('/api/wallet/details', { withCredentials: true })
        ]);

        let profilePicture = user.profilePicture;
        let walletData = null;

        if (profileResponse.status === 'fulfilled' && profileResponse.value.data.success) {
          const profileUser = profileResponse.value.data.user;
          profilePicture = profileUser.profile_picture || profilePicture;
          
          if (profileUser.currency) {
            const currencyValue = mapBackendCurrency(profileUser.currency);
            setUserCurrency(currencyValue);
            localStorage.setItem('preferred_currency', currencyValue);
          }
        }

        if (walletResponse.status === 'fulfilled' && walletResponse.value.data.success) {
          walletData = walletResponse.value.data.wallet;
        }

        const newUserData = {
          id: user.id,
          full_name: user.name || 'User',
          email: user.email || '',
          phone: user.phone || '',
          whatsapp: user.whatsapp || '',
          profile_picture: profilePicture,
          available_balance: walletData?.available_balance || '0.00',
          spent_balance: walletData?.spent_balance || '0.00',
          total_history_balance: walletData?.total_history_balance || '0.00'
        };

        dataCache.current = {
          user,
          wallet: walletData,
          timestamp: Date.now()
        };

        setUserData(newUserData);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);


  useEffect(() => {
    const handleCurrencyUpdate = (event: CustomEvent) => {
      const { currency } = event.detail;
      setUserCurrency(currency);
      localStorage.setItem('preferred_currency', currency);
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate as EventListener);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate as EventListener);
    };
  }, []);


  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      fetchUserData();
    }
  }, [fetchUserData]);

 
  useEffect(() => {
    const handleFocus = () => {
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - dataCache.current.timestamp > fiveMinutes) {
        fetchUserData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUserData]);

  const getCurrencySymbol = () => {
    return currencySymbols[userCurrency] || '$';
  };

  const getConvertedBalance = () => {
    const balance = parseFloat(userData.available_balance);
    
    if (userCurrency === 'LKR') {
      return balance.toFixed(2);
    }
    
    if (userCurrency === 'USD') {
      const converted = balance / conversionRates.usdToLkr;
      return converted.toFixed(2);
    }
    
    if (userCurrency === 'INR') {
      const converted = balance / conversionRates.inrToLkr;
      return converted.toFixed(2);
    }
    
    return balance.toFixed(2);
  };

  const getFormattedBalance = () => {
    if (loading || ratesLoading) {
      return 'Loading...';
    }
    return `${getCurrencySymbol()} ${getConvertedBalance()}`;
  };

  const getInitials = (name: string) => {
    if (!name || name === 'User') return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number | null) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    if (!id) return colors[0];
    return colors[id % colors.length];
  };

  const navItems = [
    { name: 'Dashboard', icon: Layout, path: '/dashboard' },
    { name: 'Add funds', icon: PlusCircle, path: '/dashboard/add-funds' },
    { name: 'New order', icon: ShoppingCart, path: '/dashboard/new-order' },
    { name: 'Orders', icon: List, path: '/dashboard/orders' },
    { name: 'Tickets', icon: Ticket, path: '/dashboard/tickets' },
    { name: 'Api', icon: Cpu, path: '/dashboard/api' },
    { name: 'Child Pannel', icon: ShieldCheck, path: '/dashboard/child-panel' },
    { name: 'Refer and earn', icon: Users, path: '/dashboard/lucky-spin' },
    { name: 'Terms', icon: BookOpen, path: '/dashboard/terms' },
    { name: 'Daily updates', icon: RefreshCw, path: '/dashboard/updates' },
    { name: 'Transfer funds', icon: Send, path: '/dashboard/transfer' },
    { name: 'Blogs', icon: BookOpen, path: '/dashboard/blogs' },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading && !dataCache.current.user) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white font-sans selection:bg-brand overflow-hidden flex flex-col">
      
      {/* --- HEADER --- */}
      <div className="flex-none z-[100] px-4 md:px-8 py-4">
        <header className="max-w-[1600px] mx-auto glass border border-white/10 rounded-[2rem] px-6 py-3 flex justify-between items-center shadow-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-4">
        
            <img 
              src={siteLogo ? getImageUrl(siteLogo) : "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png"}
              className="h-9 md:h-11 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" 
              alt="Logo"
              onClick={() => navigate('/')}
              onError={(e) => {
                e.currentTarget.src = "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png";
              }}
            />
            <div className="hidden lg:block h-6 w-[1px] bg-white/10 mx-2" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.3em] text-brand">{t('Secure Portal')}</span>
          </div>
          
          <div className="flex items-center space-x-3">
           
            <div 
              onClick={() => navigate('/dashboard/add-funds')} 
              className="hidden sm:flex glass border border-brand/20 px-4 py-2 rounded-2xl items-center space-x-3 group hover:border-brand/50 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black text-white">
                {loading || ratesLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  getFormattedBalance()
                )}
              </span>
              {!loading && !ratesLoading && (
                <span className="text-[8px] text-gray-500 uppercase ml-1">
                  {userCurrency}
                </span>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative hidden md:block" ref={languageDropdownRef}>
              <div className="relative group">
                <button className="flex items-center space-x-1 text-sm font-semibold hover:text-brand transition-colors p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  <span className="uppercase">{language}</span>
                </button>
                <div className="absolute top-full mt-2 right-0 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[200] min-w-[120px]">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/5 cursor-pointer ${language === 'en' ? 'text-brand font-bold' : 'text-white'} break-words`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLanguage('si')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/5 cursor-pointer ${language === 'si' ? 'text-brand font-bold' : 'text-white'} break-words`}
                  >
                    සිංහල (Sinhala)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
              <div className="hidden md:block text-right leading-none">
                <div className="text-[11px] font-black mb-0.5">
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    userData.full_name
                  )}
                </div>
                <div className="text-[8px] font-bold text-brand uppercase tracking-widest">Premium</div>
              </div>
              
              {/* Profile Picture / Avatar */}
              <div 
                onClick={() => navigate('/dashboard/profile')} 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 p-[1.5px] cursor-pointer shadow-lg shadow-brand/10 hover:scale-105 transition-all"
                title="Go to Profile"
              >
                <div className="w-full h-full rounded-[10px] bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                  {loading ? (
                    <div className="w-full h-full animate-pulse bg-gray-800 rounded-[10px]" />
                  ) : userData.profile_picture ? (
                    <img 
                      src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `https://mmtsmmpanel.cyberservice.online${userData.profile_picture}`}
                      alt={userData.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs font-bold text-white ${getAvatarColor(userData.id)} w-full h-full flex items-center justify-center">${getInitials(userData.full_name)}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className={`text-xs font-bold text-white ${getAvatarColor(userData.id)} w-full h-full flex items-center justify-center`}>
                      {getInitials(userData.full_name)}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="lg:hidden p-2.5 bg-white/5 hover:bg-brand/20 rounded-xl transition-all border border-white/5"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-brand" /> : <Menu className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
        </header>
      </div>

    
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] lg:hidden" 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="fixed inset-y-4 right-4 w-[300px] glass z-[120] lg:hidden border border-white/10 rounded-[2.5rem] p-6 flex flex-col"
            >
              
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

             
              <div className="mb-4 flex justify-center">
                <img 
                  src={siteLogo ? getImageUrl(siteLogo) : "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png"}
                  className="h-12 w-auto object-contain" 
                  alt="Logo"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png";
                  }}
                />
              </div>

              {/* Mobile Language Selector */}
              <div className="mb-4 p-3 glass rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-2">{t('Language')}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                      language === 'en' 
                        ? 'border-brand text-brand bg-brand/10' 
                        : 'border-white/10 hover:bg-white/5 text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => { setLanguage('si'); setIsMobileMenuOpen(false); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                      language === 'si' 
                        ? 'border-brand text-brand bg-brand/10' 
                        : 'border-white/10 hover:bg-white/5 text-white'
                    }`}
                  >
                    SI
                  </button>
                </div>
              </div>

         
              <div 
                onClick={() => {
                  navigate('/dashboard/profile');
                  setIsMobileMenuOpen(false);
                }}
                className="mb-6 p-4 glass rounded-2xl border border-white/5 hover:border-brand/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  {userData.profile_picture ? (
                    <img 
                      src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `https://mmtsmmpanel.cyberservice.online${userData.profile_picture}`}
                      alt={userData.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(userData.id)}">${getInitials(userData.full_name)}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(userData.id)} group-hover:scale-105 transition-transform`}>
                      {getInitials(userData.full_name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-sm group-hover:text-brand transition-colors">{userData.full_name}</div>
                    <div className="text-xs text-gray-400">{userData.email}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Balance:</span>
                    <span className="font-bold text-brand">
                      {loading || ratesLoading ? '...' : getFormattedBalance()}
                    </span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                {navItems.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }} 
                    className={`w-full flex items-center justify-between p-4 rounded-2xl glass border group ${location.pathname === item.path ? 'border-brand bg-brand/10' : 'border-white/5 hover:border-brand/30'}`}
                  >
                    <div className="flex items-center space-x-4">
                      <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-brand' : 'text-gray-500 group-hover:text-brand'}`} />
                      <span className="text-sm font-bold">{t(item.name)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                ))}
              </nav>

              <button 
                onClick={handleLogout}
                className="mt-4 w-full flex items-center space-x-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('Logout')}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

  
      <div className="flex flex-1 overflow-hidden max-w-[1600px] mx-auto w-full px-4 md:px-8 gap-10">
        
        <aside className="hidden lg:block w-72 h-full py-4 overflow-y-auto scrollbar-hide flex-none">
          <div className="space-y-2 pb-10">
            {navItems.map((item, i) => (
              <motion.button 
                key={i}
                whileHover={{ x: 5 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-black transition-all group border ${
                  location.pathname === item.path 
                    ? 'bg-brand text-white border-brand shadow-xl shadow-brand/20' 
                    : 'glass border-white/5 hover:border-brand/30 hover:bg-white/5 text-gray-500 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'group-hover:text-brand transition-colors'}`} />
                <span className="text-[11px] uppercase tracking-[0.2em]">{t(item.name)}</span>
              </motion.button>
            ))}
          </div>
        </aside>

        <main className="flex-1 h-full overflow-y-auto py-4 scrollbar-hide">
          <div className="pb-20">
            <Outlet context={{ userData, userCurrency, refreshData: () => fetchUserData(true) }} />
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}



