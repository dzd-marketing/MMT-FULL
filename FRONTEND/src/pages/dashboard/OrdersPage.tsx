import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock as ClockIcon,
  Play,
  Ban,
  RefreshCw as RefillIcon,
  Loader as LoaderIcon,
  Filter,
  ChevronDown,
  RotateCw,
  RefreshCw,
  MoreVertical,
  Eye,
  X
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';

interface Order {
  order_id: number;
  service_id: number;
  service_name: string;
  order_quantity: number;
  order_charge: number;
  order_url: string;
  order_status: 'pending' | 'inprogress' | 'completed' | 'partial' | 'processing' | 'canceled';
  order_create: string;
  order_date: string;
  order_start: number;
  order_remains: number;
  order_extras: string;
  dripfeed: '1' | '2' | '3';
  subscriptions_type: '1' | '2';
  refill_status: 'Pending' | 'Refilling' | 'Completed' | 'Rejected' | 'Error';
  
  is_refill: '0' | '1';
  refill: '0' | '1';
  cancelbutton: '0' | '1';
  api_orderid: number;
  api_charge: number;
  order_error: string;
  order_detail: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const hoursSinceOrder = (orderDate: string): number => {
  const created = new Date(orderDate).getTime();
  const now = Date.now();
  return (now - created) / (1000 * 60 * 60);
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const pathParts = (params['*'] || 'all/1').split('/');
  const urlStatus = pathParts[0] || 'all';
  const urlPage = pathParts[1] || '1';
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus);
  const [currentPage, setCurrentPage] = useState<number>(parseInt(urlPage));
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 25,
    pages: 1
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [refillingId, setRefillingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [lastAutoRefresh, setLastAutoRefresh] = useState<Date>(new Date());
  
  const mobileFilterRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(event.target as Node)) {
        setIsMobileFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusTabs = [
    { id: 'all', label: 'All', icon: Filter, color: 'text-gray-400', bgColor: 'from-gray-500/20 to-gray-600/20' },
    { id: 'pending', label: 'Pending', icon: ClockIcon, color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-yellow-600/20' },
    { id: 'processing', label: 'Processing', icon: LoaderIcon, color: 'text-blue-400', bgColor: 'from-blue-500/20 to-blue-600/20' },
    { id: 'inprogress', label: 'In Progress', icon: Play, color: 'text-purple-400', bgColor: 'from-purple-500/20 to-purple-600/20' },
    { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-400', bgColor: 'from-green-500/20 to-green-600/20' },
    { id: 'partial', label: 'Partial', icon: AlertCircle, color: 'text-orange-400', bgColor: 'from-orange-500/20 to-orange-600/20' },
    { id: 'queued', label: 'Queued', icon: ClockIcon, color: 'text-cyan-400', bgColor: 'from-cyan-500/20 to-cyan-600/20' },
    { id: 'canceled', label: 'Canceled', icon: Ban, color: 'text-red-400', bgColor: 'from-red-500/20 to-red-600/20' }
  ];

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = (status: string) => {
      switch(status) {
        case 'completed': return { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Completed' };
        case 'pending': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: ClockIcon, label: 'Pending' };
        case 'processing': return { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: LoaderIcon, label: 'Processing' };
        case 'inprogress': return { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Play, label: 'In Progress' };
        case 'partial': return { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertCircle, label: 'Partial' };
        case 'queued': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: ClockIcon, label: 'Queued' };
        case 'canceled': return { bg: 'bg-red-500/20', text: 'text-red-400', icon: Ban, label: 'Canceled' };
        default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: ClockIcon, label: status };
      }
    };
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login', { state: { from: '/dashboard/orders' } }); return; }
        const userData = await authService.getCurrentUser();
        if (!userData) { navigate('/login'); return; }
        setUser(userData);
      } catch (error) {
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && user) loadOrdersFromDatabase();
  }, [authLoading, user, selectedStatus, currentPage, searchQuery]);

  useEffect(() => {
    if (!authLoading && user) {
      const interval = setInterval(() => {
        refreshAllOrdersFromProvider();
      }, 180000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  const loadOrdersFromDatabase = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`${API_URL}/orders/my-orders?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
        const newUrl = selectedStatus === 'all' && currentPage === 1
          ? '/dashboard/orders'
          : `/dashboard/orders/${selectedStatus}/${currentPage}`;
        window.history.replaceState(null, '', newUrl + (searchQuery ? `?search=${searchQuery}` : ''));
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAllOrdersFromProvider = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/sync-all-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setLastAutoRefresh(new Date());
        loadOrdersFromDatabase();
      }
    } catch (error) {
      console.error('Error auto-refreshing orders:', error);
    }
  };

  const handleManualRefresh = async (orderId: number) => {
    try {
      setRefreshingId(orderId);
      const response = await fetch(`${API_URL}/orders/${orderId}/sync-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        await loadOrdersFromDatabase();
      } else {
        alert(data.message || 'Failed to sync order from provider');
      }
    } catch (error) {
      alert('Failed to refresh order. Please try again.');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleCopyRow = async (order: Order) => {
    try {
      const rowText = `Order #${order.order_id}
API Order ID: #${order.api_orderid || 'N/A'}
Date: ${formatDate(order.order_date)}
Link: ${order.order_url}
Charge: Rs ${formatCurrency(order.order_charge)}
Start: ${order.order_start || 0}
Quantity: ${order.order_quantity}
Remains: ${order.order_remains}
Service: ${order.service_name}
Status: ${order.order_status}
${order.order_error && order.order_error !== '-' ? `Error: ${order.order_error}` : ''}`;
      await navigator.clipboard.writeText(rowText);
      setCopiedId(order.order_id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRefill = async (orderId: number) => {
    try {
      setRefillingId(orderId);
      const response = await fetch(`${API_URL}/orders/${orderId}/refill`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        alert('Refill request submitted successfully');
        loadOrdersFromDatabase();
      } else {
        alert(data.message || 'Failed to request refill');
      }
    } catch (error) {
      alert('Failed to request refill');
    } finally {
      setRefillingId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancellingId(orderId);
      const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        const refundMsg = data.refund_type === 'partial'
          ? `Order cancelled. Partial refund of Rs ${Number(data.refund_amount).toFixed(2)} credited (undelivered portion).`
          : `Order cancelled. Full refund of Rs ${Number(data.refund_amount).toFixed(2)} credited to your wallet.`;
        alert(refundMsg);
        loadOrdersFromDatabase();
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount && amount !== 0) return '0.00';
    return Number(amount).toFixed(2);
  };

  
  const getRefillButton = (order: Order) => {

    if (order.is_refill !== '1' && order.refill !== '1') return null;
    
    if (order.order_status !== 'completed' && order.order_status !== 'partial') return null;

    const hoursElapsed = hoursSinceOrder(order.order_date || order.order_create);
    const refillUnlocked = hoursElapsed >= 24;
    const hoursRemaining = Math.ceil(24 - hoursElapsed);

    if (!refillUnlocked) {
     
      return (
        <button
          disabled
          className="px-3 py-1.5 bg-blue-500/10 text-blue-400/50 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap"
          title={`Refill available in ${hoursRemaining}h`}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Refill in {hoursRemaining}h
        </button>
      );
    }

    return (
      <button
        onClick={() => handleRefill(order.order_id)}
        disabled={refillingId === order.order_id}
        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
        title="Request refill"
      >
        {refillingId === order.order_id ? (
          <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefillIcon className="w-3.5 h-3.5" />
        )}
        Refill
      </button>
    );
  };

 
  const getCancelButton = (order: Order) => {
    if (order.cancelbutton !== '1') return null;
    const cancelableStatuses = ['pending', 'processing', 'inprogress'];
    if (!cancelableStatuses.includes(order.order_status)) return null;

    return (
      <button
        onClick={() => handleCancel(order.order_id)}
        disabled={cancellingId === order.order_id}
        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
      >
        {cancellingId === order.order_id ? (
          <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Ban className="w-3.5 h-3.5" />
        )}
        Cancel
      </button>
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
      className="w-full max-w-7xl mx-auto px-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
            Order <span className="text-brand">History</span>
          </h1>
          <p className="text-gray-400 text-sm">View and manage all your orders</p>
          {lastAutoRefresh && (
            <p className="text-xs text-gray-500 mt-1">Last auto-refresh: {lastAutoRefresh.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* Desktop Status Tabs */}
      <div className="hidden md:block mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 min-w-max p-1 bg-white/5 rounded-2xl">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setSelectedStatus(tab.id); setCurrentPage(1); }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedStatus === tab.id
                    ? `bg-gradient-to-r ${tab.bgColor} text-white border border-white/10`
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedStatus === tab.id ? tab.color : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Filter Dropdown */}
      <div className="md:hidden mb-6 relative" ref={mobileFilterRef}>
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-4 bg-gradient-to-r from-brand/20 to-purple-600/20 border border-brand/30 rounded-2xl text-white hover:from-brand/30 hover:to-purple-600/30 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <Filter className="w-5 h-5 text-brand" />
            </div>
            <div className="text-left">
              <span className="text-xs text-gray-400">Filter by</span>
              <p className="text-base font-bold text-white">
                {statusTabs.find(t => t.id === selectedStatus)?.label || 'Status'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isMobileFilterOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
            >
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setSelectedStatus(tab.id); setCurrentPage(1); setIsMobileFilterOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-all ${
                      isSelected ? `bg-gradient-to-r ${tab.bgColor} border-l-4 border-white/20` : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl ${isSelected ? tab.bgColor : 'bg-white/5'} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${tab.color}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{tab.label}</p>
                        <p className="text-xs text-gray-500">Filter orders by {tab.label.toLowerCase()} status</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

   
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Order ID or Link..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
          />
        </div>
      </div>

    
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button onClick={loadOrdersFromDatabase} className="mt-4 px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors">
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
          <p className="text-gray-400">{searchQuery ? 'Try adjusting your search' : 'Place your first order to get started'}</p>
          {!searchQuery && (
            <button onClick={() => navigate('/dashboard/new-order')} className="mt-4 px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors">
              Place New Order
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="w-full">
              <table className="w-full table-auto">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[90px]">ORDER ID</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[70px]">LOCAL</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[140px]">DATE</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[150px]">LINK</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[80px]">CHARGE</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[60px]">START</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[50px]">QTY</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[70px]">REMAINS</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[220px]">SERVICE</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[100px]">STATUS</th>
                    <th className="px-2 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[160px]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center space-x-1 flex-wrap">
                          <span className="text-sm font-mono text-brand font-bold break-all">#{order.api_orderid || '—'}</span>
                          {order.api_orderid > 0 && (
                            <button onClick={() => handleCopyRow(order)} className="text-gray-400 hover:text-brand transition-colors flex-shrink-0">
                              {copiedId === order.order_id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className="text-sm text-gray-400 break-all">#{order.order_id}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className="text-sm text-gray-300 break-words">{formatDate(order.order_date)}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <a href={order.order_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-brand hover:underline flex items-start space-x-1 break-words">
                          <span className="break-all flex-1">{order.order_url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        </a>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className="text-sm font-bold text-brand break-all whitespace-normal">Rs {formatCurrency(order.order_charge)}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className="text-sm text-gray-300 break-all">{order.order_start || 0}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className="text-sm text-gray-300 break-all">{order.order_quantity}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className={`text-sm break-all ${order.order_remains === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                          {order.order_remains}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        {/* Service name — always shows from order_service_name fallback */}
                        <div className="text-sm text-gray-300 break-words whitespace-normal">{order.service_name}</div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <StatusBadge status={order.order_status} />
                        {order.order_error && order.order_error !== '-' && (
                          <div className="text-[10px] text-red-400 mt-1 break-words" title={order.order_error}>
                            Error: {order.order_error}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleManualRefresh(order.order_id)}
                            disabled={refreshingId === order.order_id}
                            className="px-3 py-1.5 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap w-full"
                            title="Sync with API provider"
                          >
                            {refreshingId === order.order_id ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                            Refresh Status
                          </button>
                          <div className="flex items-center gap-1 flex-wrap">
                            {getRefillButton(order)}
                            {getCancelButton(order)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

       
          <div className="lg:hidden space-y-4">
            {orders.map((order) => (
              <motion.div 
                key={order.order_id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5 hover:border-brand/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                      <span className="text-lg font-mono text-brand font-bold break-all">ID #{order.api_orderid || '—'}</span>
                      {order.api_orderid > 0 && (
                        <button onClick={() => handleCopyRow(order)} className="text-gray-400 hover:text-brand transition-colors flex-shrink-0">
                          {copiedId === order.order_id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full inline-block">Local #{order.order_id}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleManualRefresh(order.order_id)}
                      disabled={refreshingId === order.order_id}
                      className="p-2.5 bg-brand/20 rounded-xl text-brand hover:bg-brand/30 transition-all"
                    >
                      <RotateCw className={`w-4 h-4 ${refreshingId === order.order_id ? 'animate-spin' : ''}`} />
                    </button>
                    <StatusBadge status={order.order_status} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">DATE & LINK</p>
                    <p className="text-sm text-gray-300 mb-2">{formatDate(order.order_date)}</p>
                    <a href={order.order_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-brand hover:underline flex items-start space-x-1 break-all bg-brand/10 p-2 rounded-lg">
                      <span className="break-all flex-1">{order.order_url}</span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'CHARGE', value: `Rs ${formatCurrency(order.order_charge)}`, className: 'text-brand font-bold' },
                      { label: 'START', value: order.order_start || 0, className: 'text-gray-300' },
                      { label: 'QTY', value: order.order_quantity, className: 'text-gray-300' },
                      { label: 'REM', value: order.order_remains, className: order.order_remains === 0 ? 'text-green-400' : 'text-gray-300' },
                    ].map(({ label, value, className }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                        <p className={`text-sm break-all ${className}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">SERVICE</p>
                    <p className="text-sm text-gray-300 break-words">{order.service_name}</p>
                  </div>

                  {order.order_error && order.order_error !== '-' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs text-red-400 break-words">Error: {order.order_error}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {getRefillButton(order)}
                    {getCancelButton(order)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(page => {
                  const total = pagination.pages;
                  if (total <= 7) return true;
                  if (page === 1 || page === total) return true;
                  if (page >= currentPage - 2 && page <= currentPage + 2) return true;
                  return false;
                })
                .map((page, index, array) => {
                  if (index > 0 && array[index - 1] !== page - 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span className="px-3 py-2 text-gray-500">...</span>
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === page ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  }
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === page ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                      {page}
                    </button>
                  );
                })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default OrdersPage;
