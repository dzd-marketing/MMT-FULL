import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '../../hooks/useTranslation';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Wallet, CreditCard, Layers, Clock, CheckCircle, 
  AlertCircle, Play, Loader, Ban, ExternalLink,
  Search, ArrowRight, ShoppingCart
} from 'lucide-react';

// Currency symbols
const currencySymbols = {
  USD: '$ ',
  LKR: 'LKR ',
  INR: '₹ '
};

// Helper function to map backend currency to frontend
const mapBackendCurrency = (backendCurrency: string): 'USD' | 'LKR' | 'INR' => {
  if (backendCurrency === 'USD' || backendCurrency === 'LKR' || backendCurrency === 'INR') {
    return backendCurrency;
  }
  const currencyMap = {
    '1': 'USD',
    '2': 'LKR',
    '3': 'INR'
  };
  return (currencyMap[backendCurrency as keyof typeof currencyMap] || 'LKR') as 'USD' | 'LKR' | 'INR';
};

interface RecentOrder {
  order_id: number;
  api_orderid: number;
  service_name: string;
  order_charge: number;
  order_status: string;
  order_date: string;
  order_url: string;
}

export default function DashboardHomeView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // DashboardLayout එකෙන් එන userData (මූලික user තොරතුරු)
  const { userData: layoutUserData } = useOutletContext<{ userData: any }>();
  
  // Local state for wallet and stats
  const [walletData, setWalletData] = useState({
    available_balance: '0.00',
    spent_balance: '0.00',
    total_history_balance: '0.00'
  });
  
  const [totalOrders, setTotalOrders] = useState('0');
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [userCurrency, setUserCurrency] = useState<'USD' | 'LKR' | 'INR'>('LKR');
  const [conversionRates, setConversionRates] = useState({
    usdToLkr: 309.45,
    inrToLkr: 3.37
  });

  // Fetch conversion rates
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

  // Fetch user currency from profile
  const fetchUserCurrency = async () => {
    try {
      const profileResponse = await axios.get('/api/user/profiles', { withCredentials: true });
      if (profileResponse.data.success) {
        const profileUser = profileResponse.data.user;
        if (profileUser.currency) {
          const currencyValue = mapBackendCurrency(profileUser.currency);
          setUserCurrency(currencyValue);
          localStorage.setItem('preferred_currency', currencyValue);
        }
      }
    } catch (error) {
      console.log('Could not fetch currency from profile, using default');
    }
  };

// Fetch total orders count
const fetchTotalOrders = async () => {
  try {
    // Get ALL orders count (no limit)
    const response = await axios.get('/api/orders/my-orders?limit=1000&page=1', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.data.success) {
      setTotalOrders(response.data.pagination.total.toString());
    }
  } catch (error) {
    console.error('Error fetching total orders:', error);
    // Fallback to demo data
    setTotalOrders('24');
  }
};

  // Fetch recent orders (last 5)
  const fetchRecentOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await axios.get('/api/orders/my-orders?limit=5&page=1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setRecentOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user currency
        await fetchUserCurrency();
        
        // 1. Wallet details
        const walletResponse = await axios.get('/api/wallet/details');
        if (walletResponse.data.success) {
          setWalletData({
            available_balance: walletResponse.data.wallet.available_balance || '0.00',
            spent_balance: walletResponse.data.wallet.spent_balance || '0.00',
            total_history_balance: walletResponse.data.wallet.total_history_balance || '0.00'
          });
        }
        
        // 2. Total orders count
        await fetchTotalOrders();
        
        // 3. Recent orders
        await fetchRecentOrders();
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setWalletData({
          available_balance: '0.00',
          spent_balance: '0.00',
          total_history_balance: '0.00'
        });
        setTotalOrders('0');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Listen for currency updates from profile
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

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currencySymbols[userCurrency] || 'LKR ';
  };

  // Get converted balance based on user currency
  const getConvertedBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    
    if (userCurrency === 'LKR') {
      return numBalance.toFixed(2);
    }
    
    if (userCurrency === 'USD') {
      const converted = numBalance / conversionRates.usdToLkr;
      return converted.toFixed(2);
    }
    
    if (userCurrency === 'INR') {
      const converted = numBalance / conversionRates.inrToLkr;
      return converted.toFixed(2);
    }
    
    return numBalance.toFixed(2);
  };

  // Format balance with currency symbol
  const formatBalance = (balance: string) => {
    return `${getCurrencySymbol()}${getConvertedBalance(balance)}`;
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing':
        return <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full"><Loader className="w-3 h-3" /> Processing</span>;
      case 'inprogress':
        return <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full"><Play className="w-3 h-3" /> In Progress</span>;
      case 'partial':
        return <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Partial</span>;
      case 'canceled':
        return <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full"><Ban className="w-3 h-3" /> Canceled</span>;
      default:
        return <span className="text-xs text-gray-400 bg-gray-500/20 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency for orders
  const formatOrderCurrency = (amount: number) => {
    return `Rs ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="relative glass rounded-[3rem] p-8 md:p-14 overflow-hidden border border-black/5 dark:border-white/10 group shadow-inner bg-white/50 dark:bg-black/20 transition-colors">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/10 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-brand/20 transition-all duration-1000" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/20">
            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            <span>{t('Account Overview')}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-gray-900 dark:text-white">
            {t('Welcome back')}, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">
              {layoutUserData?.full_name || layoutUserData?.name || 'User'}
            </span> 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg text-sm md:text-base leading-relaxed opacity-80">
            {t('Everything is running smoothly. Your campaigns are seeing a 24% increase in engagement this week.')}
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { 
            label: 'Available Balance', 
            value: loading || ratesLoading ? '...' : formatBalance(walletData.available_balance), 
            icon: Wallet, 
            color: 'text-brand', 
            bg: 'bg-brand/10' 
          },
          { 
            label: 'Spent Balance', 
            value: loading || ratesLoading ? '...' : formatBalance(walletData.spent_balance), 
            icon: CreditCard, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10' 
          },
          { 
            label: 'Total Orders', 
            value: loading ? '...' : totalOrders, 
            icon: Layers, 
            color: 'text-orange-500', 
            bg: 'bg-orange-500/10' 
          }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8 }}
            className="glass p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-brand/30 transition-all bg-white/50 dark:bg-black/20"
          >
            <div className="space-y-2">
              <div className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[0.2em]">{t(stat.label)}</div>
              <div className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white group-hover:text-brand dark:group-hover:text-white transition-colors">
                {stat.value}
              </div>
              {stat.label !== 'Total Orders' && !loading && !ratesLoading && (
                <div className="text-[8px] text-gray-500 uppercase tracking-wider">
                  {userCurrency}
                </div>
              )}
            </div>
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-all shadow-lg shadow-black/5 dark:shadow-black/20`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <section className="glass rounded-[3rem] p-2 shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden group bg-white/50 dark:bg-black/20">
        <div className="bg-gray-50/50 dark:bg-[#0f0f0f]/50 rounded-[2.8rem] p-8 md:p-12 border border-black/5 dark:border-white/5 shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                {t('Recent Orders')}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm font-medium">
                {t('Your latest order activity')}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/orders')}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand dark:hover:bg-brand hover:text-white transition-all shadow-xl shadow-black/5 dark:shadow-white/5 flex items-center gap-2"
            >
              <span>{t('View All Orders')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recent Orders List */}
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">No orders yet</h4>
              <p className="text-gray-400 text-sm mb-4">Place your first order to get started</p>
              <button
                onClick={() => navigate('/dashboard/new-order')}
                className="px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors inline-flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Create New Order</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-brand/30 transition-all cursor-pointer"
                  onClick={() => navigate('/dashboard/orders')}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-brand font-bold">
                          #{order.api_orderid || order.order_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(order.order_date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2 line-clamp-1">
                        {order.service_name}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-brand">
                          {formatOrderCurrency(order.order_charge)}
                        </span>
                        {getStatusBadge(order.order_status)}
                      </div>
                    </div>
                    <a
                      href={order.order_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline flex items-center gap-1 text-sm shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="hidden md:inline">View Link</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}

              {/* View All Link */}
              <div className="text-center pt-4">
                <button
                  onClick={() => navigate('/dashboard/orders')}
                  className="text-brand hover:underline text-sm font-medium inline-flex items-center gap-1"
                >
                  <span>View all {totalOrders} orders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create New Order Section */}
      <section className="glass rounded-[3rem] p-2 shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden group bg-white/50 dark:bg-black/20">
        <div className="bg-gray-50/50 dark:bg-[#0f0f0f]/50 rounded-[2.8rem] p-8 md:p-12 border border-black/5 dark:border-white/5 shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                {t('Create New Order')}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm font-medium max-w-lg">
                {t('Boost your presence across all major social platforms with our premium services.')}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/new-order')}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand dark:hover:bg-brand hover:text-white transition-all shadow-xl shadow-black/5 dark:shadow-white/5 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('Browse Services')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}