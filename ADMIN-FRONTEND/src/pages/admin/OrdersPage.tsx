import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactDOM from 'react-dom';
import { 
  ShoppingBag, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Edit, MoreVertical, Download, RefreshCw, Clock, CheckCircle,
  AlertCircle, Play, Ban, Loader, XCircle, HelpCircle, Copy,
  ExternalLink, Calendar, DollarSign, User, Link as LinkIcon,
  Server, Shield, Settings, Plus, Trash2, Save, Edit3, CheckSquare,
  Square, Layers, Zap, Globe, Mail, Phone, MessageSquare, Menu,
  Bell, LogOut, Check, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                  option.value === value ? 'text-brand bg-brand/10' : 'text-gray-300'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && <Check className="w-4 h-4 text-brand" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left">
          {startDate || endDate 
            ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
            : 'Select Date Range'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 p-4 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl"
          >
            <div className="flex gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
interface ProfitRangeProps {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

const ProfitRange: React.FC<ProfitRangeProps> = ({
  min,
  max,
  onMinChange,
  onMaxChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors"
      >
        <DollarSign className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left">
          {min || max ? `Rs ${min || '0'} - Rs ${max || '∞'}` : 'Profit Range'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 p-4 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl"
          >
            <div className="flex gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min (Rs)</label>
                <input
                  type="number"
                  value={min}
                  onChange={(e) => onMinChange(e.target.value)}
                  placeholder="0"
                  className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max (Rs)</label>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => onMaxChange(e.target.value)}
                  placeholder="∞"
                  className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Order {
  order_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  service_id: number;
  service_name: string;
  order_quantity: number;
  order_charge: number;
  order_profit: number;
  order_url: string;
  order_status: 'pending' | 'processing' | 'inprogress' | 'completed' | 'partial' | 'canceled' | 'fail' | 'cronpending';
  order_start: number;
  order_remains: number;
  order_create: string;
  order_error: string;
  order_detail: string;
  api_orderid: number;
  api_charge: number;
  api_currencycharge: number;
  dripfeed: '1' | '2' | '3';
  subscriptions_type: '1' | '2';
  order_where: 'site' | 'api';
  cancelbutton: '1' | '2';
  show_refill: 'true' | 'false';
  refill_status: string;
  is_refill: '1' | '2';
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  inprogress: number;
  completed: number;
  partial: number;
  canceled: number;
  fail: number;
  cronpending: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UnitsPerPage {
  [key: string]: number;
}

interface FilterParams {
  status: string;
  type: string;
  search: string;
  searchField: string;
  dateFrom: string;
  dateTo: string;
  profitMin: string;
  profitMax: string;
}

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orderType, setOrderType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });
  const [unitsPerPage, setUnitsPerPage] = useState<UnitsPerPage>({ orders: 20 });
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    inprogress: 0,
    completed: 0,
    partial: 0,
    canceled: 0,
    fail: 0,
    cronpending: 0
  });
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStartCount, setEditStartCount] = useState<number>(0);
  const [editRemainsCount, setEditRemainsCount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editUrl, setEditUrl] = useState<string>('');
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialQuantity, setPartialQuantity] = useState<number>(0);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [profitMin, setProfitMin] = useState('');
  const [profitMax, setProfitMax] = useState('');
  
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [resendSuccess, setResendSuccess] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const page = params.get('page');
    const type = params.get('type');
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');
    const profitMin = params.get('profitMin');
    const profitMax = params.get('profitMax');
    
    if (status) setSelectedStatus(status);
    if (page) setCurrentPage(parseInt(page));
    if (type) setOrderType(type);
    if (dateFrom) setDateFrom(dateFrom);
    if (dateTo) setDateTo(dateTo);
    if (profitMin) setProfitMin(profitMin);
    if (profitMax) setProfitMax(profitMax);
    
    fetchUnitsPerPage();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [currentPage, selectedStatus, orderType, unitsPerPage.orders, dateFrom, dateTo, profitMin, profitMax]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, searchField]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (orderType !== 'all') params.set('type', orderType);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (profitMin) params.set('profitMin', profitMin);
    if (profitMax) params.set('profitMax', profitMax);
    navigate({ search: params.toString() }, { replace: true });
  }, [selectedStatus, orderType, currentPage, dateFrom, dateTo, profitMin, profitMax]);

  useEffect(() => {
    if (selectAll) {
      setSelectedOrders(filteredOrders.map(o => o.order_id));
    } else {
      setSelectedOrders([]);
    }
  }, [selectAll, filteredOrders]);

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

  const fetchUnitsPerPage = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/settings/units`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnitsPerPage(response.data.units);
      } else {
        setUnitsPerPage({ orders: 20 });
      }
    } catch (error) {
      console.error('Error fetching units per page:', error);
      setUnitsPerPage({ orders: 20 });
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: unitsPerPage.orders.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(orderType !== 'all' && { type: orderType }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(profitMin && { profitMin }),
        ...(profitMax && { profitMax })
      });

      const response = await axios.get(`${API_URL}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const filterOrders = () => {
    if (!searchQuery) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order => {
      switch(searchField) {
        case 'username':
          return order.user_name?.toLowerCase().includes(query) || 
                 order.user_email?.toLowerCase().includes(query);
        case 'order_id':
          return order.order_id.toString().includes(query) || 
                 order.api_orderid.toString().includes(query);
        case 'url':
          return order.order_url?.toLowerCase().includes(query);
        default:
          return order.user_name?.toLowerCase().includes(query) ||
                 order.order_id.toString().includes(query) ||
                 order.order_url?.toLowerCase().includes(query);
      }
    });
    setFilteredOrders(filtered);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    setActionLoading(0);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/orders/bulk-action`, 
        { 
          action: bulkAction,
          order_ids: selectedOrders 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchOrders();
        fetchOrderStats();
        setSelectedOrders([]);
        setSelectAll(false);
        setBulkAction('');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      fetchOrderStats();
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUrl = async () => {
    if (!selectedOrder) return;
    
    setActionLoading(selectedOrder.order_id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/orders/${selectedOrder.order_id}/update-url`,
        { url: editUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating URL:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStartCount = async () => {
    if (!selectedOrder) return;
    
    setActionLoading(selectedOrder.order_id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/orders/${selectedOrder.order_id}/update-start`,
        { start_count: editStartCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating start count:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePartial = async () => {
    if (!selectedOrder) return;
    
    setActionLoading(selectedOrder.order_id);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/orders/${selectedOrder.order_id}/partial`,
        { 
          quantity: partialQuantity,
          remains: selectedOrder.order_remains - partialQuantity
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowPartialModal(false);
        fetchOrders();
        fetchOrderStats();
      }
    } catch (error) {
      console.error('Error processing partial:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: number, withRefund: boolean = true) => {
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/orders/${orderId}/cancel`,
        { refund: withRefund },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      fetchOrderStats();
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error canceling order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendOrder = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/orders/${orderId}/resend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResendSuccess(orderId);
        setTimeout(() => setResendSuccess(null), 3000);
        
        fetchOrders();
        fetchOrderStats();
      }
      
      setActiveDropdown(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error resending order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setActiveDropdown(null);
    setDropdownPosition(null);
  };

  const openDropdown = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const isMobile = window.innerWidth < 768;
    
    let top = rect.bottom + window.scrollY;
    const dropdownHeight = 320; 
    
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
    
    setActiveDropdown(orderId);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium"><Loader className="w-3 h-3" /> Processing</span>;
      case 'inprogress':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium"><Play className="w-3 h-3" /> In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'partial':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Partial</span>;
      case 'canceled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium"><Ban className="w-3 h-3" /> Canceled</span>;
      case 'fail':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium"><XCircle className="w-3 h-3" /> Fail</span>;
      case 'cronpending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium"><RefreshCw className="w-3 h-3" /> Cron Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

const formatProfit = (profit: number) => {
  return profit.toFixed(2);
};

  const StatCard = ({ label, count, color, icon: Icon, onClick, active }: any) => (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} border ${active ? 'border-brand' : 'border-white/10'} rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4 text-white/80" />
        <span className="text-lg font-bold text-white">{count}</span>
      </div>
      <p className="text-[10px] text-white/70">{label}</p>
    </motion.div>
  );

  const searchFieldOptions = [
    { value: 'all', label: 'All Fields' },
    { value: 'username', label: 'Username/Email' },
    { value: 'order_id', label: 'Order ID' },
    { value: 'url', label: 'URL' }
  ];

  const orderTypeOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'manual', label: 'Manual Orders' },
    { value: 'auto', label: 'Auto Orders' }
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading orders...</p>
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
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 h-screen flex flex-col overflow-hidden`}>
        {/* Header */}
<AdminHeader
  title="Orders Management"
  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
  onMobileMenuClick={() => setMobileSidebarOpen(true)}
  activeTickets={0} 
/>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {/* Header with Refresh Button */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Orders Management</h1>
              <p className="text-sm text-gray-400">Manage and track all SMM orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setLoading(true);
                  await Promise.all([
                    fetchOrders(),
                    fetchOrderStats()
                  ]);
                  setLoading(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-xl text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Status Stats Cards */}
          <div className="grid grid-cols-3 md:grid-cols-7 lg:grid-cols-9 gap-2 mb-6">
            <StatCard 
              label="All" 
              count={stats.total} 
              color="from-gray-600/20 to-gray-700/20"
              icon={ShoppingBag}
              onClick={() => setSelectedStatus('all')}
              active={selectedStatus === 'all'}
            />
            <StatCard 
              label="Pending" 
              count={stats.pending} 
              color="from-yellow-600/20 to-yellow-700/20"
              icon={Clock}
              onClick={() => setSelectedStatus('pending')}
              active={selectedStatus === 'pending'}
            />
            <StatCard 
              label="Processing" 
              count={stats.processing} 
              color="from-blue-600/20 to-blue-700/20"
              icon={Loader}
              onClick={() => setSelectedStatus('processing')}
              active={selectedStatus === 'processing'}
            />
            <StatCard 
              label="In Progress" 
              count={stats.inprogress} 
              color="from-purple-600/20 to-purple-700/20"
              icon={Play}
              onClick={() => setSelectedStatus('inprogress')}
              active={selectedStatus === 'inprogress'}
            />
            <StatCard 
              label="Completed" 
              count={stats.completed} 
              color="from-green-600/20 to-green-700/20"
              icon={CheckCircle}
              onClick={() => setSelectedStatus('completed')}
              active={selectedStatus === 'completed'}
            />
            <StatCard 
              label="Partial" 
              count={stats.partial} 
              color="from-orange-600/20 to-orange-700/20"
              icon={AlertCircle}
              onClick={() => setSelectedStatus('partial')}
              active={selectedStatus === 'partial'}
            />
            <StatCard 
              label="Canceled" 
              count={stats.canceled} 
              color="from-red-600/20 to-red-700/20"
              icon={Ban}
              onClick={() => setSelectedStatus('canceled')}
              active={selectedStatus === 'canceled'}
            />
            <StatCard 
              label="Fail" 
              count={stats.fail} 
              color="from-gray-600/20 to-gray-700/20"
              icon={XCircle}
              onClick={() => setSelectedStatus('fail')}
              active={selectedStatus === 'fail'}
            />
            <StatCard 
              label="Cron" 
              count={stats.cronpending} 
              color="from-indigo-600/20 to-indigo-700/20"
              icon={RefreshCw}
              onClick={() => setSelectedStatus('cronpending')}
              active={selectedStatus === 'cronpending'}
            />
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by username, order ID, or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                />
              </div>
              
              {/* Custom Search Field Dropdown */}
              <CustomSelect
                value={searchField}
                onChange={setSearchField}
                options={searchFieldOptions}
                icon={<Search className="w-4 h-4 text-gray-400" />}
                className="w-full md:w-48"
              />
              
              {/* Custom Order Type Dropdown */}
              <CustomSelect
                value={orderType}
                onChange={setOrderType}
                options={orderTypeOptions}
                icon={<ShoppingBag className="w-4 h-4 text-gray-400" />}
                className="w-full md:w-48"
              />
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Date Range</label>
                      <DateRangePicker
                        startDate={dateFrom}
                        endDate={dateTo}
                        onStartDateChange={setDateFrom}
                        onEndDateChange={setDateTo}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Order Type</label>
                      <CustomSelect
                        value={orderType}
                        onChange={setOrderType}
                        options={orderTypeOptions}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Profit Range (Rs)</label>
                      <ProfitRange
                        min={profitMin}
                        max={profitMax}
                        onMinChange={setProfitMin}
                        onMaxChange={setProfitMax}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setProfitMin('');
                        setProfitMax('');
                        setShowFilters(false);
                      }}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => {
                        fetchOrders();
                        setShowFilters(false);
                      }}
                      className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand/90 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-brand/20 border border-brand/30 rounded-xl flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-white">
                  {selectedOrders.length} order(s) selected
                </span>
                <button
                  onClick={() => {
                    setSelectedOrders([]);
                    setSelectAll(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={bulkAction}
                  onChange={setBulkAction}
                  options={[
                    { value: 'pending', label: 'Set Pending' },
                    { value: 'inprogress', label: 'Set In Progress' },
                    { value: 'completed', label: 'Set Completed' },
                    { value: 'canceled', label: 'Set Canceled (Refund)' },
                    { value: 'resend', label: 'Resend to API' }
                  ]}
                  placeholder="Bulk Actions"
                  className="w-48"
                />
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || actionLoading !== null}
                  className="px-4 py-1.5 bg-brand text-white rounded-lg text-sm hover:bg-brand/90 transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}

          {/* Orders Table Container */}
          <div 
            className="bg-black/30 border border-white/10 rounded-xl overflow-auto relative"
            style={{ maxHeight: 'calc(100vh - 350px)' }}
          >
            <table className="w-full min-w-[1600px]">
              <thead className="bg-white/5 sticky top-0 z-20">
                <tr>
                  <th className="w-8 py-3 px-2">
                    <button
                      onClick={() => setSelectAll(!selectAll)}
                      className="text-gray-400 hover:text-white"
                    >
                      {selectAll ? <CheckSquare className="w-4 h-4 text-brand" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">ID</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">API ID</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Charge</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Profit</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Link</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Start</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Quantity</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Service</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Remains</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400">Mode</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-400 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.order_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors relative"
                  >
                    <td className="py-2 px-2">
                      <button
                        onClick={() => {
                          if (selectedOrders.includes(order.order_id)) {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.order_id));
                          } else {
                            setSelectedOrders([...selectedOrders, order.order_id]);
                          }
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        {selectedOrders.includes(order.order_id) ? 
                          <CheckSquare className="w-4 h-4 text-brand" /> : 
                          <Square className="w-4 h-4" />
                        }
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm font-mono text-brand">#{order.order_id}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm font-mono text-purple-400">
                        {order.api_orderid > 0 ? `#${order.api_orderid}` : '—'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-sm text-white truncate max-w-[100px]" title={order.user_name}>
                        {order.user_name || 'N/A'}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm font-bold text-green-400">
                        Rs {formatCurrency(order.order_charge)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-purple-400">
                        Rs {formatProfit(order.order_profit)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <a
                        href={order.order_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">Link</span>
                      </a>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-gray-300">{order.order_start}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-gray-300">{order.order_quantity}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-sm text-gray-300 truncate max-w-[150px]" title={order.service_name}>
                        {order.service_name || `Service #${order.service_id}`}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {getStatusBadge(order.order_status)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-sm ${order.order_remains === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                        {order.order_remains}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {format(new Date(order.order_create), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.order_where === 'api' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {order.order_where === 'api' ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetails(true);
                          }}
                          className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-brand" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setEditStartCount(order.order_start);
                            setEditRemainsCount(order.order_remains);
                            setEditStatus(order.order_status);
                            setEditUrl(order.order_url);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4 text-gray-400 group-hover:text-brand" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setPartialQuantity(order.order_remains);
                            setShowPartialModal(true);
                          }}
                          className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group"
                          title="Mark Partial"
                        >
                          <AlertCircle className="w-4 h-4 text-gray-400 group-hover:text-brand" />
                        </button>
                        
                        {/* Dropdown Trigger Button */}
                        <button
                          onClick={(e) => openDropdown(e, order.order_id)}
                          className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors group relative"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-brand" />
                        </button>
                        
                        {/* Success message for resend */}
                        {resendSuccess === order.order_id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg whitespace-nowrap"
                          >
                            Resent successfully!
                          </motion.div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 mt-4 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-sm">
                  {currentPage} / {pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portal Dropdown Menu */}
      {activeDropdown && dropdownPosition && ReactDOM.createPortal(
        <>
          {/* Backdrop for mobile */}
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
              className="w-56 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden md:ml-0"
            >
              <div className="px-3 py-2 bg-white/5 border-b border-white/10">
                <p className="text-xs font-medium text-gray-400">
                  Actions for #{filteredOrders.find(o => o.order_id === activeDropdown)?.order_id}
                </p>
              </div>
              
              <div className="p-1">
                <button
                  onClick={() => handleStatusChange(activeDropdown, 'completed')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-green-500/20 rounded-lg transition-colors group"
                >
                  <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="flex-1 text-left">Mark Completed</span>
                  {actionLoading === activeDropdown && (
                    <Loader className="w-3 h-3 animate-spin text-gray-400" />
                  )}
                </button>
                
                <button
                  onClick={() => handleStatusChange(activeDropdown, 'inprogress')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-purple-500/20 rounded-lg transition-colors group"
                >
                  <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20">
                    <Play className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="flex-1 text-left">Mark In Progress</span>
                </button>
                
                <div className="h-px bg-white/10 my-1" />
                
                <button
                  onClick={() => handleCancelOrder(activeDropdown, true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors group"
                >
                  <div className="w-6 h-6 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20">
                    <Ban className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="flex-1 text-left">Cancel (Refund)</span>
                </button>
                
                <button
                  onClick={() => handleResendOrder(activeDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors group"
                >
                  <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20">
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="flex-1 text-left">Resend to API</span>
                  {actionLoading === activeDropdown && (
                    <Loader className="w-3 h-3 animate-spin text-gray-400" />
                  )}
                </button>
                
                <div className="h-px bg-white/10 my-1" />
                
                <button
                  onClick={() => {
                    const order = filteredOrders.find(o => o.order_id === activeDropdown);
                    if (order) handleCopyLink(order.order_url);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="flex-1 text-left">Copy Link</span>
                </button>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Order Details #{selectedOrder.order_id}</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Order ID</p>
                    <p className="text-lg font-bold text-brand">#{selectedOrder.order_id}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">API Order ID</p>
                    <p className="text-lg font-bold text-purple-400">#{selectedOrder.api_orderid || '—'}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">User</p>
                    <p className="text-lg font-bold text-white">{selectedOrder.user_name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{selectedOrder.user_email}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Charge</p>
                    <p className="text-lg font-bold text-green-400">Rs {formatCurrency(selectedOrder.order_charge)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Profit</p>
                    <p className="text-lg font-bold text-purple-400">Rs {formatProfit(selectedOrder.order_charge, selectedOrder.order_profit)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">API Charge</p>
                    <p className="text-lg font-bold text-blue-400">Rs {formatCurrency(selectedOrder.api_charge)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Mode</p>
                    <span className={`text-sm px-3 py-1.5 rounded-full ${
                      selectedOrder.order_where === 'api' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {selectedOrder.order_where === 'api' ? 'Auto' : 'Manual'}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Quantity</span>
                        <span className="text-sm text-white">{selectedOrder.order_quantity}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Start Count</span>
                        <span className="text-sm text-white">{selectedOrder.order_start}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Remains</span>
                        <span className={`text-sm ${selectedOrder.order_remains === 0 ? 'text-green-400' : 'text-white'}`}>
                          {selectedOrder.order_remains}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Created</span>
                        <span className="text-sm text-white">
                          {format(new Date(selectedOrder.order_create), 'yyyy-MM-dd HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Service Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Service ID</span>
                        <span className="text-sm text-white">{selectedOrder.service_id}</span>
                      </div>
                      <div className="py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400 block mb-1">Service Name</span>
                        <span className="text-sm text-white">{selectedOrder.service_name}</span>
                      </div>
                      <div className="py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400 block mb-1">Link</span>
                        <a
                          href={selectedOrder.order_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand hover:underline flex items-center gap-1 break-all"
                        >
                          {selectedOrder.order_url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Response - Fixed with proper text wrapping */}
                {selectedOrder.order_detail && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">API Response</h3>
                    <pre className="bg-black/30 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                      {JSON.stringify(JSON.parse(selectedOrder.order_detail), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error Message if any */}
                {selectedOrder.order_error && selectedOrder.order_error !== '-' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-xs text-red-400 font-medium mb-1">Error</p>
                    <p className="text-sm text-red-300">{selectedOrder.order_error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedOrder(selectedOrder);
                      setEditStartCount(selectedOrder.order_start);
                      setEditRemainsCount(selectedOrder.order_remains);
                      setEditStatus(selectedOrder.order_status);
                      setEditUrl(selectedOrder.order_url);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Order
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedOrder(selectedOrder);
                      setPartialQuantity(selectedOrder.order_remains);
                      setShowPartialModal(true);
                    }}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Mark Partial
                  </button>
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.order_id, true)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel (Refund)
                  </button>
                  <button
                    onClick={() => handleResendOrder(selectedOrder.order_id)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend to API
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {showEditModal && selectedOrder && (
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
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Edit Order #{selectedOrder.order_id}</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Order URL</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Count</label>
                  <input
                    type="number"
                    value={editStartCount}
                    onChange={(e) => setEditStartCount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Remains Count</label>
                  <input
                    type="number"
                    value={editRemainsCount}
                    onChange={(e) => setEditRemainsCount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="partial">Partial</option>
                    <option value="canceled">Canceled</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateUrl}
                    disabled={actionLoading === selectedOrder.order_id}
                    className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedOrder.order_id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update URL
                  </button>
                  <button
                    onClick={handleUpdateStartCount}
                    disabled={actionLoading === selectedOrder.order_id}
                    className="flex-1 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Update Start
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partial Modal */}
      <AnimatePresence>
        {showPartialModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPartialModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Mark Partial - Order #{selectedOrder.order_id}</h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-400">
                    Current Remains: <span className="font-bold">{selectedOrder.order_remains}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the quantity to mark as delivered. Remaining will be refunded.
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Quantity to Deliver</label>
                  <input
                    type="number"
                    value={partialQuantity}
                    onChange={(e) => setPartialQuantity(parseInt(e.target.value) || 0)}
                    max={selectedOrder.order_remains}
                    min={0}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handlePartial}
                    disabled={actionLoading === selectedOrder.order_id || partialQuantity <= 0 || partialQuantity > selectedOrder.order_remains}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedOrder.order_id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Process Partial
                  </button>
                  <button
                    onClick={() => setShowPartialModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
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
      `}</style>
    </div>
  );
};

export default AdminOrdersPage;
