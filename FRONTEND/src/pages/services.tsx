import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  AlertCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  X,
  Loader as LoaderIcon,
  Check,
  DollarSign,
  IndianRupee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen2 from '../components/LoadingScreen2';

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  min: number;
  max: number;
  package: string;
  refill: 'true' | 'false';
  cancel: '1' | '2';
  category: string;
  speed: string;
  avg_time: string;
  avg_days: number;
  avg_hours: number;
  avg_minutes: number;
}

interface Category {
  id: string;
  name: string;
}

interface ExchangeRateData {
  rate: number;
  timestamp: string;
}

const TableSkeletonRows = ({ count = 5 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-b border-zinc-100 dark:border-zinc-900">
          <td className="py-4 px-2">
            <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-2">
            <div className="space-y-2">
              <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
          </td>
          <td className="py-4 px-2">
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-2">
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-2">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-2">
            <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </td>
        </tr>
      ))}
    </>
  );
};

const MobileCardSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`mobile-skeleton-${index}`} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 w-full">
          <div className="flex justify-between items-start mb-3">
            <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
          </div>
          <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-3"></div>
          <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        </div>
      ))}
    </>
  );
};

const Services: React.FC = () => {
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Service[]>([]);
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'min' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Currency states
  const [currency, setCurrency] = useState<'LKR' | 'USD' | 'INR'>('LKR');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState('');
  
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const SERVICES_PER_PAGE = 30;

 const API_URL = import.meta.env.VITE_API_URL;
  const CACHE_KEY = 'services_cache';
  const CACHE_TIMESTAMP_KEY = 'services_cache_timestamp';
  const RATE_CACHE_KEY = 'exchange_rate_cache';
  const RATE_TIMESTAMP_KEY = 'exchange_rate_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  const categories: Category[] = [
    { id: 'all', name: 'All Services' },
    { id: 'tiktok', name: 'TikTok Services' },
    { id: 'instagram', name: 'Instagram Services' },
    { id: 'youtube', name: 'YouTube Services' },
    { id: 'facebook', name: 'Facebook Services' },
    { id: 'twitter', name: 'Twitter Services' },
    { id: 'whatsapp', name: 'WhatsApp Services' },
    { id: 'telegram', name: 'Telegram Services' }
  ];

  const sortOptions = [
    { id: 'name', name: 'Sort by Name' },
    { id: 'price', name: 'Sort by Price' },
    { id: 'min', name: 'Sort by Min Order' }
  ];

  const currencyOptions = [
    { id: 'LKR', label: 'LKR (Rs)', symbol: 'Rs' },
    { id: 'USD', label: 'USD ($)', symbol: '$', icon: DollarSign },
    { id: 'INR', label: 'INR (₹)', symbol: '₹', icon: IndianRupee }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadServices();
    loadExchangeRate();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, selectedCategory, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
    updateDisplayedServices(filteredServices, 1);
  }, [filteredServices, currency, exchangeRate]); // Re-render when currency changes

  const loadExchangeRate = async () => {
    // Check cache first
    const cachedRate = localStorage.getItem(RATE_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(RATE_TIMESTAMP_KEY);
    
    if (cachedRate && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      if (now - timestamp < RATE_CACHE_DURATION) {
        setExchangeRate(JSON.parse(cachedRate));
        return;
      }
    }
    
    // Fetch new rate
    setLoadingRate(true);
    try {
      const response = await fetch('https://hexarate.paikama.co/api/rates/USD/LKR/latest');
      const data = await response.json();
      
      if (data.status_code === 200) {
        const rateData = {
          rate: data.data.mid,
          timestamp: data.data.timestamp
        };
        
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(rateData));
        localStorage.setItem(RATE_TIMESTAMP_KEY, Date.now().toString());
        
        setExchangeRate(rateData);
        setRateError('');
      } else {
        setRateError('Failed to fetch exchange rate');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setRateError('Network error fetching rate');
    } finally {
      setLoadingRate(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          const parsedServices = JSON.parse(cachedData);
          setServices(parsedServices);
          setFilteredServices(parsedServices);
          updateDisplayedServices(parsedServices, 1);
          setLoading(false);
          setInitialLoad(false);
          return;
        }
      }
      
      await fetchServicesFromAPI();
      
    } catch (err) {
      console.error('Error loading services:', err);
      await fetchServicesFromAPI();
    }
  };

  const fetchServicesFromAPI = async () => {
    try {
      const response = await fetch(`${API_URL}/services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const sortedServices = data.services.sort((a: Service, b: Service) => a.id - b.id);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(sortedServices));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        
        setServices(sortedServices);
        setFilteredServices(sortedServices);
        updateDisplayedServices(sortedServices, 1);
      } else {
        setError('Failed to load services');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const updateDisplayedServices = (services: Service[], page: number) => {
    const start = 0;
    const end = page * SERVICES_PER_PAGE;
    const sliced = services.slice(start, end);
    setDisplayedServices(sliced);
    setHasMore(end < services.length);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    requestAnimationFrame(() => {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      updateDisplayedServices(filteredServices, nextPage);
      setTimeout(() => setLoadingMore(false), 300);
    });
  };

  const filterServices = () => {
    let filtered = [...services];

    if (selectedCategory !== 'all') {
      const categoryLower = selectedCategory.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(categoryLower) ||
        (s.category && s.category.toLowerCase().includes(categoryLower))
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price': {
          const priceA = parseFloat(a.price);
          const priceB = parseFloat(b.price);
          comparison = priceA - priceB;
          break;
        }
        case 'min':
          comparison = a.min - b.min;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredServices(filtered);
  };

  const getSpeedLabel = (speed: string) => {
    const speeds: Record<string, string> = {
      '1': 'Instant',
      '2': 'Fast',
      '3': 'Medium',
      '4': 'Slow'
    };
    return speeds[speed] || 'Standard';
  };

  const getAverageTime = (service: Service) => {
    if (service.avg_days || service.avg_hours || service.avg_minutes) {
      const parts = [];
      if (service.avg_days) parts.push(`${service.avg_days}d`);
      if (service.avg_hours) parts.push(`${service.avg_hours}h`);
      if (service.avg_minutes) parts.push(`${service.avg_minutes}m`);
      return parts.join(' ') || 'Instant';
    }
    return service.avg_time || 'Not enough data';
  };

  const formatPrice = (price: string) => {
    const cleanPrice = price.replace(/,/g, '');
    const num = parseFloat(cleanPrice);
    
    if (isNaN(num)) return '0.00';
    
    // Convert currency if needed
    if (currency === 'USD' && exchangeRate) {
      const usdPrice = num / exchangeRate.rate;
      return usdPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3
      });
    }
    
    if (currency === 'INR' && exchangeRate) {
      // First convert LKR to USD, then USD to INR (approximate)
      // Using approximate rate: 1 USD ≈ 85 INR
      const usdPrice = num / exchangeRate.rate;
      const inrPrice = usdPrice * 85; // Approximate USD to INR rate
      return inrPrice.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3
      });
    }
    
    // LKR - format with Sri Lankan style
    return num.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    });
  };

  const getCurrencySymbol = () => {
    const option = currencyOptions.find(opt => opt.id === currency);
    return option?.symbol || 'Rs';
  };

  const formatMaxValue = (max: number) => {
    if (max === 10000000 || max === 2147483647) return '∞';
    return max ? max.toLocaleString() : 'Unlimited';
  };

  const handleOrderNow = (service: Service) => {
    // Navigate to order page with service data
    navigate('/dashboard/new-order', { 
      state: { 
        service: {
          id: service.id,
          name: service.name,
          price: service.price,
          min: service.min,
          max: service.max,
          currency: currency
        }
      } 
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategoryDropdownOpen(false);
  };

  const handleSortSelect = (sortId: 'price' | 'min' | 'name') => {
    setSortBy(sortId);
    setSortDropdownOpen(false);
  };

  const handleCurrencySelect = (selectedCurrency: 'LKR' | 'USD' | 'INR') => {
    setCurrency(selectedCurrency);
    setCurrencyDropdownOpen(false);
  };

  const handleRefresh = () => {
    setLoading(true);
    setInitialLoad(true);
    fetchServicesFromAPI();
    loadExchangeRate(); // Refresh rate too
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center">
        <LoadingScreen2 />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center"
      >
        <div className="text-center max-w-md p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white dark:bg-[#050505] pt-28 pb-12"
      style={{ 
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white mb-3">
              Our <span className="text-brand">Services</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto md:mx-0">
              Choose from our wide range of high-quality SMM services at competitive prices
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-center md:self-auto">
            {/* Currency Selector */}
            <div className="relative" ref={currencyDropdownRef}>
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                disabled={loadingRate || !exchangeRate}
                className="px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-zinc-200 dark:border-zinc-800 flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                <span className="font-medium">{getCurrencySymbol()}</span>
                <span>{currency}</span>
                {loadingRate && <LoaderIcon className="w-3 h-3 animate-spin" />}
                <ChevronDown className={`w-4 h-4 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
                  {currencyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleCurrencySelect(option.id as 'LKR' | 'USD' | 'INR')}
                        className={`w-full px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between text-sm ${
                          currency === option.id ? 'bg-brand/10 text-brand' : 'text-gray-900 dark:text-white'
                        }`}
                        disabled={option.id !== 'LKR' && (!exchangeRate || loadingRate)}
                      >
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{option.label}</span>
                        </div>
                        {currency === option.id && (
                          <Check className="w-4 h-4 text-brand" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </motion.div>

        {(rateError && currency !== 'LKR') && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-600 dark:text-yellow-400"
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {rateError}. Showing prices in LKR.
          </motion.div>
        )}

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col gap-3"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none border-zinc-200 dark:border-zinc-800 text-sm"
            />
          </div>

          <div className="flex gap-2 w-full">
            <div className="relative flex-1 min-w-0" ref={categoryDropdownRef}>
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full px-3 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center justify-between gap-1 text-sm"
              >
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate flex-1 text-left">
                  {categories.find(c => c.id === selectedCategory)?.name || 'All'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between text-sm ${
                        selectedCategory === category.id ? 'bg-brand/10 text-brand' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      <span className="truncate">{category.name}</span>
                      {selectedCategory === category.id && (
                        <Check className="w-4 h-4 text-brand flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative w-[130px]" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="w-full px-3 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center justify-between gap-1 text-sm"
              >
                <span className="truncate">
                  {sortOptions.find(o => o.id === sortBy)?.name.replace('Sort by ', '') || 'Name'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSortSelect(option.id as 'price' | 'min' | 'name')}
                      className={`w-full px-3 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between text-sm ${
                        sortBy === option.id ? 'bg-brand/10 text-brand' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      <span>{option.name.replace('Sort by ', '')}</span>
                      {sortBy === option.id && (
                        <Check className="w-4 h-4 text-brand flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-12 h-12 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0"
            >
              <span className="text-lg font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            </button>
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 mb-4"
        >
          Showing {displayedServices.length} of {filteredServices.length} services
          {currency !== 'LKR' && exchangeRate && (
            <span className="ml-2 text-xs text-gray-400">
              (1 USD = {exchangeRate.rate.toFixed(3)} LKR)
            </span>
          )}
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full overflow-hidden relative min-h-[400px]"
        >
          {loadingMore && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center">
              <LoadingScreen2 />
            </div>
          )}
          
          <div className="w-full">
            <table className="w-full table-auto">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[5%]">ID</th>
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[45%]">Service Name</th>
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[10%]">Rate/1K</th>
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[12%]">Min/Max</th>
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[13%]">Avg Time</th>
                  <th className="py-4 px-2 text-left text-xs font-bold uppercase tracking-widest text-gray-500 w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedServices.map((service, index) => (
                  <motion.tr
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-brand/5 transition-colors"
                  >
                    <td className="py-4 px-2 align-top">
                      <span className="text-sm font-mono text-gray-500 whitespace-nowrap">{service.id}</span>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <div className="max-w-full">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowDetails(true);
                          }}
                          className="text-left hover:text-brand transition-colors w-full"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {service.name}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {service.refill === 'true' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full whitespace-nowrap">
                              Refill
                            </span>
                          )}
                          {service.cancel === '1' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full whitespace-nowrap">
                              Cancel
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <span className="text-sm font-bold text-brand whitespace-nowrap">
                        {getCurrencySymbol()} {formatPrice(service.price)}
                      </span>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {service.min || 0} / {formatMaxValue(service.max)}
                      </span>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <div className="flex items-center space-x-1 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getAverageTime(service)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <button
                        onClick={() => handleOrderNow(service)}
                        className="px-3 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors whitespace-nowrap"
                      >
                        Order
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="md:hidden space-y-4 w-full relative min-h-[400px]"
        >
          {loadingMore ? (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
              <LoadingScreen2 />
            </div>
          ) : (
            displayedServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all w-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-gray-400">#{service.id}</span>
                  <div className="flex gap-1 flex-wrap">
                    {service.refill === 'true' && (
                      <span className="text-[8px] font-bold px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                        Refill
                      </span>
                    )}
                    {service.cancel === '1' && (
                      <span className="text-[8px] font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                        Cancel
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedService(service);
                    setShowDetails(true);
                  }}
                  className="text-left mb-3 w-full"
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white hover:text-brand transition-colors break-words">
                    {service.name}
                  </h3>
                </button>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Rate/1K</p>
                    <p className="text-base font-bold text-brand break-words">
                      {getCurrencySymbol()} {formatPrice(service.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Min/Max</p>
                    <p className="text-sm text-gray-900 dark:text-white break-words">
                      {service.min || 0} / {formatMaxValue(service.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Avg Time</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {getAverageTime(service)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Speed</p>
                    <span className="text-sm text-gray-600 dark:text-gray-400 break-words">
                      {getSpeedLabel(service.speed)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOrderNow(service)}
                  className="w-full py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
                >
                  Order Now
                </button>
              </div>
            ))
          )}
        </motion.div>

        {hasMore && !loadingMore && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-brand hover:text-white hover:border-brand transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Load More Services</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {displayedServices.length === 0 && !loadingMore && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No services found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}

        {showDetails && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Service Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Service ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">#{selectedService.id}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Service Name</p>
                  <p className="text-sm text-gray-900 dark:text-white break-words">{selectedService.name}</p>
                </div>

                {selectedService.description && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{selectedService.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Price per 1K</p>
                    <p className="text-lg font-bold text-brand break-words">
                      {getCurrencySymbol()} {formatPrice(selectedService.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Min / Max</p>
                    <p className="text-sm text-gray-900 dark:text-white break-words">
                      {selectedService.min || 0} / {formatMaxValue(selectedService.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Average Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{getAverageTime(selectedService)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Speed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{getSpeedLabel(selectedService.speed)}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedService.refill === 'true' && (
                    <span className="text-xs font-bold px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                      Auto Refill Available
                    </span>
                  )}
                  {selectedService.cancel === '1' && (
                    <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                      Cancel Available
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleOrderNow(selectedService);
                    setShowDetails(false);
                  }}
                  className="w-full py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand/90 transition-colors mt-4"
                >
                  Order Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Services;
