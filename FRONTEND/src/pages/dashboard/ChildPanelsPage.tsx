import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  DollarSign, 
  User, 
  Lock, 
  Calendar,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader,
  Wallet,
  Plus,
  Eye,
  EyeOff,
  Mail,
  ChevronDown,
  Search
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';
import axios from 'axios';
import bcrypt from 'bcryptjs'; 

interface ChildPanel {
  id: number;
  domain: string;
  panel_currency: string;
  admin_username: string;
  status: 'active' | 'terminated' | 'suspended';
  renewal_date: string;
  created_on: string;
  charged_amount: number;
  panel_uqid: string;
}

const ChildPanelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [panels, setPanels] = useState<ChildPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  const [showForm, setShowForm] = useState(false);
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  
 
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

const API_URL = import.meta.env.VITE_API_URL;


  const currencies = [
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredCurrencies = currencies.filter(c => 
    c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0];

  const nameservers = {
    ns1: import.meta.env.VITE_NS1 || 'mmt.ns1.com',
    ns2: import.meta.env.VITE_NS2 || 'mmt.ns2.com'
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { state: { from: '/dashboard/child-panels' } });
          return;
        }

        const userData = await authService.getCurrentUser();
        if (!userData) {
          navigate('/login');
          return;
        }

        setUser(userData);
        loadPanels();
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.currency-dropdown')) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPanels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/child-panels`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setPanels(response.data.panels);
      }
    } catch (err) {
      console.error('Error loading panels:', err);
      setError('Failed to load child panels');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
    const errors: Record<string, string> = {};
    
    if (!domain) errors.domain = 'Domain is required';
    else if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)) {
      errors.domain = 'Enter a valid domain (e.g., example.com)';
    }
    
    if (!currency) errors.currency = 'Currency is required';
    if (!username) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      
      const response = await axios.post(`${API_URL}/child-panels`, {
        domain,
        panel_currency: currency,
        admin_username: username,
        admin_password: password 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        
        try {
          await axios.post(`${API_URL}/child-panels/send-email`, {
            domain,
            panel_currency: currency,
            admin_username: username,
            admin_password: password, 
            user_name: user?.name || 'User',
            user_email: user?.email || '',
            user_id: user?.id
          });
          console.log('Email notification sent to admin');
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr);
        
        }

        setSuccessMessage('Child panel created successfully! Admin has been notified.');
        setShowForm(false);
        setDomain('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        loadPanels();
        
       
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      setFormErrors({ 
        submit: err.response?.data?.message || 'Failed to create child panel' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (panelId: number) => {
    if (!confirm('Are you sure you want to renew this panel for another month?')) return;

    setRenewingId(panelId);
    
    try {
      const response = await axios.post(`${API_URL}/child-panels/${panelId}/renew`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
       
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        setPanels(prev => prev.map(panel => 
          panel.id === panelId 
            ? { ...panel, renewal_date: response.data.new_renewal_date, status: 'active' }
            : panel
        ));
        
        alert('Panel renewed successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to renew panel');
    } finally {
      setRenewingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' },
      terminated: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Terminated' },
      suspended: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Suspended' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.suspended;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <LoadingScreen2 />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto px-4 pb-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-2">
            Child <span className="text-brand">Panels</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            Purchase and manage your own reseller panels
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>New Child Panel</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 flex items-center space-x-2 text-sm md:text-base">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Order Form */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Order New Child Panel</h2>
          
          {/* Nameservers Info */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs md:text-sm text-gray-300 mb-2 md:mb-3">
              Before ordering, point your domain to our nameservers:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <div className="flex items-center space-x-2">
                <code className="px-2 md:px-3 py-1.5 md:py-2 bg-black/30 rounded-lg text-brand font-mono text-xs md:text-sm">
                  {nameservers.ns1}
                </code>
                <button
                  onClick={() => handleCopy(nameservers.ns1, 1)}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-brand transition-colors"
                >
                  {copiedId === 1 ? (
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <code className="px-2 md:px-3 py-1.5 md:py-2 bg-black/30 rounded-lg text-brand font-mono text-xs md:text-sm">
                  {nameservers.ns2}
                </code>
                <button
                  onClick={() => handleCopy(nameservers.ns2, 2)}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-brand transition-colors"
                >
                  {copiedId === 2 ? (
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* Domain */}
              <div className="md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="example.com"
                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm md:text-base"
                  />
                </div>
                {formErrors.domain && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.domain}</p>
                )}
              </div>

              {/* Currency - Styled Dropdown - FIXED DOUBLE FLAG */}
              <div className="currency-dropdown md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Panel Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                    className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-left focus:ring-2 focus:ring-brand focus:border-transparent outline-none flex items-center justify-between text-sm md:text-base"
                  >
                    <span className="flex items-center space-x-2">
                      <span>{selectedCurrency.flag}</span>
                      <span>{selectedCurrency.name} ({selectedCurrency.code})</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isCurrencyDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={currencySearch}
                            onChange={(e) => setCurrencySearch(e.target.value)}
                            placeholder="Search currency..."
                            className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-brand outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Currency List */}
                      <div className="overflow-y-auto max-h-60">
                        {filteredCurrencies.length > 0 ? (
                          filteredCurrencies.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCurrency(c.code);
                                setIsCurrencyDropdownOpen(false);
                                setCurrencySearch('');
                              }}
                              className={`w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-between ${
                                currency === c.code ? 'bg-brand/20 text-brand' : 'text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span>{c.flag}</span>
                                <div>
                                  <span className="text-sm font-medium">{c.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">({c.code})</span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">{c.symbol}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">
                            No currencies found
                          </div>
                        )}
                      </div>

                      {/* Results Count */}
                      <div className="p-2 border-t border-white/10 text-xs text-gray-500 text-center">
                        {filteredCurrencies.length} currencies found
                      </div>
                    </div>
                  )}
                </div>
                {formErrors.currency && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.currency}</p>
                )}
              </div>

              {/* Username */}
              <div className="md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Admin Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm md:text-base"
                  />
                </div>
                {formErrors.username && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>
                )}
              </div>

              {/* Password with Generate Button */}
              <div className="md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm md:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 md:px-4 py-2.5 md:py-3 bg-brand/20 hover:bg-brand/30 text-brand rounded-xl transition-colors"
                    title="Generate random password"
                  >
                    <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm md:text-base"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Price and Submit - FIXED MOBILE VIEW */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-2 md:space-x-3 w-full sm:w-auto justify-center sm:justify-start">
                <Wallet className="w-5 h-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Price per month</p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {selectedCurrency.symbol} {import.meta.env.VITE_CHILD_PANEL_PRICE || '100.00'}
                  </p>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2 text-sm md:text-base"
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Submit & Notify Admin</span>
                  </>
                )}
              </button>
            </div>

            {formErrors.submit && (
              <p className="text-sm text-red-500 text-center">{formErrors.submit}</p>
            )}
          </form>
        </motion.div>
      )}

      {/* Panels List - Responsive Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 md:py-20">
          <Loader className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 md:py-20">
          <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-sm md:text-base">{error}</p>
          <button
            onClick={loadPanels}
            className="mt-4 px-4 md:px-6 py-2 md:py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors text-sm md:text-base"
          >
            Try Again
          </button>
        </div>
      ) : panels.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-white mb-2">No child panels yet</h3>
          <p className="text-gray-400 text-xs md:text-sm px-4">
            Click "New Child Panel" to create your first reseller panel
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] md:min-w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">#</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Domain</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Currency</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Purchased On</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Renewal Date</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {panels.map((panel) => {
                  const isExpiringSoon = new Date(panel.renewal_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date(panel.renewal_date) < new Date();
                  const panelCurrency = currencies.find(c => c.code === panel.panel_currency) || { flag: '💱', symbol: '' };
                  
                  return (
                    <tr key={panel.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <span className="text-xs md:text-sm text-brand font-mono">#{panel.id}</span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs md:text-sm text-white truncate max-w-[100px] md:max-w-none">
                            {panel.domain}
                          </span>
                          <button
                            onClick={() => handleCopy(panel.domain, panel.id)}
                            className="text-gray-400 hover:text-brand transition-colors flex-shrink-0"
                          >
                            {copiedId === panel.id ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center space-x-2">
                          <span>{panelCurrency.flag}</span>
                          <span className="text-xs md:text-sm text-gray-300">{panel.panel_currency}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <span className="text-xs md:text-sm text-gray-300">
                          {new Date(panel.created_on).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        {getStatusBadge(panel.status)}
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${
                            isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-gray-400'
                          }`} />
                          <span className={`text-xs md:text-sm ${
                            isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-gray-300'
                          }`}>
                            {new Date(panel.renewal_date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        {panel.status === 'active' && (
                          <button
                            onClick={() => handleRenew(panel.id)}
                            disabled={renewingId === panel.id}
                            className="px-2 md:px-3 py-1 md:py-1.5 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-xs font-medium transition-all flex items-center space-x-1 disabled:opacity-50"
                          >
                            {renewingId === panel.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            <span className="hidden md:inline">Renew</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChildPanelsPage;
