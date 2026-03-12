import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Loader as LoaderIcon,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Music2,
  Send,
  MessageCircle,
  Linkedin,
  Globe,
  Wallet,
  CheckCircle,
  Repeat,
  DollarSign
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';
import axios from 'axios';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  profilePicture?: string;
  email_verified?: boolean;
  balance?: number;
  spent?: number;
}

interface WalletData {
  available_balance: string;
  spent_balance: string;
  total_history_balance: string;
}

interface Category {
  id: number;
  platform: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_description: string;
  service_price: string;
  service_min: number;
  service_max: number;
  service_package: string;
  service_dripfeed: '1' | '2';
  category_id: number;
  platform?: string;
  avg_time?: string;
}

interface SelectedService extends Service {
  calculated_charge: number;
}

type Currency = 'USD' | 'LKR' | 'INR';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  LKR: 'LKR ',
  INR: '₹'
};

const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [walletData, setWalletData] = useState<WalletData>({
    available_balance: '0.00',
    spent_balance: '0.00',
    total_history_balance: '0.00'
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // previewCurrency — display only, all internal charges stay in LKR
  const [previewCurrency, setPreviewCurrency] = useState<Currency>('LKR');
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const [conversionRates, setConversionRates] = useState({
    usdToLkr: 309.45,
    inrToLkr: 3.37
  });
  const [ratesLoading, setRatesLoading] = useState(true);

  // Form fields
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [charge, setCharge] = useState<number>(0); // always LKR
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Dripfeed
  const [dripfeedEnabled, setDripfeedEnabled] = useState(false);
  const [dripfeedRunsInput, setDripfeedRunsInput] = useState<string>('2');
  const [dripfeedIntervalInput, setDripfeedIntervalInput] = useState<string>('10');

  const dripfeedRuns = parseInt(dripfeedRunsInput) || 0;
  const dripfeedInterval = parseInt(dripfeedIntervalInput) || 0;
  const dripfeedTotalQuantity = quantity > 0 && dripfeedRuns > 0 ? quantity * dripfeedRuns : 0;

  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [showServiceInfo, setShowServiceInfo] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const mapBackendCurrency = (backendCurrency: string): Currency => {
    if (backendCurrency === 'USD' || backendCurrency === 'LKR' || backendCurrency === 'INR') return backendCurrency;
    const map: Record<string, Currency> = { '1': 'USD', '2': 'LKR', '3': 'INR' };
    return map[backendCurrency] || 'LKR';
  };

  // Fetch live rates from hexarate — INR/LKR direct endpoint
  useEffect(() => {
    const fetchConversionRates = async () => {
      setRatesLoading(true);
      try {
        const [usdRes, inrRes] = await Promise.all([
          axios.get('https://hexarate.paikama.co/api/rates/USD/LKR/latest'),
          axios.get('https://hexarate.paikama.co/api/rates/INR/LKR/latest')
        ]);
        setConversionRates({
          usdToLkr: usdRes.data?.data?.mid ?? 309.45,
          inrToLkr: inrRes.data?.data?.mid ?? 3.37
        });
      } catch {
        console.log('Using default conversion rates');
      } finally {
        setRatesLoading(false);
      }
    };
    fetchConversionRates();
  }, []);

  const fetchUserCurrency = async () => {
    try {
      const profileResponse = await axios.get('/api/user/profiles', { withCredentials: true });
      if (profileResponse.data.success) {
        const profileUser = profileResponse.data.user;
        if (profileUser.currency) {
          const currencyValue = mapBackendCurrency(profileUser.currency);
          setPreviewCurrency(currencyValue);
          localStorage.setItem('preferred_currency', currencyValue);
        }
      }
    } catch {
      console.log('Could not fetch currency from profile, using default');
    }
  };

  const fetchWalletData = async () => {
    try {
      const response = await axios.get('/api/wallet/details');
      if (response.data.success) {
        setWalletData({
          available_balance: response.data.wallet.available_balance || '0.00',
          spent_balance: response.data.wallet.spent_balance || '0.00',
          total_history_balance: response.data.wallet.total_history_balance || '0.00'
        });
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) navigate('/login', { state: { from: '/dashboard/new-order' } });
          return;
        }
        const userData = await authService.getCurrentUser();
        if (isMounted) {
          if (!userData) {
            navigate('/login', { state: { from: '/dashboard/new-order', message: 'Session expired' } });
            return;
          }
          setUser(userData);
          await fetchUserCurrency();
          await fetchWalletData();
        }
      } catch {
        if (isMounted) navigate('/login', { state: { from: '/dashboard/new-order', message: 'Session expired' } });
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    fetchUser();
    const handleAuthChange = () => {
      if (localStorage.getItem('token')) fetchUser();
      else { setUser(null); navigate('/login'); }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => { isMounted = false; window.removeEventListener('auth-change', handleAuthChange); };
  }, [navigate]);

  useEffect(() => {
    const handleCurrencyUpdate = (event: CustomEvent) => {
      const { currency } = event.detail;
      setPreviewCurrency(currency);
      localStorage.setItem('preferred_currency', currency);
    };
    window.addEventListener('currency-updated', handleCurrencyUpdate as EventListener);
    return () => window.removeEventListener('currency-updated', handleCurrencyUpdate as EventListener);
  }, []);

  useEffect(() => { if (!authLoading && user) loadData(); }, [authLoading, user]);

  useEffect(() => {
    if (selectedService && quantity) calculateCharge();
  }, [quantity, selectedService?.service_id, dripfeedEnabled, dripfeedRuns]);

  useEffect(() => {
    let filtered = [...services];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.platform?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.service_name.toLowerCase().includes(query) ||
        (s.service_description && s.service_description.toLowerCase().includes(query))
      );
    }
    setFilteredServices(filtered);
  }, [services, selectedCategory, searchQuery]);

  // ── Currency helpers ─────────────────────────────────────────────────────

  const getCurrencySymbol = () => currencySymbols[previewCurrency] || 'LKR ';

  const lkrToPreview = (lkr: number): number => {
    if (previewCurrency === 'LKR') return lkr;
    if (previewCurrency === 'USD') return lkr / conversionRates.usdToLkr;
    if (previewCurrency === 'INR') return lkr / conversionRates.inrToLkr;
    return lkr;
  };

  const formatAmount = (lkr: number) => {
    const val = lkrToPreview(lkr);
    const decimals = previewCurrency === 'USD' ? 4 : 2;
    return `${getCurrencySymbol()}${val.toFixed(decimals)}`;
  };

  const formatPricePerK = (price: string) => {
    const num = parseFloat(price.replace(/,/g, ''));
    return lkrToPreview(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── Platform helpers ─────────────────────────────────────────────────────

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      'tiktok': Music2, 'instagram': Instagram, 'youtube': Youtube,
      'facebook': Facebook, 'twitter': Twitter, 'telegram': Send,
      'whatsapp': MessageCircle, 'linkedin': Linkedin, 'other': Globe
    };
    return icons[platform.toLowerCase()] || Globe;
  };

  const getPlatformColor = (platform: string, isSelected: boolean) => {
    if (isSelected) return 'text-brand';
    const colors: Record<string, string> = {
      'tiktok': 'text-[#00f2ea]', 'instagram': 'text-[#E4405F]', 'youtube': 'text-[#FF0000]',
      'facebook': 'text-[#1877F2]', 'twitter': 'text-[#1DA1F2]', 'telegram': 'text-[#0088cc]',
      'whatsapp': 'text-[#25D366]', 'linkedin': 'text-[#0A66C2]', 'other': 'text-[#8B5CF6]'
    };
    return colors[platform.toLowerCase()] || 'text-gray-400';
  };

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const categoriesRes = await fetch(`${API_URL}/orders/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (categoriesRes.status === 401) { window.dispatchEvent(new Event('auth-change')); return; }
      const categoriesData = await categoriesRes.json();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      const servicesRes = await fetch(`${API_URL}/orders/services`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (servicesRes.status === 401) { window.dispatchEvent(new Event('auth-change')); return; }
      const servicesData = await servicesRes.json();
      if (servicesData.success) {
        setServices(servicesData.services);
      } else {
        setServices([]);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // charge always stored in LKR
  const calculateCharge = () => {
    if (!selectedService || !quantity) return;
    const pricePerUnit = parseFloat(selectedService.service_price) / 1000;
    const calculatedCharge = dripfeedEnabled && dripfeedRuns > 0
      ? pricePerUnit * quantity * dripfeedRuns
      : pricePerUnit * quantity;
    setCharge(calculatedCharge);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService({ ...service, calculated_charge: 0 });
    setServiceDropdownOpen(false);
    setQuantity(service.service_min || 0);
    setComments(''); setLink('');
    setFormErrors({});
    setShowServiceInfo(true);
    setCharge(0);
    setDripfeedEnabled(false);
    setDripfeedRunsInput('2');
    setDripfeedIntervalInput('10');
  };

  // FIX: when dripfeed is enabled, minimum per-run = ceil(service_min / runs)
  const effectiveMin = (service: SelectedService | null): number => {
    if (!service) return 0;
    if (dripfeedEnabled && dripfeedRuns >= 2) {
      return Math.ceil(service.service_min / dripfeedRuns);
    }
    return service.service_min;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setQuantity(value);
    if (selectedService) {
      const minAllowed = effectiveMin(selectedService);
      if (value < minAllowed) {
        setFormErrors({ ...formErrors, quantity: dripfeedEnabled
          ? `Min per run is ${minAllowed} (total: ${minAllowed * dripfeedRuns} ≥ service min ${selectedService.service_min})`
          : `Minimum quantity is ${selectedService.service_min}`
        });
      } else if (value > selectedService.service_max) {
        setFormErrors({ ...formErrors, quantity: `Maximum quantity is ${selectedService.service_max}` });
      } else {
        setFormErrors({ ...formErrors, quantity: '' });
      }
    }
  };

  const handleRunsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) setDripfeedRunsInput(raw);
  };
  const handleRunsBlur = () => { if ((parseInt(dripfeedRunsInput) || 0) < 2) setDripfeedRunsInput('2'); };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) setDripfeedIntervalInput(raw);
  };
  const handleIntervalBlur = () => { if ((parseInt(dripfeedIntervalInput) || 0) < 1) setDripfeedIntervalInput('1'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) { setFormErrors({ ...formErrors, service: 'Please select a service' }); return; }
    if (!link) { setFormErrors({ ...formErrors, link: 'Link is required' }); return; }

    const minAllowed = effectiveMin(selectedService);
    if (quantity < minAllowed || quantity > selectedService.service_max) {
      setFormErrors({ ...formErrors, quantity: `Quantity must be between ${minAllowed} and ${selectedService.service_max}` });
      return;
    }

    if (selectedService.service_package === '3' && !comments) {
      setFormErrors({ ...formErrors, comments: 'Comments are required for this service' }); return;
    }

    if (dripfeedEnabled) {
      if (dripfeedRuns < 2) { setFormErrors({ ...formErrors, dripfeed: 'Minimum 2 runs required' }); return; }
      if (dripfeedInterval < 1) { setFormErrors({ ...formErrors, dripfeed: 'Interval must be at least 1 minute' }); return; }
    }

    if (charge > parseFloat(walletData.available_balance)) {
      setFormErrors({ ...formErrors, submit: 'Insufficient balance. Please add funds.' }); return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const orderData: any = {
        service_id: selectedService.service_id,
        link,
        quantity,
        ...(selectedService.service_package === '3' && { comments: comments.split('\n').filter(c => c.trim()) })
      };

      if (dripfeedEnabled) {
        orderData.dripfeed = '2';
        orderData.dripfeed_runs = dripfeedRuns;
        orderData.dripfeed_interval = dripfeedInterval;
        orderData.dripfeed_quantity = quantity;
        orderData.dripfeed_totalquantity = dripfeedTotalQuantity;
      } else {
        orderData.dripfeed = '1';
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (result.success) {
        await fetchWalletData();
        setOrderSuccess(true);
        setTimeout(() => navigate(`/dashboard/orders/${result.order_id}`, {
          state: { success: true, message: 'Order placed successfully!' }
        }), 2000);
      } else {
        setFormErrors({ ...formErrors, submit: result.message || 'Failed to place order' });
      }
    } catch {
      setFormErrors({ ...formErrors, submit: 'Failed to place order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guards ───────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><LoadingScreen2 /></div>;
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md p-8 bg-red-500/10 rounded-3xl border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-4">{error}</p>
          <button onClick={loadData}
            className="px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors inline-flex items-center space-x-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /><span>Try Again</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const walletBalanceLkr = parseFloat(walletData.available_balance);
  const insufficientBalance = charge > 0 && charge > walletBalanceLkr;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto px-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
            New <span className="text-brand">Order</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Place your order quickly and easily. Select a service, provide the details, and we'll handle the rest.
          </p>
        </div>

        <div className="flex items-stretch gap-3">
          {/* Balance card */}
          <div className="glass border border-brand/20 rounded-2xl p-4 bg-gradient-to-br from-brand/10 to-purple-600/10">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-brand" />
              <div>
                <p className="text-xs text-gray-400">Available Balance</p>
                <p className="text-xl font-bold text-white">{formatAmount(walletBalanceLkr)}</p>
                {previewCurrency !== 'LKR' && (
                  <p className="text-xs text-gray-500">LKR {walletBalanceLkr.toFixed(2)} actual</p>
                )}
              </div>
            </div>
          </div>

          {/* Currency picker */}
          <div className="relative">
            <button type="button" onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="h-full px-4 glass border border-white/10 rounded-2xl text-white flex flex-col items-center justify-center gap-1 hover:border-brand/40 transition-all cursor-pointer min-w-[72px]">
              <DollarSign className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-white">{previewCurrency}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-44">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-medium text-gray-400">Preview currency</p>
                  <p className="text-xs text-gray-600">Charges always in LKR</p>
                </div>
                {(['LKR', 'USD', 'INR'] as Currency[]).map(c => (
                  <button key={c} type="button"
                    onClick={() => { setPreviewCurrency(c); setCurrencyDropdownOpen(false); localStorage.setItem('preferred_currency', c); }}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${previewCurrency === c ? 'text-brand' : 'text-white'}`}>
                    <div>
                      <span className="text-sm font-medium">{c}</span>
                      <span className="ml-2 text-xs text-gray-500">{currencySymbols[c]}</span>
                    </div>
                    {previewCurrency === c && <CheckCircle className="w-3.5 h-3.5 text-brand" />}
                  </button>
                ))}
                {!ratesLoading && (
                  <div className="px-3 py-2 border-t border-white/5 space-y-1">
                    <p className="text-xs text-gray-600">1 USD = LKR {conversionRates.usdToLkr.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">1 INR = LKR {conversionRates.inrToLkr.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        <button onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedCategory === 'all' ? 'border-brand bg-brand/20' : 'border-white/5 hover:border-brand/30 bg-white/5'}`}>
          <Globe className={`w-6 h-6 mx-auto mb-2 ${selectedCategory === 'all' ? 'text-brand' : 'text-[#3B82F6]'}`} />
          <p className={`text-xs font-medium text-center ${selectedCategory === 'all' ? 'text-brand' : 'text-gray-400'}`}>All Services</p>
        </button>

        {categories.map((cat) => {
          const IconComponent = getPlatformIcon(cat.platform);
          const isSelected = selectedCategory === cat.platform;
          return (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.platform)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-brand bg-brand/20' : 'border-white/5 hover:border-brand/30 bg-white/5'}`}>
              <IconComponent className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-brand' : getPlatformColor(cat.platform, isSelected)}`} />
              <p className={`text-xs font-medium text-center capitalize ${isSelected ? 'text-brand' : 'text-gray-400'}`}>{cat.platform}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search services by name or description..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
        </div>
      </div>

      {/* Order Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {orderSuccess ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h3>
            <p className="text-gray-400">Redirecting to order details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Select Service <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button type="button" onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                  className="w-full px-4 py-3 text-left bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none cursor-pointer flex items-center justify-between">
                  <span className="truncate">{selectedService ? selectedService.service_name : 'Choose a service...'}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${serviceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {serviceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {filteredServices.length > 0 ? filteredServices.map((service) => (
                      <button key={service.service_id} type="button" onClick={() => handleServiceSelect(service)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                        <p className="text-sm font-medium text-white">{service.service_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-brand font-bold">
                            {getCurrencySymbol()}{formatPricePerK(service.service_price)} /1K
                          </span>
                          <span className="text-xs text-gray-400">Min: {service.service_min} | Max: {service.service_max}</span>
                          {service.service_dripfeed === '2' && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Dripfeed</span>
                          )}
                        </div>
                      </button>
                    )) : (
                      <div className="px-4 py-8 text-center text-gray-400">No services found</div>
                    )}
                  </div>
                )}
              </div>
              {formErrors.service && <p className="mt-1 text-xs text-red-500">{formErrors.service}</p>}
            </div>

            {/* Service Info */}
            {showServiceInfo && selectedService && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl p-4 space-y-3 border border-brand/20">
                <div>
                  <h3 className="font-medium text-white">{selectedService.service_name}</h3>
                  {selectedService.service_description && (
                    <p className="text-sm text-gray-400 mt-1">{selectedService.service_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Avg Time: {selectedService.avg_time || 'Not enough data'}</span>
                  </div>
                  <div className="text-gray-400">Min: {selectedService.service_min} | Max: {selectedService.service_max}</div>
                </div>
              </motion.div>
            )}

            {/* Link */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Link <span className="text-red-500">*</span>
              </label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              {formErrors.link && <p className="mt-1 text-xs text-red-500">{formErrors.link}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Quantity <span className="text-red-500">*</span>
                {dripfeedEnabled && <span className="ml-2 text-xs font-normal text-gray-400">(per run)</span>}
              </label>
              <input type="number" value={quantity || ''} onChange={handleQuantityChange}
                placeholder="Enter quantity"
                min={effectiveMin(selectedService)}
                max={selectedService?.service_max || 0}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              {formErrors.quantity ? (
                <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>
              ) : selectedService ? (
                <p className="mt-1 text-xs text-gray-400">
                  {dripfeedEnabled && dripfeedRuns >= 2
                    ? `Min per run: ${effectiveMin(selectedService)} — total will be ${effectiveMin(selectedService) * dripfeedRuns}+ (service min: ${selectedService.service_min})`
                    : `Min: ${selectedService.service_min} — Max: ${selectedService.service_max}`
                  }
                </p>
              ) : null}
            </div>

            {/* Dripfeed */}
            {selectedService?.service_dripfeed === '2' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={dripfeedEnabled}
                    onChange={(e) => {
                      setDripfeedEnabled(e.target.checked);
                      setFormErrors({ ...formErrors, quantity: '' });
                    }}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand focus:ring-brand focus:ring-offset-0" />
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-brand" />
                    <span className="text-sm font-medium text-white">Drip-Feed Order</span>
                  </div>
                </label>

                {dripfeedEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pl-8 border-l-2 border-brand/30 ml-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Number of Runs <span className="text-gray-600">(min 2)</span>
                        </label>
                        <input type="text" inputMode="numeric" value={dripfeedRunsInput}
                          onChange={handleRunsChange} onBlur={handleRunsBlur} placeholder="e.g. 5"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Interval (minutes) <span className="text-gray-600">(min 1)</span>
                        </label>
                        <input type="text" inputMode="numeric" value={dripfeedIntervalInput}
                          onChange={handleIntervalChange} onBlur={handleIntervalBlur} placeholder="e.g. 60"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm" />
                      </div>
                    </div>

                    {quantity > 0 && dripfeedRuns >= 2 && dripfeedInterval >= 1 && (
                      <div className="bg-brand/10 border border-brand/20 rounded-lg p-4">
                        <p className="text-xs font-semibold text-brand mb-3">Drip-Feed Summary</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quantity per run:</span>
                            <span className="text-white font-medium">{quantity.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Runs:</span>
                            <span className="text-white font-medium">{dripfeedRuns}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Interval:</span>
                            <span className="text-white font-medium">{dripfeedInterval} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total to provider:</span>
                            <span className="text-brand font-bold">{dripfeedTotalQuantity.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                          Each run delivers <span className="text-white font-medium">{quantity.toLocaleString()}</span> every{' '}
                          <span className="text-white font-medium">{dripfeedInterval} min</span>, totalling{' '}
                          <span className="text-brand font-semibold">{dripfeedTotalQuantity.toLocaleString()}</span> across{' '}
                          <span className="text-white font-medium">{dripfeedRuns} runs</span>.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {formErrors.dripfeed && <p className="mt-1 text-xs text-red-500">{formErrors.dripfeed}</p>}
              </div>
            )}

            {/* Comments */}
            {selectedService?.service_package === '3' && (
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Comments <span className="text-red-500">*</span>
                </label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter each comment on a new line" rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
                <p className="mt-1 text-xs text-gray-400">Enter each comment on a new line</p>
                {formErrors.comments && <p className="mt-1 text-xs text-red-500">{formErrors.comments}</p>}
              </div>
            )}

            {/* Charge — multi-currency preview, actual always LKR */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                {dripfeedEnabled ? 'Total Charge (all runs)' : 'Charge'}
                {previewCurrency !== 'LKR' && (
                  <span className="ml-2 text-xs font-normal text-yellow-500/80">preview in {previewCurrency} — charged in LKR</span>
                )}
              </label>

              {/* 3-currency preview tiles */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['LKR', 'USD', 'INR'] as Currency[]).map(c => {
                  let converted = charge;
                  if (c === 'USD') converted = charge / conversionRates.usdToLkr;
                  if (c === 'INR') converted = charge / conversionRates.inrToLkr;
                  const isActive = previewCurrency === c;
                  return (
                    <button key={c} type="button"
                      onClick={() => { setPreviewCurrency(c); localStorage.setItem('preferred_currency', c); }}
                      className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${isActive ? 'border-brand/60 bg-brand/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                      <p className="text-xs text-gray-500 mb-1">{c}</p>
                      <p className={`text-sm font-bold ${isActive ? 'text-brand' : 'text-white'}`}>
                        {currencySymbols[c]}{converted > 0 ? converted.toFixed(c === 'USD' ? 4 : 2) : (c === 'USD' ? '0.0000' : '0.00')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <input type="text" value={`${getCurrencySymbol()}${lkrToPreview(charge).toFixed(previewCurrency === "USD" ? 4 : 2)}`}
                readOnly className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none cursor-not-allowed text-lg font-bold" />

              {previewCurrency !== 'LKR' && charge > 0 && (
                <p className="mt-1 text-xs text-gray-500">Actual charge: LKR {charge.toFixed(2)}</p>
              )}
              {dripfeedEnabled && charge > 0 && dripfeedRuns >= 2 && (
                <p className="mt-1 text-xs text-gray-400">
                  {formatAmount(charge / dripfeedRuns)} per run × {dripfeedRuns} runs
                </p>
              )}
              {insufficientBalance && (
                <p className="mt-1 text-xs text-red-400">
                  Insufficient balance. Please{' '}
                  <button type="button" onClick={() => navigate('/dashboard/add-funds')}
                    className="text-brand hover:underline cursor-pointer">add funds</button>
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit"
              disabled={submitting || insufficientBalance}
              className="w-full py-4 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  <span>Placing Order...</span>
                </div>
              ) : (
                dripfeedEnabled ? 'Place Drip-Feed Order' : 'Place New Order'
              )}
            </button>

            {formErrors.submit && <p className="text-sm text-red-500 text-center">{formErrors.submit}</p>}
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default NewOrder;
