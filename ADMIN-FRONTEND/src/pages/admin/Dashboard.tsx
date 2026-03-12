// pages/admin/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Users, Globe, Ticket, Bell, Menu,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  Play, Ban, Loader, Eye, Download, Shield, Key, Server,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Fingerprint, AlertTriangle, ShieldAlert, Calendar,
  DollarSign, CreditCard, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart,
  Pie, Cell, Area, AreaChart
} from 'recharts';
import Sidebar from './Sidebar';
import { format, subDays } from 'date-fns';

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalServices: number;
  totalBalance: number;
  activeTickets: number;
  security: {
    todayAttempts: number;
    successRate: number;
  };
  topPlatforms: Array<{
    platform: string;
    service_count: number;
  }>;
}

interface RecentOrder {
  order_id: number;
  api_orderid: number;
  user_name: string;
  service_name: string;
  order_status: string;
  order_charge: number;
  order_profit: number;
  order_create: string;
}

interface SecurityAnalytics {
  today: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  };
  all_attempts: Array<{
    id: number;
    clean_email: string;
    raw_email: string;
    ip_address: string;
    user_agent: string;
    attempt_time: string;
    success: number;
    attempt_type: string;
  }>;
  total_records: number;
  weekly_stats: Array<{
    date: string;
    total: number;
    successful: number;
  }>;
  top_failed_ips: Array<{
    ip_address: string;
    email: string;
    attempts: number;
    last_attempt: string;
  }>;
  hourly_distribution: Array<{
    hour: number;
    attempts: number;
    successful: number;
  }>;
}

interface PlatformDistribution {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  date: string;
  formattedDate: string;
  orderCount: number;
  revenue: number;
  profit: number;
}

interface ChartSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  profitMargin: number;
}

type DateRange = '30days' | '60days' | '90days' | 'year' | 'lifetime';

// ── Read real admin info from JWT ─────────────────────────────────────────
const useAdminInfo = () => {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email: string = payload.email || 'admin@panel.com';
      const name: string = (import.meta.env.VITE_ADMIN_NAME as string) || email.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();
      return { name, email, initials };
    } catch {
      return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };
    }
  }, []);
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { name, email, initials } = useAdminInfo();

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [recordsLimit, setRecordsLimit] = useState(50);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  
  // Column resizing states
  const [columnWidths, setColumnWidths] = useState([20, 12, 8, 8, 15, 37]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalServices: 0,
    totalBalance: 0,
    activeTickets: 0,
    security: { todayAttempts: 0, successRate: 100 },
    topPlatforms: []
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [securityAnalytics, setSecurityAnalytics] = useState<SecurityAnalytics | null>(null);
  const [platformDistribution, setPlatformDistribution] = useState<PlatformDistribution[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartSummary, setChartSummary] = useState<ChartSummary>({
    totalOrders: 0, totalRevenue: 0, totalProfit: 0, avgOrderValue: 0, profitMargin: 0
  });
  const [chartLoading, setChartLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Column resize handlers
  const initResize = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setResizing({ index, startX: e.clientX, startWidth: columnWidths[index] });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const tableWidth = document.getElementById('security-table')?.offsetWidth || 1000;
    const diffPercent = (diff / tableWidth) * 100;
    const newWidth = Math.max(5, Math.min(50, resizing.startWidth + diffPercent));
    setColumnWidths(prev => { const n = [...prev]; n[resizing.index] = newWidth; return n; });
  };

  const handleMouseUp = () => {
    setResizing(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [statsRes, securityRes, platformsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/security/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/platforms/distribution`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.data.success) { setStats(statsRes.data.stats); setRecentOrders(statsRes.data.recentOrders); }
      if (securityRes.data.success) setSecurityAnalytics(securityRes.data.analytics);
      if (platformsRes.data.success) setPlatformDistribution(platformsRes.data.distribution);

      await fetchChartData(dateRange);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (range: DateRange) => {
    setChartLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/analytics/orders?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setChartData(response.data.data.chartData);
        setChartSummary(response.data.data.summary);
      }
    } catch {
      generateMockChartData(range);
    } finally {
      setChartLoading(false);
    }
  };

  const generateMockChartData = (range: DateRange) => {
    let days = 30;
    if (range === '60days') days = 60;
    if (range === '90days') days = 90;
    if (range === 'year') days = 365;
    if (range === 'lifetime') days = 180;
    const data: ChartData[] = [];
    let totalOrders = 0, totalRevenue = 0, totalProfit = 0;
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const orderCount = Math.floor(Math.random() * 50) + 5;
      const revenue = orderCount * (Math.random() * 100 + 50);
      const profit = revenue * (Math.random() * 0.3 + 0.1);
      totalOrders += orderCount; totalRevenue += revenue; totalProfit += profit;
      data.push({ date: date.toISOString(), formattedDate: format(date, 'MMM dd'), orderCount, revenue: Math.round(revenue * 100) / 100, profit: Math.round(profit * 100) / 100 });
    }
    setChartData(data);
    setChartSummary({ totalOrders, totalRevenue: Math.round(totalRevenue * 100) / 100, totalProfit: Math.round(totalProfit * 100) / 100, avgOrderValue: Math.round((totalRevenue / totalOrders) * 100) / 100, profitMargin: Math.round((totalProfit / totalRevenue) * 100) / 100 });
  };

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => { fetchChartData(dateRange); }, [dateRange]);

  const fetchSecurityAnalytics = async (limit = 50, all = false) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/security/analytics?limit=${all ? 1000 : limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setSecurityAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching security analytics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/logout');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':   return <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'pending':     return <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing':  return <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium"><Loader className="w-3 h-3" /> Processing</span>;
      case 'inprogress':  return <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium"><Play className="w-3 h-3" /> In Progress</span>;
      case 'partial':     return <span className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Partial</span>;
      case 'canceled':    return <span className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium"><Ban className="w-3 h-3" /> Canceled</span>;
      default:            return <span className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(amount).replace('LKR', 'Rs');
  const formatCompactNumber = (num: number) => num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${color.bg}`}>
          <Icon className={`w-4 h-4 md:w-6 md:h-6 ${color.text}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-1 md:px-2 py-0.5 md:py-1 rounded-lg ${trend > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {trend > 0 ? <ArrowUpRight className="w-2 h-2 md:w-3 md:h-3 text-green-400" /> : <ArrowDownRight className="w-2 h-2 md:w-3 md:h-3 text-red-400" />}
            <span className={`text-[8px] md:text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-0.5 md:space-y-1">
        <p className="text-[10px] md:text-sm text-gray-400">{title}</p>
        <p className="text-xl md:text-3xl font-black text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
        {subtitle && <p className="text-[8px] md:text-xs text-gray-500">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white text-xs font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400">Orders: <span className="text-white font-bold ml-2">{payload[0]?.value}</span></p>
            <p className="text-[10px] text-gray-400">Revenue: <span className="text-green-400 font-bold ml-2">{formatCurrency(payload[1]?.value)}</span></p>
            <p className="text-[10px] text-gray-400">Profit: <span className="text-purple-400 font-bold ml-2">{formatCurrency(payload[2]?.value)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-400">Loading dashboard...</p>
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
        activeTickets={stats.activeTickets}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0`}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">

            {/* Left — hamburger + page title */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:block p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors"
              >
                <Menu className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
              <h1 className="text-base md:text-2xl font-black text-white hidden sm:block">Admin Dashboard</h1>
            </div>

            {/* Right — notifications + admin account */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Notification bell */}
              <button className="relative p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                {stats.activeTickets > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-white/10" />

              {/* Admin account card */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-white">{initials}</span>
                </div>

                {/* Name + role — hidden on small mobile */}
                <div className="hidden sm:block">
                  <p className="text-xs md:text-sm font-bold text-white leading-tight">{name}</p>
                  <div className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-green-400" />
                    <p className="text-[9px] md:text-[10px] text-green-400/80 font-medium">Super Admin</p>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 group ml-1"
                >
                  <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
                  <span className="text-[10px] md:text-xs text-red-400 group-hover:text-red-300 font-medium hidden md:block transition-colors">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Dashboard Content ───────────────────────────────────────────── */}
        <main className="p-4 md:p-8">

          {/* Welcome Section */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2">
              Welcome back, <span className="text-brand">{name}</span> 👋
            </h1>
            <p className="text-xs md:text-sm text-gray-400">Here's what's happening with your SMM panel today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <StatCard title="Total Orders"   value={stats.totalOrders}   icon={ShoppingBag} color={{ bg: 'bg-brand/20',       text: 'text-brand' }}        trend={12.5} />
            <StatCard title="Total Users"    value={stats.totalUsers}    icon={Users}       color={{ bg: 'bg-purple-500/20',  text: 'text-purple-400' }}   trend={8.4} />
            <StatCard title="Total Services" value={stats.totalServices} icon={Globe}       color={{ bg: 'bg-blue-500/20',    text: 'text-blue-400' }}     subtitle="Active services" />
            <StatCard title="Active Tickets" value={stats.activeTickets} icon={Ticket}      color={{ bg: 'bg-orange-500/20',  text: 'text-orange-400' }}   subtitle="Requires attention" />
          </div>

          {/* Analytics Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">Performance Analytics</h2>
                <p className="text-xs md:text-sm text-gray-400">Track orders, revenue and profit over time</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['30days', '60days', '90days', 'year', 'lifetime'] as DateRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      dateRange === range ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {range === '30days' ? '30 Days' : range === '60days' ? '60 Days' : range === '90days' ? '90 Days' : range === 'year' ? 'Last Year' : 'Lifetime'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                <p className="text-xl md:text-2xl font-bold text-white">{formatNumber(chartSummary.totalOrders)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-green-400">{formatCurrency(chartSummary.totalRevenue)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total Profit</p>
                <p className="text-xl md:text-2xl font-bold text-purple-400">{formatCurrency(chartSummary.totalProfit)}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Profit Margin</p>
                <p className="text-xl md:text-2xl font-bold text-orange-400">{chartSummary.profitMargin?.toFixed(2) ?? '0.00'}%</p>
              </div>
            </div>

            {/* Combo Chart */}
            <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-lg font-bold text-white">Orders & Revenue Overview</h3>
                {chartLoading && <Loader className="w-4 h-4 animate-spin text-brand" />}
              </div>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="formattedDate" stroke="#666" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 10)} />
                    <YAxis yAxisId="left" stroke="#666" tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                    <YAxis yAxisId="right" orientation="right" stroke="#666" tick={{ fontSize: 10 }} tickFormatter={formatCompactNumber} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px', color: '#999' }} iconType="circle" />
                    <Bar yAxisId="left" dataKey="orderCount" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="profit" name="Profit" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand rounded-full" /><span className="text-xs text-gray-400">Orders Count</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-xs text-gray-400">Revenue</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full" /><span className="text-xs text-gray-400">Profit</span></div>
                <div className="flex items-center gap-2 ml-4"><DollarSign className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-400">Avg Order: {formatCurrency(chartSummary.avgOrderValue)}</span></div>
              </div>
            </div>
          </div>

          {/* Security Analytics */}
          {securityAnalytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl mb-6 md:mb-8"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-lg bg-red-500/20">
                  <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-md font-bold text-white">Security Analytics</h3>
                  <p className="text-[10px] md:text-xs text-gray-400">Login attempt monitoring</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="bg-white/5 rounded-lg p-2 md:p-3">
                  <p className="text-[8px] md:text-xs text-gray-400">Today</p>
                  <p className="text-base md:text-xl font-bold text-white">{securityAnalytics.today.total}</p>
                  <div className="flex items-center gap-1 mt-0.5 md:mt-1">
                    <span className="text-[6px] md:text-[10px] text-green-400">✓ {securityAnalytics.today.successful}</span>
                    <span className="text-[6px] md:text-[10px] text-red-400">✗ {securityAnalytics.today.failed}</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 md:p-3">
                  <p className="text-[8px] md:text-xs text-gray-400">Success Rate</p>
                  <p className="text-base md:text-xl font-bold text-green-400">{securityAnalytics.today.success_rate}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1 md:mt-2">
                    <div className="bg-green-400 h-1 rounded-full" style={{ width: `${securityAnalytics.today.success_rate}%` }} />
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 md:p-3">
                  <p className="text-[8px] md:text-xs text-gray-400">7 Days</p>
                  <p className="text-base md:text-xl font-bold text-white">{securityAnalytics.weekly_stats?.reduce((acc, curr) => acc + curr.total, 0) || 0}</p>
                  <p className="text-[6px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1">total attempts</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 md:p-3">
                  <p className="text-[8px] md:text-xs text-gray-400">Total Records</p>
                  <p className="text-base md:text-xl font-bold text-white">{securityAnalytics.total_records || 0}</p>
                  <p className="text-[6px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1">in system</p>
                </div>
              </div>

              {/* Records controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] md:text-xs text-gray-400">Show:</span>
                  <select
                    value={showAllRecords ? 'all' : recordsLimit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') { setShowAllRecords(true); fetchSecurityAnalytics(1000, true); }
                      else { const limit = parseInt(value); setShowAllRecords(false); setRecordsLimit(limit); fetchSecurityAnalytics(limit); }
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs text-white focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                    <option value="all">All</option>
                  </select>
                  <span className="text-[8px] md:text-xs text-gray-500">
                    {showAllRecords ? `All ${securityAnalytics.all_attempts?.length || 0}` : `${securityAnalytics.all_attempts?.length || 0}/${securityAnalytics.total_records || 0}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  {[25, 50, 100].map(n => (
                    <button key={n}
                      onClick={() => { setShowAllRecords(false); setRecordsLimit(n); fetchSecurityAnalytics(n); }}
                      className={`px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[8px] md:text-xs transition-colors ${!showAllRecords && recordsLimit === n ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >{n}</button>
                  ))}
                  <button onClick={() => { setShowAllRecords(true); fetchSecurityAnalytics(1000, true); }}
                    className={`px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[8px] md:text-xs transition-colors ${showAllRecords ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >All</button>
                </div>
              </div>

              {/* Attempts Table */}
              <div className="bg-black/30 rounded-lg md:rounded-xl overflow-hidden border border-white/10">
                <div className="px-3 md:px-4 py-2 md:py-3 bg-white/5 border-b border-white/10">
                  <h4 className="text-[10px] md:text-xs font-bold text-white flex items-center gap-1 md:gap-2">
                    <Fingerprint className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400" />
                    Login Attempt History
                    <span className="text-[8px] md:text-[10px] text-gray-500 ml-1 md:ml-2">({securityAnalytics.all_attempts?.length || 0} records)</span>
                  </h4>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1F2937; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6B7280; }
                    .resize-handle { position: absolute; top: 0; right: 0; bottom: 0; width: 6px; cursor: col-resize; background: transparent; z-index: 10; }
                    .resize-handle:hover, .resize-handle.resizing { background: rgba(99,102,241,0.3); }
                    .resize-handle::after { content: ''; position: absolute; top: 25%; bottom: 25%; left: 50%; width: 1.5px; background: rgba(255,255,255,0.2); transform: translateX(-50%); }
                    .resize-handle:hover::after, .resize-handle.resizing::after { background: rgba(99,102,241,0.8); }
                  `}</style>
                  <table className="w-full min-w-[700px] md:min-w-[900px] table-fixed" id="security-table">
                    <colgroup>
                      {columnWidths.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
                    </colgroup>
                    <thead className="bg-white/5 sticky top-0 z-10">
                      <tr>
                        {['Email', 'IP', 'Type', 'Status', 'Time', 'User Agent'].map((h, i) => (
                          <th key={h} className="relative py-2 px-3 md:py-2.5 md:px-4 text-left text-[8px] md:text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                            {h}
                            <div className="resize-handle" onMouseDown={(e) => initResize(e, i)} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {securityAnalytics.all_attempts?.length > 0 ? securityAnalytics.all_attempts.map((attempt, index) => (
                        <tr key={attempt.id || index} className={`border-t border-white/5 transition-colors ${attempt.success === 1 ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5'}`}>
                          <td className="py-2 px-3 md:py-2.5 md:px-4"><span className="text-[10px] md:text-xs text-gray-300 truncate block">{attempt.clean_email || attempt.raw_email || 'N/A'}</span></td>
                          <td className="py-2 px-3 md:py-2.5 md:px-4"><span className="text-[10px] md:text-xs font-mono text-brand truncate block">{attempt.ip_address || 'N/A'}</span></td>
                          <td className="py-2 px-3 md:py-2.5 md:px-4">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-medium ${attempt.attempt_type === 'login' ? 'bg-purple-500/20 text-purple-400' : attempt.attempt_type === '2fa' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {attempt.attempt_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 md:py-2.5 md:px-4"><span className={`text-[10px] md:text-xs ${attempt.success === 1 ? 'text-green-400' : 'text-red-400'}`}>{attempt.success === 1 ? '✓ Pass' : '✗ Fail'}</span></td>
                          <td className="py-2 px-3 md:py-2.5 md:px-4"><span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap block">{attempt.attempt_time ? new Date(attempt.attempt_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></td>
                          <td className="py-2 px-3 md:py-2.5 md:px-4"><span className="text-[10px] md:text-xs text-gray-500 truncate block" title={attempt.user_agent}>{attempt.user_agent ? attempt.user_agent.substring(0, 30) + '...' : 'N/A'}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500"><Shield className="w-6 h-6 mx-auto mb-2 opacity-50" /><p className="text-xs">No login attempts recorded</p></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Platform Distribution */}
            <div className="lg:col-span-1 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl">
              <h3 className="text-sm md:text-lg font-bold text-white mb-2 md:mb-4">Service Distribution</h3>
              <div className="h-40 md:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={platformDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                      {platformDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2">
                {platformDistribution.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] md:text-sm">
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-white">Recent Orders</h3>
                  <p className="text-[10px] md:text-xs text-gray-500">Latest 5 orders</p>
                </div>
                <button onClick={() => navigate('/admin/orders')} className="px-3 py-1.5 md:px-4 md:py-2 bg-brand/20 text-brand rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium hover:bg-brand/30 transition-colors">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] md:min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['ID', 'User', 'Service', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left py-2 md:py-4 px-2 md:px-4 text-[8px] md:text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, index) => (
                      <motion.tr
                        key={order.order_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-2 md:py-4 px-2 md:px-4"><span className="text-[10px] md:text-sm font-mono text-brand">#{order.api_orderid || order.order_id}</span></td>
                        <td className="py-2 md:py-4 px-2 md:px-4"><span className="text-[10px] md:text-sm text-white truncate max-w-[80px] md:max-w-none block">{order.user_name || 'User'}</span></td>
                        <td className="py-2 md:py-4 px-2 md:px-4"><span className="text-[10px] md:text-sm text-gray-300 line-clamp-1 max-w-[100px] md:max-w-xs">{order.service_name || 'Service'}</span></td>
                        <td className="py-2 md:py-4 px-2 md:px-4">{getStatusBadge(order.order_status)}</td>
                        <td className="py-2 md:py-4 px-2 md:px-4"><span className="text-[10px] md:text-sm text-gray-400 whitespace-nowrap">{new Date(order.order_create).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
