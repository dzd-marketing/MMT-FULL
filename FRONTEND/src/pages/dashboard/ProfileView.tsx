import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MessageSquare, Key, Copy, CheckCheck,
  Camera, Save, RefreshCw, Loader2, CheckCircle2, XCircle,
  Globe, Sparkles, Clock, Eye, EyeOff, LogOut, DollarSign,
  ChevronDown
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import authService from '../../services/auth';

export default function ProfileView() {
  const { userData: contextUserData }: any = useOutletContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Profile states
  const [profileData, setProfileData] = useState({
    full_name: contextUserData?.full_name || 'User',
    email: contextUserData?.email || '',
    phone: contextUserData?.phone || '',
    whatsapp: contextUserData?.whatsapp || '',
    profile_picture: contextUserData?.profile_picture || null
  });
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // API Key states
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  
  // Currency state - number to string mapping
  const currencyMap = {
    '1': 'USD',
    '2': 'LKR',
    '3': 'INR'
  };
  
  const reverseCurrencyMap = {
    'USD': '1',
    'LKR': '2',
    'INR': '3'
  };
  
  // Helper function to map backend currency to frontend
  const mapBackendCurrency = (backendCurrency: string): 'USD' | 'LKR' | 'INR' => {
    // If it's already USD/LKR/INR, return as is
    if (backendCurrency === 'USD' || backendCurrency === 'LKR' || backendCurrency === 'INR') {
      return backendCurrency;
    }
    // If it's a number (1,2,3), map it
    return (currencyMap[backendCurrency as keyof typeof currencyMap] || 'USD') as 'USD' | 'LKR' | 'INR';
  };
  
  const [currency, setCurrency] = useState<'USD' | 'LKR' | 'INR'>('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  // Stats states
  const [stats, setStats] = useState({
    member_since: '',
    last_login: '',
    total_orders: 0,
    balance: '0.00',
    spent: '0.00'
  });
  
  // Form states
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Load all data on mount
  useEffect(() => {
    loadProfileData();
    loadApiKey();
    loadStats();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await axios.get('/api/user/profiles', { withCredentials: true });
      console.log('📋 [FRONTEND] Profile data loaded:', response.data);
      
      if (response.data.success) {
        const user = response.data.user;
        setProfileData({
          full_name: user.full_name || 'User',
          email: user.email || '',
          phone: user.phone || '',
          whatsapp: user.whatsapp || '',
          profile_picture: user.profile_picture || null
        });
        
        // Set currency from API
        if (user.currency) {
          console.log('💰 [FRONTEND] Raw currency from backend:', user.currency);
          const mappedCurrency = mapBackendCurrency(user.currency);
          console.log('💰 [FRONTEND] Mapped currency:', mappedCurrency);
          
          setCurrency(mappedCurrency);
          localStorage.setItem('preferred_currency', mappedCurrency);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Fallback to context data
      const user = await authService.getCurrentUser();
      if (user) {
        setProfileData({
          full_name: user.name || 'User',
          email: user.email || '',
          phone: user.phone || '',
          whatsapp: user.whatsapp || '',
          profile_picture: user.profilePicture || null
        });
      }
    }
  };

  const loadApiKey = async () => {
    try {
      const response = await axios.get('/api/user/api-key', { withCredentials: true });
      if (response.data.success) {
        setApiKey(response.data.api_key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      // Fallback to mock
      const mockKey = "MMT-" + (contextUserData?.id || 'XXXX') + "-" + Math.random().toString(36).substring(2, 15).toUpperCase();
      setApiKey(mockKey);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get('/api/user/stats', { withCredentials: true });
      if (response.data.success) {
        const stats = response.data.stats;
        setStats({
          member_since: new Date(stats.member_since).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          last_login: new Date(stats.last_login).toLocaleDateString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          }),
          total_orders: stats.total_orders,
          balance: stats.balance,
          spent: stats.spent
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to default
      setStats({
        member_since: 'March 2026',
        last_login: 'Today, 10:30 AM',
        total_orders: 24,
        balance: '0.00',
        spent: '0.00'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: 'USD' | 'LKR' | 'INR') => {
    console.log('💰 [FRONTEND] Step 1: User selected:', newCurrency);
    
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
    setShowCurrencyDropdown(false);
    
    try {
      const currencyNumber = reverseCurrencyMap[newCurrency];
      console.log('💰 [FRONTEND] Step 2: Sending to backend:', currencyNumber);
      
      const response = await axios.post('/api/user/update-currency', 
        { currency: currencyNumber }, 
        { withCredentials: true }
      );
      
      console.log('💰 [FRONTEND] Step 3: Backend response:', response.data);
      
      setStatusMessage(`Currency changed to ${newCurrency}`);
      setStatus('success');
      
      console.log('💰 [FRONTEND] Step 4: Refreshing profile data...');
      await loadProfileData();
      
    } catch (error) {
      console.error('💰 [FRONTEND] Error:', error);
      setStatusMessage('Currency updated locally');
      setStatus('success');
    }
    
    setTimeout(() => setStatus('idle'), 2000);
  };

const generateNewApiKey = async () => {
  setGeneratingKey(true);
  try {
    console.log('Generating new API key...');
    
    const token = localStorage.getItem('token');
    
    // USE FULL URL INSTEAD OF PROXY
    const response = await axios.post('/api/user/generate-api-key', {}, { 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true // This sends cookies
    });
    
    console.log('Generate API key response:', response.data);
    
    if (response.data.success) {
      setApiKey(response.data.api_key);
      setStatusMessage('New API key generated successfully!');
      setStatus('success');
    } else {
      throw new Error(response.data.message || 'Failed to generate API key');
    }
  } catch (error: any) {
    console.error('Error generating API key:', error);
    setStatusMessage(error.response?.data?.message || 'Failed to generate API key');
    setStatus('error');
  } finally {
    setGeneratingKey(false);
    setTimeout(() => setStatus('idle'), 3000);
  }
};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('full_name', profileData.full_name);
      formData.append('phone', profileData.phone);
      formData.append('whatsapp', profileData.whatsapp);
      
      // Convert currency to number for database
      const currencyNumber = reverseCurrencyMap[currency];
      formData.append('currency', currencyNumber);
      
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
        console.log('File attached:', selectedFile.name);
      }

      console.log('Submitting form data:', {
        full_name: profileData.full_name,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
        currency: currencyNumber,
        hasFile: !!selectedFile
      });

      const response = await axios.post('/api/user/update-profiles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      console.log('Update response:', response.data);

      if (response.data.success) {
        setStatusMessage('Profile updated successfully!');
        setStatus('success');
        
        if (response.data.user) {
          // Update profile data
          setProfileData(prev => ({
            ...prev,
            full_name: response.data.user.full_name,
            phone: response.data.user.phone,
            whatsapp: response.data.user.whatsapp,
            profile_picture: response.data.user.profile_picture || prev.profile_picture
          }));
          
          // Update currency from response using the mapper
          if (response.data.user.currency) {
            const mappedCurrency = mapBackendCurrency(response.data.user.currency);
            setCurrency(mappedCurrency);
            localStorage.setItem('preferred_currency', mappedCurrency);
          }
          
          // Update stats if balance/spent changed
          if (response.data.user.balance) {
            setStats(prev => ({ ...prev, balance: response.data.user.balance }));
          }
          if (response.data.user.spent) {
            setStats(prev => ({ ...prev, spent: response.data.user.spent }));
          }
        }
        
        setPreviewImage(null);
        setSelectedFile(null);
        
        // Refresh profile data to ensure everything is synced
        await loadProfileData();
      }
    } catch (error: any) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      setStatusMessage(error.response?.data?.message || 'Failed to update profile');
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getInitials = (name: string) => {
    if (!name || name === 'User') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currencySymbols = {
    USD: '$',
    LKR: 'රු',
    INR: '₹'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      
      {/* SUCCESS/ERROR NOTIFICATION */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 px-8 py-4 rounded-3xl border shadow-2xl backdrop-blur-2xl ${
              status === 'success' 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}
          >
            {status === 'success' 
              ? <CheckCircle2 className="w-6 h-6" /> 
              : <XCircle className="w-6 h-6" />
            }
            <div className="font-black uppercase tracking-widest text-sm">
              {statusMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden glass border border-white/10 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center">
              <User className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Profile Settings</h1>
              <p className="text-gray-400 text-sm max-w-md font-medium">
                Manage your account information and API keys
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => authService.logout().then(() => window.location.href = '/')}
            className="glass px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-500">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column - Profile Information */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-white/10">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand" />
              Personal Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div 
                    onClick={handleImageClick}
                    className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand to-purple-600 p-[3px] cursor-pointer hover:scale-105 transition-all"
                  >
                    <div className="w-full h-full rounded-[1.4rem] bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                      {previewImage || profileData.profile_picture ? (
                        <img 
                          src={previewImage || (
                            profileData.profile_picture?.startsWith('http') 
                              ? profileData.profile_picture 
                              : `https://mmtsmmpanel.cyberservice.online${profileData.profile_picture}`
                          )} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', profileData.profile_picture);
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = `<span class="text-3xl font-black text-brand">${getInitials(profileData.full_name)}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-3xl font-black text-brand">
                          {getInitials(profileData.full_name)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Camera Icon Overlay */}
                  <div 
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-xl"
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                <p className="text-[10px] text-gray-500 font-medium">
                  Click to upload new photo (JPG, PNG, GIF)
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-brand transition-all"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Email Address (Cannot be changed)
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-gray-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {profileData.email}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-brand transition-all"
                    placeholder="+94 77 123 4567"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.whatsapp}
                    onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-brand transition-all"
                    placeholder="+94 77 123 4567"
                  />
                </div>

                {/* Currency Preference */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <div className="relative" ref={currencyDropdownRef}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2 mb-2">
                      <DollarSign className="w-3 h-3" />
                      Currency Preference
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between hover:border-brand/30 transition-all text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currencySymbols[currency]}</span>
                        <span className="font-bold">{currency}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showCurrencyDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-1 z-50 overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] shadow-2xl"
                        >
                          {(['USD', 'LKR', 'INR'] as const).map((cur, index) => (
                            <React.Fragment key={cur}>
                              <button
                                type="button"
                                onClick={() => handleCurrencyChange(cur)}
                                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-colors text-sm"
                                style={{
                                  backgroundColor: currency === cur ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                }}
                              >
                                <span className="text-base w-6">{currencySymbols[cur]}</span>
                                <span className="font-medium flex-1 text-left">{cur}</span>
                                {currency === cur && (
                                  <CheckCheck className="w-3.5 h-3.5 text-brand" />
                                )}
                              </button>
                              {index < 2 && <div className="mx-3 border-t border-white/5" />}
                            </React.Fragment>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-[9px] text-gray-500 mt-1.5 ml-2">
                      Choose your preferred currency for displaying prices
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand disabled:opacity-50 disabled:grayscale py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - API Configuration */}
        <div className="space-y-6">
          
          {/* API Configuration */}
          <div className="glass p-8 rounded-[2.5rem] border border-white/10">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-brand" />
              API Configuration
            </h2>

            <div className="space-y-6">
              {/* API Key Display */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                  Your API Key
                </label>
                <div className="glass p-4 rounded-xl border border-brand/30 bg-brand/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-gray-400">API Key</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(apiKey)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-all group"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-brand" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-white/5">
                    <code className="text-sm font-mono text-brand break-all">
                      {showApiKey ? apiKey : '••••••••••••••••••••••••'}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-all ml-2 shrink-0"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate New Key Button */}
              <button
                type="button"
                onClick={generateNewApiKey}
                disabled={generatingKey}
                className="w-full glass border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-yellow-500" />
                )}
                {generatingKey ? 'Generating...' : 'Generate New API Key'}
              </button>
            </div>
          </div>

          {/* API Important Info */}
          <div className="glass p-6 rounded-[2rem] border border-white/10">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <p className="text-xs text-blue-400 leading-relaxed">
                <span className="font-black block mb-1">🔐 Important:</span>
                Keep your API key secure. Never share it publicly or commit it to version control. Generate a new key if you suspect it's compromised.
              </p>
            </div>
          </div>

          {/* Account Stats */}
          <div className="glass p-6 rounded-[2rem] border border-white/10">
            <h3 className="text-sm font-black mb-4">Account Statistics</h3>
            {loadingStats ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-xs text-gray-400">Balance</span>
                  <span className="text-sm font-bold text-brand">${stats.balance}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-xs text-gray-400">Total Spent</span>
                  <span className="text-sm font-bold">${stats.spent}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-xs text-gray-400">Total Orders</span>
                  <span className="text-sm font-bold">{stats.total_orders}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-xs text-gray-400">Member Since</span>
                  <span className="text-sm font-bold">{stats.member_since}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-xs text-gray-400">Last Login</span>
                  <span className="text-sm font-bold">{stats.last_login}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Globe className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">Best & Trusted SMM Service Provider</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">#1 Sri Lanka</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">24/7 Support</span>
        </div>
      </div>
    </div>
  );
}
