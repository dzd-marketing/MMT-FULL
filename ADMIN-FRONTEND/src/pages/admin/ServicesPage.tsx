import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactDOM from 'react-dom';
import {
  Package, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Edit, MoreVertical, RefreshCw, Clock, CheckCircle,
  AlertCircle, Play, Ban, Loader, XCircle, HelpCircle, Copy,
  ExternalLink, Calendar, DollarSign, User, Link as LinkIcon,
  Server, Shield, Settings, Plus, Trash2, Save, Edit3, CheckSquare,
  Square, Layers, Zap, Globe, Mail, Phone, MessageSquare, Menu,
  Bell, LogOut, Check, X, FolderTree, Hash,
  EyeOff, Eye as EyeOpen, Lock, Unlock, RefreshCcw, Upload,
  Download as DownloadIcon, Grid, List, ChevronUp, CreditCard,
  Users, Wallet, Image, Type, AlignLeft, Clock as ClockIcon,
  Repeat, Instagram, Facebook, Twitter, Youtube, Music,
  ChevronsUp, ChevronsDown, GripVertical, Star, Award, Crown,
  LayoutGrid, ListTodo, SlidersHorizontal, Settings2, Code
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

interface Service {
  service_id: number;
  service_name: string;
  name_lang: Record<string, string>;
  service_description: string;
  description_lang: Record<string, string>;
  service_price: number;
  service_min: number;
  service_max: number;
  service_type: '1' | '2';
  service_package: string;
  service_api: number;
  api_service: number;
  api_detail: any;
  api_servicetype: '1' | '2';
  category_id: number;
  category_name?: string;
  service_line: number;
  service_secret: '1' | '2';
  show_refill: 'true' | 'false';
  cancelbutton: '1' | '2';
  service_speed: '1' | '2' | '3' | '4';
  service_dripfeed: '1' | '2';
  service_autotime?: number;
  service_autopost?: number;
  service_overflow: number;
  service_sync: '0' | '1';
  time: string;
  time_lang: string;
  service_deleted: '0' | '1';
  instagram_second: '1' | '2';
  start_count: string;
  instagram_private: '1' | '2';
  want_username: '1' | '2';
  refill_days: string;
  refill_hours: string;
  service_profit?: string;
  price_type: 'normal' | 'percent' | 'amount';
  price_cal?: string;
  avg_days: number;
  avg_hours: number;
  avg_minutes: number;
  avg_many: number;
  price_profit: number;
  is_new: number;
  new_added_date?: string;
  provider_name?: string;
  provider_currency?: string;
}

interface Category {
  category_id: number;
  category_name: string;
  category_name_lang: Record<string, string>;
  category_line: number;
  category_type: '1' | '2';
  category_secret: '1' | '2';
  category_icon: string;
  is_refill: '1' | '2';
  category_deleted: '0' | '1';
  service_count?: number;
  active_services?: number;
}

interface Provider {
  id: number;
  api_name: string;
  api_url: string;
  api_key: string;
  api_type: number;
  api_limit: number;
  currency: string;
  api_alert: '1' | '2';
  status: '1' | '2';
  api_sync: '0' | '1';
  api_login_credentials?: string;
}

interface ImportService {
  service: string;
  name: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  refill: string;
  desc?: string;
  category?: string;
}

interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  secret: number;
  public: number;
  refill_enabled: number;
  cancel_enabled: number;
  categories: number;
  by_package: Array<{ service_package: string; count: number }>;
}


interface DropdownOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  icon,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-all duration-200 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="truncate font-medium">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && dropdownPosition && ReactDOM.createPortal(
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999
          }}
          className="bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${option.value === value ? 'text-brand bg-brand/10' : 'text-gray-300'
                }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="w-4 h-4 text-brand flex-shrink-0" />}
            </button>
          ))}
        </motion.div>,
        document.body
      )}
    </div>
  );
};

const PackageTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const getPackageInfo = () => {
    switch (type) {
      case '1':
        return { label: 'Default', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Package className="w-3 h-3" /> };
      case '2':
        return { label: 'Custom', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Settings className="w-3 h-3" /> };
      case '3':
        return { label: 'Comments', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <MessageSquare className="w-3 h-3" /> };
      case '4':
        return { label: 'Package', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <Layers className="w-3 h-3" /> };
      case '5':
        return { label: 'Package+', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Layers className="w-3 h-3" /> };
      case '6':
        return { label: 'Drip-feed', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: <Repeat className="w-3 h-3" /> };
      case '7':
        return { label: 'Subscription', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: <Repeat className="w-3 h-3" /> };
      case '8':
        return { label: 'API', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: <Server className="w-3 h-3" /> };
      case '11':
        return { label: 'Subscription', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <Repeat className="w-3 h-3" /> };
      case '12':
        return { label: 'Subscription+', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Repeat className="w-3 h-3" /> };
      case '14':
        return { label: 'Package', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <Layers className="w-3 h-3" /> };
      case '15':
        return { label: 'Package+', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Layers className="w-3 h-3" /> };
      default:
        return { label: `Type ${type}`, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <HelpCircle className="w-3 h-3" /> };
    }
  };

  const info = getPackageInfo();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${info.color}`}>
      {info.icon}
      {info.label}
    </span>
  );
};


const SpeedBadge: React.FC<{ speed: '1' | '2' | '3' | '4' }> = ({ speed }) => {
  const speeds = {
    '1': { label: 'Very Slow', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <Clock className="w-3 h-3" /> },
    '2': { label: 'Slow', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
    '3': { label: 'Medium', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <Zap className="w-3 h-3" /> },
    '4': { label: 'Fast', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <Zap className="w-3 h-3" /> }
  };
  const info = speeds[speed] || speeds['1'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${info.color}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

const PlatformIcon: React.FC<{ categoryName: string }> = ({ categoryName }) => {
  const name = categoryName.toLowerCase();

  if (name.includes('instagram')) {
    return <Instagram className="w-4 h-4 text-pink-500" />;
  } else if (name.includes('facebook')) {
    return <Facebook className="w-4 h-4 text-blue-600" />;
  } else if (name.includes('twitter') || name.includes('x.com')) {
    return <Twitter className="w-4 h-4 text-sky-400" />;
  } else if (name.includes('youtube')) {
    return <Youtube className="w-4 h-4 text-red-600" />;
  } else if (name.includes('tiktok')) {
    return <Music className="w-4 h-4 text-pink-400" />;
  } else if (name.includes('whatsapp')) {
    return <MessageSquare className="w-4 h-4 text-green-500" />;
  } else {
    return <Globe className="w-4 h-4 text-gray-400" />;
  }
};

const AdminServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    active: 0,
    inactive: 0,
    secret: 0,
    public: 0,
    refill_enabled: 0,
    cancel_enabled: 0,
    categories: 0,
    by_package: []
  });

  const [loading, setLoading] = useState(true);
  const [loadingCache, setLoadingCache] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedSecret, setSelectedSecret] = useState<string>('all');
  const [selectedRefill, setSelectedRefill] = useState<string>('all');
  const [selectedCancel, setSelectedCancel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providerServices, setProviderServices] = useState<ImportService[]>([]);
  const [selectedImportServices, setSelectedImportServices] = useState<Record<string, boolean>>({});
  const [importProfitPercentage, setImportProfitPercentage] = useState<number>(20);
  const [importCategory, setImportCategory] = useState<string>('');
  const [fetchingProviderServices, setFetchingProviderServices] = useState(false);
  const [autoCreateCategories, setAutoCreateCategories] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon_type: 'icon',
    icon_class: '',
    image_id: null,
    position: 'bottom'
  });

  const [serviceNames, setServiceNames] = useState<Record<string, string>>({ en: '' });
  const [serviceDescriptions, setServiceDescriptions] = useState<Record<string, string>>({ en: '' });
  const [serviceTimes, setServiceTimes] = useState<Record<string, string>>({ en: 'Not enough data' });

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const CACHE_KEY = 'admin_services_cache';
  const CACHE_TIMESTAMP_KEY = 'admin_services_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; 

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [currentPage, setCurrentPage] = useState(1);

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<Record<number, boolean>>({});
  const [applyingUpdates, setApplyingUpdates] = useState(false);


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const status = params.get('status');
    const package_type = params.get('package');
    const secret = params.get('secret');
    const refill = params.get('refill');
    const cancel = params.get('cancel');
    const search = params.get('search');

    if (category) setSelectedCategory(category);
    if (status) setSelectedStatus(status);
    if (package_type) setSelectedPackage(package_type);
    if (secret) setSelectedSecret(secret);
    if (refill) setSelectedRefill(refill);
    if (cancel) setSelectedCancel(cancel);
    if (search) setSearchQuery(search);
  }, []);

  useEffect(() => {
    loadServices();
    fetchStats();
    fetchCategories();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (!allServices.length) return;

    let filtered = [...allServices];

    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(service => {
        const nameMatch = service.service_name?.toLowerCase().includes(query) || false;
        const idMatch = service.service_id.toString().includes(query);
        const categoryMatch = service.category_name?.toLowerCase().includes(query) || false;
        return nameMatch || idMatch || categoryMatch;
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service =>
        service.category_id.toString() === selectedCategory
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(service => {
        if (selectedStatus === 'active') {
          return service.service_type === '2';
        } else if (selectedStatus === 'inactive') {
          return service.service_type === '1';
        }
        return true;
      });
    }

    if (selectedPackage !== 'all') {
      filtered = filtered.filter(service =>
        service.service_package === selectedPackage
      );
    }

    if (selectedSecret !== 'all') {
      filtered = filtered.filter(service => {
        if (selectedSecret === 'secret') {
          return service.service_secret === '1';
        } else if (selectedSecret === 'public') {
          return service.service_secret === '2';
        }
        return true;
      });
    }

    if (selectedRefill !== 'all') {
      filtered = filtered.filter(service => {
        if (selectedRefill === 'true') {
          return service.show_refill === 'true';
        } else if (selectedRefill === 'false') {
          return service.show_refill === 'false';
        }
        return true;
      });
    }

    if (selectedCancel !== 'all') {
      filtered = filtered.filter(service => {
        if (selectedCancel === '1') {
          return service.cancelbutton === '1';
        } else if (selectedCancel === '2') {
          return service.cancelbutton === '2';
        }
        return true;
      });
    }

    setFilteredServices(filtered);
    setDisplayedServices(filtered.slice(0, displayLimit));
    setHasMore(filtered.length > displayLimit);

  }, [allServices, searchQuery, selectedCategory, selectedStatus, selectedPackage,
    selectedSecret, selectedRefill, selectedCancel, displayLimit]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedPackage !== 'all') params.set('package', selectedPackage);
    if (selectedSecret !== 'all') params.set('secret', selectedSecret);
    if (selectedRefill !== 'all') params.set('refill', selectedRefill);
    if (selectedCancel !== 'all') params.set('cancel', selectedCancel);
    if (searchQuery) params.set('search', searchQuery);
    navigate({ search: params.toString() }, { replace: true });
  }, [selectedCategory, selectedStatus, selectedPackage, selectedSecret,
    selectedRefill, selectedCancel, searchQuery]);

  useEffect(() => {
    if (selectAll) {
      setSelectedServices(displayedServices.map(s => s.service_id));
    } else {
      setSelectedServices([]);
    }
  }, [selectAll, displayedServices]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = () => {
    const newLimit = displayLimit + 30;
    setDisplayLimit(newLimit);
    setDisplayedServices(filteredServices.slice(0, newLimit));
    setHasMore(filteredServices.length > newLimit);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');

      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
          const parsedServices = JSON.parse(cachedData);
          setAllServices(parsedServices);
          setFilteredServices(parsedServices);
          setDisplayedServices(parsedServices.slice(0, displayLimit));
          setHasMore(parsedServices.length > displayLimit);
          setLoading(false);
          return;
        }
      }

      await fetchAllServicesFromAPI();

    } catch (error) {
      console.error('Error loading services from cache:', error);
      await fetchAllServicesFromAPI();
    }
  };

  const fetchAllServicesFromAPI = async () => {
    setLoadingCache(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/services?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const services = response.data.services;

        localStorage.setItem(CACHE_KEY, JSON.stringify(services));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

        setAllServices(services);
        setFilteredServices(services);
        setDisplayedServices(services.slice(0, displayLimit));
        setHasMore(services.length > displayLimit);
      }
    } catch (error) {
      console.error('Error fetching all services:', error);
    } finally {
      setLoadingCache(false);
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/services/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/services/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProviders(response.data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchProviderServices = async (providerId: string) => {
    setFetchingProviderServices(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/services/providers/${providerId}/fetch-services`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProviderServices(response.data.services);
      }
    } catch (error) {
      console.error('Error fetching provider services:', error);
    } finally {
      setFetchingProviderServices(false);
    }
  };


  const handleBulkAction = async () => {
    if (!bulkAction || selectedServices.length === 0) return;

    setActionLoading(0);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/services/bulk-action`,
        {
          action: bulkAction,
          service_ids: selectedServices
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await loadServices(); 
        fetchStats();
        setSelectedServices([]);
        setSelectAll(false);
        setBulkAction('');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetNewFlags = async () => {
    if (!confirm('Mark all NEW services as reviewed?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/admin/services/reset-new-flags`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices();
      alert('New flags reset successfully');
    } catch (error) {
      console.error('Error resetting new flags:', error);
    }
  };

  const handleToggleStatus = async (serviceId: number, currentStatus: string) => {
    setActionLoading(serviceId);
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === '2' ? '1' : '2';
      await axios.post(`${API_URL}/admin/services/${serviceId}/toggle-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices();
      fetchStats();
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSecret = async (serviceId: number, currentSecret: string) => {
    setActionLoading(serviceId);
    try {
      const token = localStorage.getItem('adminToken');
      const newSecret = currentSecret === '1' ? '2' : '1';
      await axios.post(`${API_URL}/admin/services/${serviceId}/toggle-secret`,
        { secret: newSecret },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices(); 
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error toggling secret:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRefill = async (serviceId: number, currentRefill: string) => {
    setActionLoading(serviceId);
    try {
      const token = localStorage.getItem('adminToken');
      const newRefill = currentRefill === 'true' ? 'false' : 'true';
      await axios.post(`${API_URL}/admin/services/${serviceId}/toggle-refill`,
        { enabled: newRefill },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices(); 
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error toggling refill:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCancel = async (serviceId: number, currentCancel: string) => {
    setActionLoading(serviceId);
    try {
      const token = localStorage.getItem('adminToken');
      const newCancel = currentCancel === '1' ? '2' : '1';
      await axios.post(`${API_URL}/admin/services/${serviceId}/toggle-cancel`,
        { enabled: newCancel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices(); 
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error toggling cancel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    setActionLoading(serviceId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadServices(); 
      fetchStats();
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateService = async () => {
    if (!serviceNames.en) {
      alert('Service name is required');
      return;
    }
    if (!formData.category_id) {
      alert('Category is required');
      return;
    }
    if (!formData.price) {
      alert('Price is required');
      return;
    }

    setActionLoading(0);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/services`,
        {
          name: serviceNames,
          description: serviceDescriptions,
          time: serviceTimes,
          ...formData,
          service_profit: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowCreateModal(false);
        await loadServices(); 
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating service:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    if (!serviceNames.en) {
      alert('Service name is required');
      return;
    }
    if (!formData.category_id) {
      alert('Category is required');
      return;
    }

    setActionLoading(selectedService.service_id);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`${API_URL}/admin/services/${selectedService.service_id}`,
        {
          name: serviceNames,
          description: serviceDescriptions,
          time: serviceTimes,
          ...formData,
          service_profit: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowEditModal(false);
        await loadServices(); 
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportServices = async () => {
    const selectedIds = Object.keys(selectedImportServices).filter(id => selectedImportServices[id]);
    if (selectedIds.length === 0) {
      alert('Please select at least one service to import');
      return;
    }

    if (!autoCreateCategories && !importCategory) {
      alert('Please select a category or enable auto-create categories');
      return;
    }

    const servicesToImport = providerServices.filter(s => selectedImportServices[s.service]);

    setActionLoading(0);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/services/import-from-provider`,
        {
          provider_id: parseInt(selectedProvider),
          services: servicesToImport,
          category_id: autoCreateCategories ? null : parseInt(importCategory),
          profit_percentage: importProfitPercentage,
          auto_create_categories: autoCreateCategories
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowImportModal(false);
        setSelectedProvider('');
        setProviderServices([]);
        setSelectedImportServices({});
        setAutoCreateCategories(false);
        await loadServices(); 
        fetchStats();
        fetchCategories();

        if (response.data.categories_created) {
          alert(`Successfully imported ${selectedIds.length} services and created ${response.data.categories_created} new categories!`);
        } else {
          alert(`Successfully imported ${selectedIds.length} services!`);
        }
      }
    } catch (error) {
      console.error('Error importing services:', error);
      alert('Failed to import services. Check console for details.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      alert('Category name is required');
      return;
    }

    setActionLoading(0);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/categories`,
        categoryForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowCategoryModal(false);
        setCategoryForm({
          name: '',
          icon_type: 'icon',
          icon_class: '',
          image_id: null,
          position: 'bottom'
        });
        fetchCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    await loadServices();
    fetchStats();
    fetchCategories();
    setLoading(false);
  };

  const openDropdown = (e: React.MouseEvent, serviceId: number) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const isMobile = window.innerWidth < 768;

    let top = rect.bottom + window.scrollY;
    const dropdownHeight = 400;

    if (top + dropdownHeight > viewportHeight + window.scrollY) {
      top = rect.top + window.scrollY - dropdownHeight;
    }

    if (isMobile) {
      setDropdownPosition({
        top: Math.max(10, top),
        left: window.innerWidth / 2 - 112,
      });
    } else {
      setDropdownPosition({
        top: top,
        left: rect.right - 200,
      });
    }

    setActiveDropdown(serviceId);
  };


  const parsePrice = (price: number | string): number => {
    if (typeof price === 'string') {
      return parseFloat(price.replace(/,/g, ''));
    }
    return price;
  };

  const getStatusBadge = (status: string) => {
    return status === '2' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
        <XCircle className="w-3 h-3" /> Inactive
      </span>
    );
  };

  const getSecretBadge = (secret: string) => {
    return secret === '1' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium border border-purple-500/30">
        <Lock className="w-3 h-3" /> Secret
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
        <Unlock className="w-3 h-3" /> Public
      </span>
    );
  };

  const getRefillBadge = (refill: string) => {
    return refill === 'true' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
        <RefreshCcw className="w-3 h-3" /> Refill
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
        <X className="w-3 h-3" /> No Refill
      </span>
    );
  };

  const getCancelBadge = (cancel: string) => {
    return cancel === '1' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium border border-orange-500/30">
        <Ban className="w-3 h-3" /> Cancel
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
        <X className="w-3 h-3" /> No Cancel
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs');
  };

  const StatCard = ({ label, count, icon: Icon, color, onClick, active }: any) => (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} border ${active ? 'border-brand ring-2 ring-brand/20' : 'border-white/10'} rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${active ? 'bg-brand/20' : 'bg-white/5'}`}>
          <Icon className={`w-5 h-5 ${active ? 'text-brand' : 'text-white/80'}`} />
        </div>
        <span className="text-2xl font-bold text-white">{count}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </motion.div>
  );

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/admin/services/sync-prices`,
        { auto_update: autoUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSyncResults(response.data.results);
        await loadServices();

        if (autoUpdate) {
          alert(`Sync complete! ${response.data.results.updated} services updated, ${response.data.results.unchanged} unchanged, ${response.data.results.failed} failed.`);
          setShowSyncModal(false);
        }
      }
    } catch (error) {
      console.error('Error syncing prices:', error);
      alert('Failed to sync prices. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyPriceUpdates = async () => {
    const selectedIds = Object.keys(selectedUpdates)
      .filter(id => selectedUpdates[parseInt(id)])
      .map(id => parseInt(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one service to update');
      return;
    }

    setApplyingUpdates(true);
    try {
      const token = localStorage.getItem('adminToken');

      const updatesToApply = syncResults.updates.filter(
        (u: any) => selectedIds.includes(u.service_id)
      );

      const response = await axios.post(
        `${API_URL}/admin/services/apply-price-updates`,
        { updates: updatesToApply },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`Successfully updated ${response.data.updated} services!`);
        await loadServices(); 
        setShowSyncModal(false);
        setSyncResults(null);
        setSelectedUpdates({});
      }
    } catch (error) {
      console.error('Error applying updates:', error);
      alert('Failed to apply updates. Check console for details.');
    } finally {
      setApplyingUpdates(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const packageOptions = [
    { value: 'all', label: 'All Packages' },
    { value: '1', label: 'Default' },
    { value: '2', label: 'Custom' },
    { value: '3', label: 'Comments' },
    { value: '4', label: 'Package' },
    { value: '5', label: 'Package+' },
    { value: '6', label: 'Drip-feed' },
    { value: '7', label: 'Subscription' },
    { value: '11', label: 'Subscription' },
    { value: '12', label: 'Subscription+' },
    { value: '14', label: 'Package' },
    { value: '15', label: 'Package+' }
  ];

  const bulkActionOptions = [
    { value: 'activate', label: 'Activate' },
    { value: 'deactivate', label: 'Deactivate' },
    { value: 'secret', label: 'Make Secret' },
    { value: 'public', label: 'Make Public' },
    { value: 'refill-enable', label: 'Enable Refill' },
    { value: 'refill-disable', label: 'Disable Refill' },
    { value: 'cancel-enable', label: 'Enable Cancel' },
    { value: 'cancel-disable', label: 'Disable Cancel' },
    { value: 'delete', label: 'Delete' }
  ];

  const speedOptions = [
    { value: '1', label: 'Very Slow' },
    { value: '2', label: 'Slow' },
    { value: '3', label: 'Medium' },
    { value: '4', label: 'Fast' }
  ];

  const dripfeedOptions = [
    { value: '1', label: 'Disabled' },
    { value: '2', label: 'Enabled' }
  ];

  const booleanOptions = [
    { value: '1', label: 'Yes' },
    { value: '2', label: 'No' }
  ];

  const startCountOptions = [
    { value: 'none', label: 'None' },
    { value: 'instagram_follower', label: 'Instagram Follower' },
    { value: 'instagram_photo', label: 'Instagram Photo' }
  ];

  if (loading && allServices.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-6 h-6 text-brand animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 animate-pulse">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeTickets={0}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 min-h-screen flex flex-col bg-[#0A0A0A]`}>
        {/* Header */}
<AdminHeader
  title="Services Management"
  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
  onMobileMenuClick={() => setMobileSidebarOpen(true)}
  activeTickets={0} 
/>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {/* Header with Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/20 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Services</h2>
                <p className="text-sm text-gray-500">Total {stats.total} services available</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all duration-200 border border-purple-500/20 hover:border-purple-500/30"
              >
                <FolderTree className="w-4 h-4" />
                <span className="hidden sm:inline">New Category</span>
              </button>
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setSelectedProvider('');
                  setProviderServices([]);
                  setSelectedImportServices({});
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-500/20 hover:border-blue-500/30"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setServiceNames({ en: '' });
                  setServiceDescriptions({ en: '' });
                  setServiceTimes({ en: 'Not enough data' });
                  setFormData({
                    category_id: '',
                    package_type: '1',
                    price: 0,
                    min: 0,
                    max: 0,
                    provider_id: '',
                    api_service_id: '',
                    secret: '2',
                    show_refill: 'false',
                    cancelbutton: '2',
                    speed: '1',
                    dripfeed: '1',
                    instagram_second: '2',
                    start_count: 'none',
                    instagram_private: '1',
                    want_username: '1',
                    refill_days: '30',
                    refill_hours: '24',
                    autotime: 0,
                    autopost: 0,
                    overflow: 0,
                    sync: '1'
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-sm font-medium transition-all duration-200 border border-brand/20 hover:border-brand/30"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Service</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium transition-all duration-200 border border-amber-500/20 hover:border-amber-500/30"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Sync Prices</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            <StatCard
              label="Total Services"
              count={stats.total}
              color="from-gray-600/20 to-gray-700/20"
              icon={Package}
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedSecret('all');
                setSelectedRefill('all');
                setSelectedCancel('all');
              }}
              active={selectedStatus === 'all' && selectedCategory === 'all' && selectedPackage === 'all' && selectedSecret === 'all' && selectedRefill === 'all' && selectedCancel === 'all'}
            />
            <StatCard
              label="Active"
              count={stats.active}
              color="from-green-600/20 to-green-700/20"
              icon={CheckCircle}
              onClick={() => {
                setSelectedStatus('active');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedSecret('all');
                setSelectedRefill('all');
                setSelectedCancel('all');
              }}
              active={selectedStatus === 'active'}
            />
            <StatCard
              label="Inactive"
              count={stats.inactive}
              color="from-gray-600/20 to-gray-700/20"
              icon={XCircle}
              onClick={() => {
                setSelectedStatus('inactive');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedSecret('all');
                setSelectedRefill('all');
                setSelectedCancel('all');
              }}
              active={selectedStatus === 'inactive'}
            />
            <StatCard
              label="Secret"
              count={stats.secret}
              color="from-purple-600/20 to-purple-700/20"
              icon={Lock}
              onClick={() => {
                setSelectedSecret('secret');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedRefill('all');
                setSelectedCancel('all');
              }}
              active={selectedSecret === 'secret'}
            />
            <StatCard
              label="Public"
              count={stats.public}
              color="from-blue-600/20 to-blue-700/20"
              icon={Unlock}
              onClick={() => {
                setSelectedSecret('public');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedRefill('all');
                setSelectedCancel('all');
              }}
              active={selectedSecret === 'public'}
            />
            <StatCard
              label="Refill"
              count={stats.refill_enabled}
              color="from-green-600/20 to-green-700/20"
              icon={RefreshCcw}
              onClick={() => {
                setSelectedRefill('true');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedSecret('all');
                setSelectedCancel('all');
              }}
              active={selectedRefill === 'true'}
            />
            <StatCard
              label="Cancel"
              count={stats.cancel_enabled}
              color="from-orange-600/20 to-orange-700/20"
              icon={Ban}
              onClick={() => {
                setSelectedCancel('1');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPackage('all');
                setSelectedSecret('all');
                setSelectedRefill('all');
              }}
              active={selectedCancel === '1'}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80 shrink-0">
              <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-brand" />
                    Categories
                  </h3>
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-400">{categories.length} total</span>
                </div>
                <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery(''); 
                      setCurrentPage(1); 
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-brand/20 to-purple-600/20 text-white border border-brand/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>All Categories</span>
                    </div>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                      {stats.total}
                    </span>
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.category_id}
                      onClick={() => {
                        setSelectedCategory(category.category_id.toString());
                        setSearchQuery('');
                        setCurrentPage(1); 
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${selectedCategory === category.category_id.toString()
                        ? 'bg-gradient-to-r from-brand/20 to-purple-600/20 text-white border border-brand/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1">
                        <PlatformIcon categoryName={category.category_name} />
                        <span className="truncate">{category.category_name}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                          {category.service_count || 0}
                        </span>
                        {category.category_type === '1' && (
                          <EyeOff className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by service name, ID, or category..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <CustomSelect
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusOptions}
                    icon={<Filter className="w-4 h-4" />}
                    className="w-full sm:w-44"
                  />

                  <CustomSelect
                    value={selectedPackage}
                    onChange={setSelectedPackage}
                    options={packageOptions}
                    icon={<Package className="w-4 h-4" />}
                    className="w-full sm:w-44"
                  />
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Secret Status</label>
                          <CustomSelect
                            value={selectedSecret}
                            onChange={setSelectedSecret}
                            options={[
                              { value: 'all', label: 'All' },
                              { value: 'secret', label: 'Secret' },
                              { value: 'public', label: 'Public' }
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Refill Status</label>
                          <CustomSelect
                            value={selectedRefill}
                            onChange={setSelectedRefill}
                            options={[
                              { value: 'all', label: 'All' },
                              { value: 'true', label: 'Enabled' },
                              { value: 'false', label: 'Disabled' }
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Cancel Status</label>
                          <CustomSelect
                            value={selectedCancel}
                            onChange={setSelectedCancel}
                            options={[
                              { value: 'all', label: 'All' },
                              { value: '1', label: 'Enabled' },
                              { value: '2', label: 'Disabled' }
                            ]}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          onClick={() => setShowFilters(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bulk Actions */}
              {selectedServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-brand/10 border border-brand/30 rounded-xl flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      {selectedServices.length} service(s) selected
                    </span>
                    <button
                      onClick={() => {
                        setSelectedServices([]);
                        setSelectAll(false);
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <CustomSelect
                      value={bulkAction}
                      onChange={setBulkAction}
                      options={bulkActionOptions}
                      placeholder="Bulk Actions"
                      className="w-48"
                    />
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || actionLoading !== null}
                      className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Services Table */}
              <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl overflow-hidden">
                <div
                  ref={tableContainerRef}
                  className="overflow-x-auto overflow-y-auto custom-scrollbar"
                  style={{ maxHeight: 'calc(100vh - 350px)' }}
                >
                  <table className="w-full min-w-[1400px]">
                    <thead className="bg-white/5 sticky top-0 z-20">
                      <tr>
                        <th className="w-10 py-4 px-3">
                          <button
                            onClick={() => setSelectAll(!selectAll)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {selectAll ? <CheckSquare className="w-4 h-4 text-brand" /> : <Square className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Package</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Min/Max</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Speed</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Refill</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cancel</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Provider</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">API ID</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedServices.length > 0 ? (
                        displayedServices.map((service, index) => (
                          <motion.tr
                            key={service.service_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-t border-white/5 hover:bg-white/5 transition-colors group"
                          >
                            <td className="py-3 px-3">
                              <button
                                onClick={() => {
                                  if (selectedServices.includes(service.service_id)) {
                                    setSelectedServices(selectedServices.filter(id => id !== service.service_id));
                                  } else {
                                    setSelectedServices([...selectedServices, service.service_id]);
                                  }
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                {selectedServices.includes(service.service_id) ?
                                  <CheckSquare className="w-4 h-4 text-brand" /> :
                                  <Square className="w-4 h-4" />
                                }
                              </button>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm font-mono font-medium text-brand">#{service.service_id}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-sm text-white max-w-[200px] truncate" title={service.service_name}>
                                {service.service_name}
                                {service.is_new === 1 && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">NEW</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <PlatformIcon categoryName={service.category_name || ''} />
                                <span className="text-sm text-gray-300 max-w-[120px] truncate" title={service.category_name}>
                                  {service.category_name || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <PackageTypeBadge type={service.service_package} />
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm font-bold text-green-400">
                                {formatCurrency(parsePrice(service.service_price), 'LKR')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-gray-300">
                                {service.service_min} / {service.service_max}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <SpeedBadge speed={service.service_speed} />
                            </td>
                            <td className="py-3 px-3">
                              {getStatusBadge(service.service_type)}
                            </td>
                            <td className="py-3 px-3">
                              {getRefillBadge(service.show_refill)}
                            </td>
                            <td className="py-3 px-3">
                              {getCancelBadge(service.cancelbutton)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-gray-300 max-w-[100px] truncate block" title={service.provider_name}>
                                {service.provider_name || 'Manual'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm font-mono text-purple-400">
                                {service.api_service > 0 ? `#${service.api_service}` : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedService(service);
                                    setShowDetailsModal(true);
                                  }}
                                  className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group/tooltip relative"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-gray-400 group-hover/tooltip:text-brand" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedService(service);
                                    try {
                                      setServiceNames(typeof service.name_lang === 'string' ? JSON.parse(service.name_lang) : service.name_lang || { en: service.service_name });
                                      setServiceDescriptions(typeof service.description_lang === 'string' ? JSON.parse(service.description_lang) : service.description_lang || { en: '' });
                                      setServiceTimes(typeof service.time_lang === 'string' ? JSON.parse(service.time_lang) : service.time_lang || { en: 'Not enough data' });
                                    } catch (e) {
                                      setServiceNames({ en: service.service_name });
                                      setServiceDescriptions({ en: '' });
                                      setServiceTimes({ en: 'Not enough data' });
                                    }
                                    setFormData({
                                      category_id: service.category_id.toString(),
                                      package_type: service.service_package.toString(),
                                      price: parseFloat(service.service_price.toString()),
                                      min: service.service_min,
                                      max: service.service_max,
                                      provider_id: service.service_api?.toString() || '',
                                      api_service_id: service.api_service?.toString() || '',
                                      secret: service.service_secret,
                                      show_refill: service.show_refill,
                                      cancelbutton: service.cancelbutton,
                                      speed: service.service_speed,
                                      dripfeed: service.service_dripfeed,
                                      instagram_second: service.instagram_second,
                                      start_count: service.start_count,
                                      instagram_private: service.instagram_private,
                                      want_username: service.want_username,
                                      refill_days: service.refill_days,
                                      refill_hours: service.refill_hours,
                                      autotime: service.service_autotime || 0,
                                      autopost: service.service_autopost || 0,
                                      overflow: service.service_overflow || 0,
                                      sync: service.service_sync || '1'
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group/tooltip relative"
                                  title="Edit Service"
                                >
                                  <Edit className="w-4 h-4 text-gray-400 group-hover/tooltip:text-brand" />
                                </button>

                                <button
                                  onClick={(e) => openDropdown(e, service.service_id)}
                                  className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group/tooltip relative"
                                  title="More Actions"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-400 group-hover/tooltip:text-brand" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={14} className="py-12 text-center">
                            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No services found</p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedStatus('all');
                                setSelectedPackage('all');
                                setSelectedSecret('all');
                                setSelectedRefill('all');
                                setSelectedCancel('all');
                              }}
                              className="mt-2 text-sm text-brand hover:underline"
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Load More Button */}
                {hasMore && displayedServices.length > 0 && (
                  <div className="flex justify-center py-4 border-t border-white/10">
                    <button
                      onClick={loadMore}
                      className="px-6 py-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-sm font-medium transition-all duration-200 border border-brand/20 hover:border-brand/30 flex items-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Load More Services ({filteredServices.length - displayedServices.length} remaining)
                    </button>
                  </div>
                )}

                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Showing:</span>
                    <span className="text-sm text-white font-medium">
                      {displayedServices.length} of {filteredServices.length} services
                    </span>
                  </div>

                  {filteredServices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDisplayLimit(30)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${displayLimit === 30
                          ? 'bg-brand text-white shadow-lg shadow-brand/20'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                      >
                        30
                      </button>
                      <button
                        onClick={() => setDisplayLimit(50)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${displayLimit === 50
                          ? 'bg-brand text-white shadow-lg shadow-brand/20'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                      >
                        50
                      </button>
                      <button
                        onClick={() => setDisplayLimit(100)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${displayLimit === 100
                          ? 'bg-brand text-white shadow-lg shadow-brand/20'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                      >
                        100
                      </button>
                      <span className="text-sm text-gray-400 ml-2">per page</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Dropdown Menu */}
      {activeDropdown && dropdownPosition && ReactDOM.createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
            onClick={() => {
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
          />

          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
            className="md:left-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-56 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2.5 bg-white/5 border-b border-white/10">
                <p className="text-xs font-medium text-gray-400">
                  Actions for #{displayedServices.find(s => s.service_id === activeDropdown)?.service_id}
                </p>
              </div>

              <div className="p-1">
                {(() => {
                  const service = displayedServices.find(s => s.service_id === activeDropdown);
                  if (!service) return null;

                  return (
                    <>
                      <button
                        onClick={() => handleToggleStatus(activeDropdown, service.service_type)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-green-500/20 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20">
                          {service.service_type === '2' ? <XCircle className="w-3 h-3 text-green-400" /> : <CheckCircle className="w-3 h-3 text-green-400" />}
                        </div>
                        <span className="flex-1 text-left">
                          {service.service_type === '2' ? 'Deactivate' : 'Activate'}
                        </span>
                        {actionLoading === activeDropdown && (
                          <Loader className="w-3 h-3 animate-spin text-gray-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleSecret(activeDropdown, service.service_secret)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-purple-500/20 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20">
                          {service.service_secret === '1' ? <Unlock className="w-3 h-3 text-purple-400" /> : <Lock className="w-3 h-3 text-purple-400" />}
                        </div>
                        <span className="flex-1 text-left">
                          {service.service_secret === '1' ? 'Make Public' : 'Make Secret'}
                        </span>
                      </button>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={() => handleToggleRefill(activeDropdown, service.show_refill)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-green-500/20 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20">
                          <RefreshCcw className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="flex-1 text-left">
                          {service.show_refill === 'true' ? 'Disable Refill' : 'Enable Refill'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleToggleCancel(activeDropdown, service.cancelbutton)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-orange-500/20 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20">
                          <Ban className="w-3 h-3 text-orange-400" />
                        </div>
                        <span className="flex-1 text-left">
                          {service.cancelbutton === '1' ? 'Disable Cancel' : 'Enable Cancel'}
                        </span>
                      </button>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={() => handleDeleteService(activeDropdown)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </div>
                        <span className="flex-1 text-left">Delete</span>
                      </button>
                    </>
                  );
                })()}
              </div>

              <div className="px-3 py-2 bg-white/5 border-t border-white/10">
                <p className="text-[10px] text-gray-500">
                  Updated: {format(new Date(), 'HH:mm')}
                </p>
              </div>
            </motion.div>
          </div>
        </>,
        document.body
      )}

      {/* ============= Create Service Modal ============= */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-xl">
                      <Plus className="w-5 h-5 text-brand" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Create New Service</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Service Name (English) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={serviceNames.en}
                    onChange={(e) => setServiceNames({ en: e.target.value })}
                    placeholder="Enter service name"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description (English)</label>
                  <textarea
                    value={serviceDescriptions.en}
                    onChange={(e) => setServiceDescriptions({ en: e.target.value })}
                    placeholder="Enter service description"
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all resize-none"
                  />
                </div>

                {/* Time Estimate */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Time Estimate</label>
                  <input
                    type="text"
                    value={serviceTimes.en}
                    onChange={(e) => setServiceTimes({ en: e.target.value })}
                    placeholder="e.g., 1-2 hours"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                  />
                </div>

                {/* Category and Package Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category <span className="text-red-400">*</span></label>
                    <CustomSelect
                      value={formData.category_id}
                      onChange={(value) => setFormData({ ...formData, category_id: value })}
                      options={categories.map(cat => ({ value: cat.category_id.toString(), label: cat.category_name }))}
                      placeholder="Select Category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Package Type</label>
                    <CustomSelect
                      value={formData.package_type}
                      onChange={(value) => setFormData({ ...formData, package_type: value })}
                      options={packageOptions.filter(o => o.value !== 'all')}
                    />
                  </div>
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Price (LKR per 1000) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Min Quantity</label>
                    <input
                      type="number"
                      value={formData.min}
                      onChange={(e) => setFormData({ ...formData, min: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Max Quantity</label>
                    <input
                      type="number"
                      value={formData.max}
                      onChange={(e) => setFormData({ ...formData, max: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Speed</label>
                  <CustomSelect
                    value={formData.speed}
                    onChange={(value) => setFormData({ ...formData, speed: value })}
                    options={speedOptions}
                  />
                </div>

                {/* Provider Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Provider</label>
                    <CustomSelect
                      value={formData.provider_id}
                      onChange={(value) => setFormData({ ...formData, provider_id: value })}
                      options={[
                        { value: '', label: 'Manual (No Provider)' },
                        ...providers.map(p => ({ value: p.id.toString(), label: p.api_name }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">API Service ID</label>
                    <input
                      type="text"
                      value={formData.api_service_id}
                      onChange={(e) => setFormData({ ...formData, api_service_id: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Visibility</label>
                    <CustomSelect
                      value={formData.secret}
                      onChange={(value) => setFormData({ ...formData, secret: value })}
                      options={[
                        { value: '2', label: 'Public' },
                        { value: '1', label: 'Secret' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Button</label>
                    <CustomSelect
                      value={formData.show_refill}
                      onChange={(value) => setFormData({ ...formData, show_refill: value })}
                      options={[
                        { value: 'false', label: 'Disabled' },
                        { value: 'true', label: 'Enabled' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Cancel Button</label>
                    <CustomSelect
                      value={formData.cancelbutton}
                      onChange={(value) => setFormData({ ...formData, cancelbutton: value })}
                      options={[
                        { value: '2', label: 'Disabled' },
                        { value: '1', label: 'Enabled' }
                      ]}
                    />
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Drip-feed</label>
                    <CustomSelect
                      value={formData.dripfeed}
                      onChange={(value) => setFormData({ ...formData, dripfeed: value })}
                      options={dripfeedOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Want Username</label>
                    <CustomSelect
                      value={formData.want_username}
                      onChange={(value) => setFormData({ ...formData, want_username: value })}
                      options={booleanOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram Second</label>
                    <CustomSelect
                      value={formData.instagram_second}
                      onChange={(value) => setFormData({ ...formData, instagram_second: value })}
                      options={booleanOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Count</label>
                    <CustomSelect
                      value={formData.start_count}
                      onChange={(value) => setFormData({ ...formData, start_count: value })}
                      options={startCountOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram Private</label>
                    <CustomSelect
                      value={formData.instagram_private}
                      onChange={(value) => setFormData({ ...formData, instagram_private: value })}
                      options={booleanOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Days</label>
                    <input
                      type="number"
                      value={formData.refill_days}
                      onChange={(e) => setFormData({ ...formData, refill_days: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Hours</label>
                    <input
                      type="number"
                      value={formData.refill_hours}
                      onChange={(e) => setFormData({ ...formData, refill_hours: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Overflow</label>
                    <input
                      type="number"
                      value={formData.overflow}
                      onChange={(e) => setFormData({ ...formData, overflow: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateService}
                    disabled={actionLoading === 0}
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 0 ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Create Service
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Edit Service Modal ============= */}
      <AnimatePresence>
        {showEditModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-xl">
                      <Edit3 className="w-5 h-5 text-brand" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Edit Service #{selectedService.service_id}</h2>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Service Name (English) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={serviceNames.en}
                    onChange={(e) => setServiceNames({ en: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description (English)</label>
                  <textarea
                    value={serviceDescriptions.en}
                    onChange={(e) => setServiceDescriptions({ en: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all resize-none"
                  />
                </div>

                {/* Time Estimate */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Time Estimate</label>
                  <input
                    type="text"
                    value={serviceTimes.en}
                    onChange={(e) => setServiceTimes({ en: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                  />
                </div>

                {/* Category and Package Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category <span className="text-red-400">*</span></label>
                    <CustomSelect
                      value={formData.category_id}
                      onChange={(value) => setFormData({ ...formData, category_id: value })}
                      options={categories.map(cat => ({ value: cat.category_id.toString(), label: cat.category_name }))}
                      placeholder="Select Category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Package Type</label>
                    <CustomSelect
                      value={formData.package_type}
                      onChange={(value) => setFormData({ ...formData, package_type: value })}
                      options={packageOptions.filter(o => o.value !== 'all')}
                    />
                  </div>
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Price (LKR per 1000) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Min Quantity</label>
                    <input
                      type="number"
                      value={formData.min}
                      onChange={(e) => setFormData({ ...formData, min: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Max Quantity</label>
                    <input
                      type="number"
                      value={formData.max}
                      onChange={(e) => setFormData({ ...formData, max: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Speed</label>
                  <CustomSelect
                    value={formData.speed}
                    onChange={(value) => setFormData({ ...formData, speed: value })}
                    options={speedOptions}
                  />
                </div>

                {/* Provider Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Provider</label>
                    <CustomSelect
                      value={formData.provider_id}
                      onChange={(value) => setFormData({ ...formData, provider_id: value })}
                      options={[
                        { value: '', label: 'Manual (No Provider)' },
                        ...providers.map(p => ({ value: p.id.toString(), label: p.api_name }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">API Service ID</label>
                    <input
                      type="text"
                      value={formData.api_service_id}
                      onChange={(e) => setFormData({ ...formData, api_service_id: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Visibility</label>
                    <CustomSelect
                      value={formData.secret}
                      onChange={(value) => setFormData({ ...formData, secret: value })}
                      options={[
                        { value: '2', label: 'Public' },
                        { value: '1', label: 'Secret' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Button</label>
                    <CustomSelect
                      value={formData.show_refill}
                      onChange={(value) => setFormData({ ...formData, show_refill: value })}
                      options={[
                        { value: 'false', label: 'Disabled' },
                        { value: 'true', label: 'Enabled' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Cancel Button</label>
                    <CustomSelect
                      value={formData.cancelbutton}
                      onChange={(value) => setFormData({ ...formData, cancelbutton: value })}
                      options={[
                        { value: '2', label: 'Disabled' },
                        { value: '1', label: 'Enabled' }
                      ]}
                    />
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Drip-feed</label>
                    <CustomSelect
                      value={formData.dripfeed}
                      onChange={(value) => setFormData({ ...formData, dripfeed: value })}
                      options={dripfeedOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Want Username</label>
                    <CustomSelect
                      value={formData.want_username}
                      onChange={(value) => setFormData({ ...formData, want_username: value })}
                      options={booleanOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram Second</label>
                    <CustomSelect
                      value={formData.instagram_second}
                      onChange={(value) => setFormData({ ...formData, instagram_second: value })}
                      options={booleanOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Count</label>
                    <CustomSelect
                      value={formData.start_count}
                      onChange={(value) => setFormData({ ...formData, start_count: value })}
                      options={startCountOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram Private</label>
                    <CustomSelect
                      value={formData.instagram_private}
                      onChange={(value) => setFormData({ ...formData, instagram_private: value })}
                      options={booleanOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Days</label>
                    <input
                      type="number"
                      value={formData.refill_days}
                      onChange={(e) => setFormData({ ...formData, refill_days: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Refill Hours</label>
                    <input
                      type="number"
                      value={formData.refill_hours}
                      onChange={(e) => setFormData({ ...formData, refill_hours: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Overflow</label>
                    <input
                      type="number"
                      value={formData.overflow}
                      onChange={(e) => setFormData({ ...formData, overflow: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateService}
                    disabled={actionLoading === selectedService.service_id}
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedService.service_id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update Service
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Import Services Modal ============= */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <DownloadIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Import Services from Provider</h2>
                  </div>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Provider Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Provider <span className="text-red-400">*</span></label>
                    <CustomSelect
                      value={selectedProvider}
                      onChange={(value) => {
                        setSelectedProvider(value);
                        if (value) {
                          fetchProviderServices(value);
                        }
                      }}
                      options={providers.map(p => ({ value: p.id.toString(), label: p.api_name }))}
                      placeholder="Choose provider..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Profit Percentage (%)</label>
                    <input
                      type="number"
                      value={importProfitPercentage}
                      onChange={(e) => setImportProfitPercentage(parseInt(e.target.value))}
                      min="0"
                      max="1000"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Category Options */}
                <div className="space-y-3 bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-brand" />
                    Category Options
                  </h3>

                  <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <input
                      type="radio"
                      id="selectCategory"
                      name="categoryOption"
                      checked={!autoCreateCategories}
                      onChange={() => setAutoCreateCategories(false)}
                      className="w-4 h-4 text-brand focus:ring-brand"
                    />
                    <label htmlFor="selectCategory" className="text-sm text-white flex-1">
                      Import to selected category
                    </label>
                  </div>

                  {!autoCreateCategories && (
                    <div className="ml-7 mt-2">
                      <CustomSelect
                        value={importCategory}
                        onChange={setImportCategory}
                        options={categories.map(c => ({ value: c.category_id.toString(), label: c.category_name }))}
                        placeholder="Select category..."
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <input
                      type="radio"
                      id="autoCreate"
                      name="categoryOption"
                      checked={autoCreateCategories}
                      onChange={() => setAutoCreateCategories(true)}
                      className="w-4 h-4 text-brand focus:ring-brand"
                    />
                    <label htmlFor="autoCreate" className="text-sm text-white flex-1">
                      Auto-create categories from provider
                    </label>
                  </div>

                  {autoCreateCategories && providerServices.length > 0 && (
                    <div className="mt-3 bg-black/50 rounded-lg p-4">
                      <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <FolderTree className="w-3 h-3" />
                        Categories to be created:
                      </h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {Array.from(new Set(providerServices.map(s => s.category || 'Uncategorized'))).map(cat => (
                          <div key={cat} className="flex items-center gap-2 text-sm py-1">
                            <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                            <span className="text-white">{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Services List */}
                {fetchingProviderServices ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-10 h-10 animate-spin text-brand mb-3" />
                    <p className="text-sm text-gray-400">Fetching services from provider...</p>
                  </div>
                ) : providerServices.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Available Services</h3>
                      <button
                        onClick={() => {
                          const allSelected = Object.keys(selectedImportServices).length === providerServices.length;
                          const newSelected: Record<string, boolean> = {};
                          if (!allSelected) {
                            providerServices.forEach(s => {
                              newSelected[s.service] = true;
                            });
                          }
                          setSelectedImportServices(newSelected);
                        }}
                        className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-brand rounded-lg transition-colors"
                      >
                        {Object.keys(selectedImportServices).length === providerServices.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/10 custom-scrollbar">
                      {providerServices.map((service) => (
                        <div key={service.service} className="flex items-start gap-3 p-4 hover:bg-white/5 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedImportServices[service.service] || false}
                            onChange={(e) => setSelectedImportServices({
                              ...selectedImportServices,
                              [service.service]: e.target.checked
                            })}
                            className="mt-1 w-4 h-4 rounded border-white/10 bg-black/30 text-brand focus:ring-brand"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-white truncate">{service.name}</p>
                              <PackageTypeBadge type={service.type || '1'} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-white/5 rounded-full">Rate: {service.rate}</span>
                              <span className="px-2 py-1 bg-white/5 rounded-full">Min: {service.min}</span>
                              <span className="px-2 py-1 bg-white/5 rounded-full">Max: {service.max}</span>
                              <span className="px-2 py-1 bg-white/5 rounded-full">Refill: {service.refill === '1' ? 'Yes' : 'No'}</span>
                            </div>
                            {service.category && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <FolderTree className="w-3 h-3" />
                                <span className="truncate">{service.category}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedProvider ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No services found from this provider</p>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportServices}
                    disabled={
                      !selectedProvider ||
                      (!autoCreateCategories && !importCategory) ||
                      Object.keys(selectedImportServices).length === 0 ||
                      actionLoading !== null
                    }
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 0 ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="w-4 h-4" />
                    )}
                    Import {Object.keys(selectedImportServices).length} {Object.keys(selectedImportServices).length === 1 ? 'Service' : 'Services'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Category Modal ============= */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <FolderTree className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Create New Category</h2>
                  </div>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Instagram Followers"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                  />
                </div>

                {/* Icon Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Icon Type</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-3 p-3 bg-black/30 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="icon_type"
                        value="icon"
                        checked={categoryForm.icon_type === 'icon'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, icon_type: e.target.value })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-white">CSS Icon</span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 p-3 bg-black/30 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="icon_type"
                        value="image"
                        checked={categoryForm.icon_type === 'image'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, icon_type: e.target.value })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-white">Image</span>
                    </label>
                  </div>
                </div>

                {/* Icon Class or Image */}
                {categoryForm.icon_type === 'icon' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Icon Class</label>
                    <input
                      type="text"
                      value={categoryForm.icon_class}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon_class: e.target.value })}
                      placeholder="e.g., fab fa-instagram"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">Font Awesome or custom CSS class</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Upload Image</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-brand/30 transition-colors cursor-pointer">
                      <Image className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                      <input type="file" className="hidden" />
                    </div>
                  </div>
                )}

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Position</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-3 p-3 bg-black/30 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="position"
                        value="top"
                        checked={categoryForm.position === 'top'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, position: e.target.value })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-white">Top</span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 p-3 bg-black/30 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="position"
                        value="bottom"
                        checked={categoryForm.position === 'bottom'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, position: e.target.value })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-white">Bottom</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    disabled={!categoryForm.name || actionLoading !== null}
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 0 ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Create Category
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Service Details Modal ============= */}
      <AnimatePresence>
        {showDetailsModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-xl">
                      <Eye className="w-5 h-5 text-brand" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Service Details #{selectedService.service_id}</h2>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Service ID</p>
                    <p className="text-lg font-bold text-brand">#{selectedService.service_id}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Category</p>
                    <div className="flex items-center gap-2">
                      <PlatformIcon categoryName={selectedService.category_name || ''} />
                      <p className="text-lg font-bold text-white truncate">{selectedService.category_name}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Package Type</p>
                    <div className="mt-1">
                      <PackageTypeBadge type={selectedService.service_package} />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedService.service_type)}</div>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Price (per 1000)</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(parsePrice(selectedService.service_price), 'LKR')}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Min Quantity</p>
                    <p className="text-lg font-bold text-white">{selectedService.service_min}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Max Quantity</p>
                    <p className="text-lg font-bold text-white">{selectedService.service_max}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Speed</p>
                    <div className="mt-1">
                      <SpeedBadge speed={selectedService.service_speed} />
                    </div>
                  </div>
                </div>

                {/* Toggle Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Visibility</p>
                    <div className="mt-1">{getSecretBadge(selectedService.service_secret)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Refill Button</p>
                    <div className="mt-1">{getRefillBadge(selectedService.show_refill)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Cancel Button</p>
                    <div className="mt-1">{getCancelBadge(selectedService.cancelbutton)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Drip-feed</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                      <Repeat className="w-3 h-3" />
                      {selectedService.service_dripfeed === '1' ? 'Disabled' : 'Enabled'}
                    </span>
                  </div>
                </div>

                {/* Service Name */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4 text-brand" />
                    Service Name
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-gray-300">{selectedService.service_name}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedService.service_description && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-brand" />
                      Description
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedService.service_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Time Estimate */}
                {selectedService.time && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-brand" />
                      Time Estimate
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-300">{selectedService.time}</p>
                    </div>
                  </div>
                )}

                {/* Provider Info */}
                {selectedService.provider_name && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4 text-brand" />
                        Provider Information
                      </h3>
                      <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Provider</span>
                          <span className="text-xs font-medium text-white bg-white/10 px-3 py-1.5 rounded-full">
                            {selectedService.provider_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">API Service ID</span>
                          <span className="text-xs font-mono font-medium text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full">
                            #{selectedService.api_service}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Provider Currency</span>
                          <span className="text-xs font-medium text-white bg-white/10 px-3 py-1.5 rounded-full">
                            {selectedService.provider_currency || 'LKR'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* API Details */}
                    {selectedService.api_detail && (
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Code className="w-4 h-4 text-brand" />
                          API Details
                        </h3>
                        <pre className="bg-black/50 rounded-xl p-4 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words max-h-60 overflow-y-auto custom-scrollbar border border-white/5">
                          {JSON.stringify(selectedService.api_detail, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedService.start_count !== 'none' && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Start Count</p>
                      <p className="text-sm font-medium text-white">{selectedService.start_count}</p>
                    </div>
                  )}
                  {selectedService.refill_days && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Refill Days</p>
                      <p className="text-sm font-medium text-white">{selectedService.refill_days}</p>
                    </div>
                  )}
                  {selectedService.refill_hours && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Refill Hours</p>
                      <p className="text-sm font-medium text-white">{selectedService.refill_hours}</p>
                    </div>
                  )}
                  {selectedService.service_autotime > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Auto Time</p>
                      <p className="text-sm font-medium text-white">{selectedService.service_autotime}</p>
                    </div>
                  )}
                  {selectedService.service_autopost > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Auto Post</p>
                      <p className="text-sm font-medium text-white">{selectedService.service_autopost}</p>
                    </div>
                  )}
                  {selectedService.is_new === 1 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-green-500/30">
                      <p className="text-xs text-gray-400 mb-1">New Service</p>
                      <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                        <Star className="w-4 h-4" /> New
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedService(selectedService);
                      try {
                        setServiceNames(typeof selectedService.name_lang === 'string' ? JSON.parse(selectedService.name_lang) : selectedService.name_lang || { en: selectedService.service_name });
                        setServiceDescriptions(typeof selectedService.description_lang === 'string' ? JSON.parse(selectedService.description_lang) : selectedService.description_lang || { en: '' });
                        setServiceTimes(typeof selectedService.time_lang === 'string' ? JSON.parse(selectedService.time_lang) : selectedService.time_lang || { en: 'Not enough data' });
                      } catch (e) {
                        setServiceNames({ en: selectedService.service_name });
                        setServiceDescriptions({ en: '' });
                        setServiceTimes({ en: 'Not enough data' });
                      }
                      setFormData({
                        category_id: selectedService.category_id.toString(),
                        package_type: selectedService.service_package.toString(),
                        price: parseFloat(selectedService.service_price.toString()),
                        min: selectedService.service_min,
                        max: selectedService.service_max,
                        provider_id: selectedService.service_api?.toString() || '',
                        api_service_id: selectedService.api_service?.toString() || '',
                        secret: selectedService.service_secret,
                        show_refill: selectedService.show_refill,
                        cancelbutton: selectedService.cancelbutton,
                        speed: selectedService.service_speed,
                        dripfeed: selectedService.service_dripfeed,
                        instagram_second: selectedService.instagram_second,
                        start_count: selectedService.start_count,
                        instagram_private: selectedService.instagram_private,
                        want_username: selectedService.want_username,
                        refill_days: selectedService.refill_days,
                        refill_hours: selectedService.refill_hours,
                        autotime: selectedService.service_autotime || 0,
                        autopost: selectedService.service_autopost || 0,
                        overflow: selectedService.service_overflow || 0,
                        sync: selectedService.service_sync || '1'
                      });
                      setShowEditModal(true);
                    }}
                    className="px-5 py-2.5 bg-brand/20 hover:bg-brand/30 text-brand rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-brand/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Service
                  </button>
                  <button
                    onClick={() => handleToggleStatus(selectedService.service_id, selectedService.service_type)}
                    className="px-5 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-green-500/30"
                  >
                    {selectedService.service_type === '2' ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteService(selectedService.service_id)}
                    className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Sync Prices Modal ============= */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !syncing && setShowSyncModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <RefreshCcw className="w-5 h-5 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Sync Provider Prices</h2>
                  </div>
                  <button
                    onClick={() => !syncing && setShowSyncModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    disabled={syncing}
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {!syncResults ? (
                  <>
                    <p className="text-sm text-gray-400">
                      This will check all active providers and compare their current prices with your services.
                      Services with price changes will be marked as <span className="text-amber-400 font-medium">NEW</span>.
                    </p>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoUpdate}
                          onChange={(e) => setAutoUpdate(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-black/30 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-white">Auto-update prices</span>
                          <p className="text-xs text-gray-500 mt-1">
                            If checked, prices will be automatically updated. Otherwise, services will only be marked as NEW for review.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Important Notes
                      </h3>
                      <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                        <li>Prices are recalculated using your current profit percentage</li>
                        <li>Services will be marked as NEW if prices change</li>
                        <li>Provider API details will be updated for all services</li>
                        <li>This may take a few minutes depending on the number of services</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowSyncModal(false)}
                        disabled={syncing}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSyncPrices}
                        disabled={syncing}
                        className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {syncing ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="w-4 h-4" />
                            Start Sync
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{syncResults.total_services}</p>
                        <p className="text-xs text-gray-400">Total Checked</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{syncResults.updated}</p>
                        <p className="text-xs text-gray-400">Price Changes</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{syncResults.unchanged}</p>
                        <p className="text-xs text-gray-400">Unchanged</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{syncResults.failed}</p>
                        <p className="text-xs text-gray-400">Failed</p>
                      </div>
                    </div>

                    {syncResults.updates && syncResults.updates.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-white">Price Changes Detected</h3>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const allSelected = syncResults.updates.every((u: any) => selectedUpdates[u.service_id]);
                                const newSelected: Record<number, boolean> = {};
                                if (!allSelected) {
                                  syncResults.updates.forEach((u: any) => {
                                    newSelected[u.service_id] = true;
                                  });
                                }
                                setSelectedUpdates(newSelected);
                              }}
                              className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-brand rounded-lg transition-colors"
                            >
                              {Object.keys(selectedUpdates).length === syncResults.updates.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/10 custom-scrollbar">
                          {syncResults.updates.map((update: any, index: number) => (
                            <div key={index} className="p-4 hover:bg-white/5 transition-colors">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedUpdates[update.service_id] || false}
                                  onChange={(e) => {
                                    setSelectedUpdates({
                                      ...selectedUpdates,
                                      [update.service_id]: e.target.checked
                                    });
                                  }}
                                  className="mt-1 w-4 h-4 rounded border-white/10 bg-black/30 text-brand focus:ring-brand"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">#{update.service_id}</span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                                      Pending Review
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2 truncate">{update.service_name}</p>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Old: <span className="text-gray-400 line-through">{formatCurrency(update.old_price)}</span></span>
                                    <ChevronRight className="w-3 h-3 text-gray-600" />
                                    <span className="text-gray-500">New: <span className="text-green-400 font-medium">{formatCurrency(update.new_price)}</span></span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    Provider rate: {formatCurrency(update.provider_rate)} | Profit: {update.profit_percent}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {syncResults.errors && syncResults.errors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-white mb-3 text-red-400">Errors</h3>
                        <div className="max-h-40 overflow-y-auto border border-red-500/20 rounded-xl divide-y divide-red-500/10 bg-red-500/5">
                          {syncResults.errors.map((error: any, index: number) => (
                            <div key={index} className="p-3 text-xs">
                              <p className="text-red-400 font-medium">
                                {error.service_name ? `#${error.service_id} - ${error.service_name}` : error.provider}
                              </p>
                              <p className="text-gray-400 mt-1">{error.error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowSyncModal(false);
                          setSyncResults(null);
                          setSelectedUpdates({});
                        }}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                      {!autoUpdate && syncResults.updates?.length > 0 && (
                        <button
                          onClick={handleApplyPriceUpdates}
                          disabled={applyingUpdates || Object.keys(selectedUpdates).length === 0}
                          className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {applyingUpdates ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Apply Selected ({Object.keys(selectedUpdates).length})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
            height: 3px;
          }
        }
        
        thead th {
          position: sticky;
          top: 0;
          background: rgba(31, 41, 55, 0.95);
          backdrop-filter: blur(8px);
          z-index: 10;
        }
        
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
      `}</style>
    </div>
  );
};

export default AdminServicesPage;
