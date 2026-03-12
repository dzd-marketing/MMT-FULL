import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Wifi, WifiOff, Save, Loader, 
  Menu, Bell, Globe, Sparkles, Clock,
  AlertTriangle, CheckCircle, XCircle,
  Edit3, Eye, EyeOff, RefreshCw, Mail,
  Phone, MessageCircle, Facebook, Instagram,
  Twitter, Youtube, Shield, Image as ImageIcon,
  Moon, Sun, DollarSign, 
  Key, Lock, Unlock, Link, 
  Info, AlertCircle, CheckCircle2, X,
  Share2, Send,
  Database, Snowflake, PartyPopper
} from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';

interface Config {
  // Maintenance
  maintenance_mode: string;
  maintenance_message: string;
  
  // Site Info
  site_name: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_logo: string;
  
  // Alert
  alert_message: string;
  alert_enabled: string;
  alert_type: string;
  alert_heading: string;
  alert_description: string;
  
  // Contact
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  
  // Social Media
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  telegram_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  whatsapp_channel: string;
  linkedin_url: string;
  
  // Business
  address: string;
  currency: string;
  timezone: string;
  date_format: string;
  time_format: string;
  
  // Features
  registration_enabled: string;
  email_verification_required: string;
  
  // Effects
  snow_effect: string;
  festival_effect: string;
  
  // Integrations
  google_analytics_id: string;
  facebook_pixel_id: string;
  recaptcha_site_key: string;
  recaptcha_secret_key: string;
}

const AdminConfigPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('maintenance');
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [config, setConfig] = useState<Config>({
    // Maintenance
    maintenance_mode: '0',
    maintenance_message: 'Site is under maintenance. We will be back soon!',
    
    // Site Info
    site_name: 'MAKE ME TREND',
    site_title: 'MAKE ME TREND - Best SMM Panel in Sri Lanka',
    site_description: 'Best SMM Panel in Sri Lanka. Buy Facebook, Instagram, TikTok, YouTube followers, likes, views at cheapest price.',
    site_keywords: 'SMM Panel, Social Media Marketing, Buy Followers, Sri Lanka',
    site_logo: '',
    
    // Alert
    alert_message: '',
    alert_enabled: '0',
    alert_type: 'info',
    alert_heading: '',
    alert_description: '',
    
    // Contact
    contact_email: 'support@makemetrend.lk',
    contact_phone: '+94 77 123 4567',
    contact_whatsapp: '+94 77 123 4567',
    
    // Social Media
    facebook_url: 'https://facebook.com/makemetrend',
    instagram_url: 'https://instagram.com/makemetrend',
    twitter_url: 'https://twitter.com/makemetrend',
    youtube_url: 'https://youtube.com/@makemetrend',
    telegram_url: 'https://t.me/makemetrend',
    tiktok_url: 'https://tiktok.com/@makemetrend',
    whatsapp_url: 'https://wa.me/94771234567',
    whatsapp_channel: '',
    linkedin_url: 'https://linkedin.com/company/makemetrend',
    
    // Business
    address: '123, Main Street, Colombo, Sri Lanka',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    date_format: 'M d, Y',
    time_format: 'h:i A',
    
    // Features
    registration_enabled: '1',
    email_verification_required: '1',
    
    // Effects
    snow_effect: '0',
    festival_effect: '0',
    
    // Integrations
    google_analytics_id: '',
    facebook_pixel_id: '',
    recaptcha_site_key: '',
    recaptcha_secret_key: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/config/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setConfig(prev => ({ ...prev, ...response.data.config }));
        
        // Set image preview for site_logo
        if (response.data.config.site_logo) {
          setImagePreview(getImageUrl(response.data.config.site_logo));
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const configsToSave = {
        site_name: config.site_name,
        site_title: config.site_title,
        site_description: config.site_description,
        site_keywords: config.site_keywords,
        site_logo: config.site_logo,
        alert_message: config.alert_message,
        alert_enabled: config.alert_enabled,
        alert_type: config.alert_type,
        alert_heading: config.alert_heading,
        alert_description: config.alert_description,
        contact_email: config.contact_email,
        contact_phone: config.contact_phone,
        contact_whatsapp: config.contact_whatsapp,
        facebook_url: config.facebook_url,
        instagram_url: config.instagram_url,
        twitter_url: config.twitter_url,
        youtube_url: config.youtube_url,
        telegram_url: config.telegram_url,
        tiktok_url: config.tiktok_url,
        whatsapp_url: config.whatsapp_url,
        whatsapp_channel: config.whatsapp_channel,
        linkedin_url: config.linkedin_url,
        address: config.address,
        currency: config.currency,
        timezone: config.timezone,
        date_format: config.date_format,
        time_format: config.time_format,
        registration_enabled: config.registration_enabled,
        email_verification_required: config.email_verification_required,
        snow_effect: config.snow_effect,
        festival_effect: config.festival_effect,
        google_analytics_id: config.google_analytics_id,
        facebook_pixel_id: config.facebook_pixel_id,
        recaptcha_site_key: config.recaptcha_site_key,
        recaptcha_secret_key: config.recaptcha_secret_key
      };

      const response = await axios.post(`${API_URL}/admin/config/update-multiple`, {
        configs: configsToSave
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Error saving all config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const newValue = config.maintenance_mode === '1' ? '0' : '1';
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/admin/config/toggle-maintenance`, {
        enabled: newValue === '1',
        message: config.maintenance_message
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setConfig(prev => ({ ...prev, maintenance_mode: newValue }));
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSnowEffect = async () => {
    const newValue = config.snow_effect === '1' ? '0' : '1';
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/admin/config/toggle-snow`, {
        enabled: newValue === '1'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setConfig(prev => ({ ...prev, snow_effect: newValue }));
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Error toggling snow effect:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFestivalEffect = async () => {
    const newValue = config.festival_effect === '1' ? '0' : '1';
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/admin/config/toggle-festival`, {
        enabled: newValue === '1'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setConfig(prev => ({ ...prev, festival_effect: newValue }));
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Error toggling festival effect:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', 'site_logo');

    try {
      const response = await axios.post(`${API_URL}/admin/config/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setConfig(prev => ({ ...prev, site_logo: response.data.path }));
        setImagePreview(URL.createObjectURL(file));
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads')) return `${BASE_URL}${path}`;
    return `${BASE_URL}${path}`;
  };

  const getAlertColor = (type: string) => {
    switch(type) {
      case 'success': return 'border-green-500/20 bg-green-500/10 text-green-400';
      case 'error': return 'border-red-500/20 bg-red-500/10 text-red-400';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400';
      default: return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
    }
  };

  const tabs = [
    { id: 'maintenance', label: 'Maintenance', icon: WifiOff },
    { id: 'general', label: 'General', icon: Globe },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'effects', label: 'Site Effects', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeTickets={0}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:block p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white md:text-2xl">Site Configuration</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span className="hidden sm:inline">Save Changes</span></>}
              </button>

              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Saved!</span>
                </motion.div>
              )}

              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center">
                  <span className="text-sm font-black text-white">AD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="mb-6">
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                >
                  {tabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden md:flex items-center gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        isActive ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* MAINTENANCE TAB */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-brand" />
                      Site Status
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-black/30 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3">
                        {config.maintenance_mode === '1' ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                              <WifiOff className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                              <p className="font-bold text-red-400">Maintenance Mode Active</p>
                              <p className="text-xs text-gray-400">Users cannot access the site</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Wifi className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                              <p className="font-bold text-green-400">Site Active</p>
                              <p className="text-xs text-gray-400">All users can access normally</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={handleToggleMaintenance}
                        disabled={saving}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                          config.maintenance_mode === '1'
                            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        }`}
                      >
                        {saving ? <Loader className="w-4 h-4 animate-spin" /> : config.maintenance_mode === '1' ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Site Info */}
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-brand" />
                      Site Information
                    </h2>
                    
                    <div className="space-y-4">
                      <InputField label="Site Name" value={config.site_name} onChange={(v) => handleSave('site_name', v)} />
                      <InputField label="Site Title (SEO)" value={config.site_title} onChange={(v) => handleSave('site_title', v)} />
                      <TextAreaField label="Site Description (SEO)" value={config.site_description} onChange={(v) => handleSave('site_description', v)} rows={3} />
                      <InputField label="Site Keywords" value={config.site_keywords} onChange={(v) => handleSave('site_keywords', v)} />
                    </div>
                  </div>

                  {/* Site Logo */}
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-brand" />
                      Site Logo
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Site Logo</label>
                        <div className="flex flex-col items-center gap-4 p-6 bg-black/30 rounded-xl border border-white/10">
                          {/* Logo Preview */}
                          <div className="w-32 h-32 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                            {imagePreview || config.site_logo ? (
                              <img 
                                src={imagePreview || getImageUrl(config.site_logo)} 
                                alt="Site Logo" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/200x200/2a2a2a/ffffff?text=Logo';
                                }}
                              />
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">No logo uploaded</p>
                              </div>
                            )}
                          </div>

                          {/* Upload Button */}
                          <div className="w-full">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white cursor-pointer transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Upload New Logo
                            </label>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              Recommended size: 200x50px or similar ratio
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alert Settings */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-brand" />
                      Global Alert
                    </h2>
                    
                    <div className="space-y-4">
                      <ToggleField 
                        label="Enable Alert Popup"
                        value={config.alert_enabled === '1'}
                        onChange={(v) => handleSave('alert_enabled', v ? '1' : '0')}
                      />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['info', 'success', 'warning', 'error'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleSave('alert_type', type)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              config.alert_type === type
                                ? `bg-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-500/20 border-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-500/30 text-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-400`
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>

                      <InputField label="Alert Heading" value={config.alert_heading || ''} onChange={(v) => handleSave('alert_heading', v)} />
                      <TextAreaField label="Alert Description" value={config.alert_description || ''} onChange={(v) => handleSave('alert_description', v)} rows={3} />

                      {config.alert_enabled === '1' && (config.alert_heading || config.alert_description) && (
                        <div className={`p-4 rounded-xl border ${getAlertColor(config.alert_type)}`}>
                          {config.alert_heading && <h4 className="text-sm font-bold mb-1">{config.alert_heading}</h4>}
                          {config.alert_description && <p className="text-xs">{config.alert_description}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SOCIAL LINKS TAB */}
              {activeTab === 'social' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-brand" />
                      Social Links
                    </h2>
                    
                    <div className="space-y-4">
                      <InputField 
                        label="Facebook URL" 
                        value={config.facebook_url || ''} 
                        onChange={(v) => handleSave('facebook_url', v)} 
                        icon={<Facebook className="w-4 h-4 text-blue-400" />}
                        placeholder="https://facebook.com/yourpage"
                      />
                      
                      <InputField 
                        label="WhatsApp Number" 
                        value={config.contact_whatsapp || ''} 
                        onChange={(v) => handleSave('contact_whatsapp', v)} 
                        icon={<MessageCircle className="w-4 h-4 text-green-400" />}
                        placeholder="94771234567"
                      />
                      
                      <InputField 
                        label="WhatsApp Channel" 
                        value={config.whatsapp_channel || ''} 
                        onChange={(v) => handleSave('whatsapp_channel', v)} 
                        icon={<Send className="w-4 h-4 text-green-400" />}
                        placeholder="https://whatsapp.com/channel/..."
                      />
                      
                      <InputField 
                        label="Telegram URL" 
                        value={config.telegram_url || ''} 
                        onChange={(v) => handleSave('telegram_url', v)} 
                        icon={<Send className="w-4 h-4 text-sky-400" />}
                        placeholder="https://t.me/yourchannel"
                      />
                    </div>

                    <p className="mt-4 text-xs text-blue-400 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      These links appear in the chat button on bottom right
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-brand" />
                      Preview
                    </h2>
                    
                    <div className="relative bg-black/50 border border-white/10 rounded-xl p-8 min-h-[250px] flex items-end justify-end">
                      <div className="relative group">
                        <button className="w-12 h-12 rounded-full bg-brand hover:bg-brand/90 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110">
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-14 right-0 mb-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <div className="bg-[#1F1F1F] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                            <div className="p-2 border-b border-white/10">
                              <p className="text-xs text-gray-400 px-2">Contact us on:</p>
                            </div>
                            <div className="p-2">
                              {config.facebook_url && <PreviewItem icon={<Facebook className="w-4 h-4 text-blue-400" />} label="Facebook" />}
                              {config.contact_whatsapp && <PreviewItem icon={<MessageCircle className="w-4 h-4 text-green-400" />} label="WhatsApp" />}
                              {config.whatsapp_channel && <PreviewItem icon={<Send className="w-4 h-4 text-green-400" />} label="WhatsApp Channel" />}
                              {config.telegram_url && <PreviewItem icon={<Send className="w-4 h-4 text-sky-400" />} label="Telegram" />}
                              
                              {!config.facebook_url && !config.contact_whatsapp && !config.whatsapp_channel && !config.telegram_url && (
                                <p className="text-xs text-gray-500 text-center py-4">No links added</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-brand" />
                      Contact Info
                    </h2>
                    
                    <div className="space-y-4">
                      <InputField 
                        label="Email Address" 
                        value={config.contact_email} 
                        onChange={(v) => handleSave('contact_email', v)} 
                        icon={<Mail className="w-4 h-4 text-gray-500" />}
                        type="email"
                      />
                      <InputField 
                        label="Phone Number" 
                        value={config.contact_phone} 
                        onChange={(v) => handleSave('contact_phone', v)} 
                        icon={<Phone className="w-4 h-4 text-gray-500" />}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-brand" />
                      Address
                    </h2>
                    <TextAreaField value={config.address} onChange={(v) => handleSave('address', v)} rows={4} />
                  </div>

                  <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-brand" />
                      Footer
                    </h2>
                  </div>
                </div>
              )}

              {/* EFFECTS TAB - NEW */}
              {activeTab === 'effects' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Snow Effect Card */}
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Snowflake className="w-5 h-5 text-blue-400" />
                      Snow Effect
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.snow_effect === '1' ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                            <Snowflake className={`w-5 h-5 ${config.snow_effect === '1' ? 'text-blue-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Enable Snow Effect</p>
                            <p className="text-xs text-gray-400">Falling snow animation across the site</p>
                          </div>
                        </div>
                        <button
                          onClick={handleToggleSnowEffect}
                          disabled={saving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.snow_effect === '1' ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.snow_effect === '1' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Preview */}
                      <div className="relative h-32 rounded-xl bg-gradient-to-b from-blue-900/20 to-transparent border border-white/10 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Snowflake className="w-6 h-6 text-blue-400 animate-bounce" />
                          <Snowflake className="w-4 h-4 text-blue-300 animate-pulse ml-2" />
                          <Snowflake className="w-5 h-5 text-blue-500 animate-spin ml-2" />
                        </div>
                        <p className="absolute bottom-2 left-2 text-[10px] text-gray-500">Preview animation</p>
                      </div>
                    </div>
                  </div>

                  {/* Festival Effect Card */}
                  <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <PartyPopper className="w-5 h-5 text-pink-400" />
                      Festival Effect
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.festival_effect === '1' ? 'bg-pink-500/20' : 'bg-white/5'}`}>
                            <PartyPopper className={`w-5 h-5 ${config.festival_effect === '1' ? 'text-pink-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Enable Festival Effect</p>
                            <p className="text-xs text-gray-400">Colorful festival animations across the site</p>
                          </div>
                        </div>
                        <button
                          onClick={handleToggleFestivalEffect}
                          disabled={saving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.festival_effect === '1' ? 'bg-pink-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.festival_effect === '1' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Festival Type Selector */}
                      {config.festival_effect === '1' && (
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Festival Type</label>
                          <select
                            value="default"
                            onChange={(e) => handleSave('festival_type', e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                          >
                            <option value="diwali">Diwali</option>
                            <option value="christmas">Christmas</option>
                            <option value="newyear">New Year</option>
                            <option value="sinhala">Sinhala New Year</option>
                            <option value="vesak">Vesak</option>
                            <option value="poson">Poson</option>
                            <option value="ramadan">Ramadan</option>
                          </select>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="relative h-32 rounded-xl bg-gradient-to-b from-pink-900/20 to-transparent border border-white/10 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PartyPopper className="w-6 h-6 text-pink-400 animate-bounce" />
                          <PartyPopper className="w-4 h-4 text-yellow-400 animate-pulse ml-2" />
                          <PartyPopper className="w-5 h-5 text-green-400 animate-spin ml-2" />
                        </div>
                        <p className="absolute bottom-2 left-2 text-[10px] text-gray-500">Preview animation</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-blue-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1">About Site Effects</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Snow effect and festival effect are visual animations that appear across all pages of your site. 
                          Enable them to enhance user experience during special occasions. Festival effect supports multiple 
                          festival types with different color schemes and animations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full z-50">
        <span className="text-[10px] font-bold text-white">MAKE ME TREND</span>
      </div>
    </div>
  );
};

// Helper Components (unchanged)
const InputField = ({ label, value, onChange, icon, type = 'text', placeholder }: any) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none`}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, rows }: any) => (
  <div>
    {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows || 3}
      className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
    />
  </div>
);

const ToggleField = ({ label, value, onChange }: any) => (
  <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/10">
    <span className="text-sm text-gray-300">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-brand' : 'bg-white/20'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const PreviewItem = ({ icon, label }: any) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
    {icon}
    <span className="text-xs text-white flex-1">{label}</span>
  </div>
);

export default AdminConfigPage;

