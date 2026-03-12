import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Eye, Edit, Save, X, Loader, RefreshCw,
  User, Mail, Phone, Key, Wallet, ShoppingBag, CreditCard,
  Menu, Bell, ChevronLeft, ChevronRight, Copy, CheckCircle,
  XCircle, AlertCircle, Lock, Unlock, Download, Filter,
  FileText, DownloadCloud
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  profile_picture: string | null;
  auth_provider: 'local' | 'google' | 'both';
  admin_type: '1' | '2';
  is_active: number;
  email_verified: number;
  created_at: string;
  last_login: string | null;
  apikey: string | null;
  currency: string;
  balance: number;
  spent: number;
  total_history: number;
  total_orders?: number;
  total_deposits?: number;
  total_deposit_amount?: number;
}

interface UserStats {
  total_users: number;
  admin_users: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AdminUsersPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'all' | 'balance' | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    admin_users: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [updatingBalance, setUpdatingBalance] = useState(false);

  // ============= FIXED: API URLs =============
  const API_URL = import.meta.env.VITE_API_URL;  // https://admin.mmtsmmpanel.cyberservice.online/api
  const IMAGE_URL = 'https://mmtsmmpanel.cyberservice.online';  // Main domain for images

  // ============= IMAGE URL HELPER FUNCTION =============
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '';
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // Remove any '/api' prefix if present
    const cleanPath = imagePath.replace(/^\/api/, '');
    
    // Return full URL with IMAGE_URL base
    return `${IMAGE_URL}${cleanPath}`;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axios.get(`${API_URL}/admin/users/all?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users/stats/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        setStats({
          total_users: response.data.stats.total_users,
          admin_users: response.data.stats.admin_users
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.page, searchQuery]);

  const fetchUserDetails = async (id: number) => {
    try {
      const response = await axios.get(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        setSelectedUser(response.data.user);
        setNewBalance(response.data.user.balance);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;

    setUpdatingBalance(true);
    try {
      const response = await axios.put(`${API_URL}/admin/users/${selectedUser.id}`,
        { balance: newBalance },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );

      if (response.data.success) {
        setEditingBalance(false);
        fetchUsers();
        fetchStats();
        if (selectedUser) {
          fetchUserDetails(selectedUser.id);
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    } finally {
      setUpdatingBalance(false);
    }
  };

  const downloadAllUsersData = async () => {
    setDownloading('all');
    try {
      const response = await axios.get(`${API_URL}/admin/users/all?limit=1000`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        const allUsers = response.data.users;
        
        const headers = ['Full Name', 'Email', 'WhatsApp Number', 'Phone', 'User ID', 'Joined Date'];
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        allUsers.forEach((user: User) => {
          const row = [
            `"${user.full_name || ''}"`,
            `"${user.email || ''}"`,
            `"${user.whatsapp || ''}"`,
            `"${user.phone || ''}"`,
            user.id,
            `"${format(new Date(user.created_at), 'yyyy-MM-dd')}"`
          ];
          csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_users_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading users data:', error);
      alert('Failed to download users data');
    } finally {
      setDownloading(null);
    }
  };

  const downloadUsersWithBalance = async () => {
    setDownloading('balance');
    try {
      const response = await axios.get(`${API_URL}/admin/users/all?limit=1000`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        const allUsers = response.data.users;
        
        const headers = ['Full Name', 'Email', 'Balance (LKR)', 'User ID', 'Joined Date'];
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        allUsers.forEach((user: User) => {
          const balanceValue = typeof user.balance === 'number' 
            ? user.balance 
            : parseFloat(user.balance as any) || 0;
          
          const row = [
            `"${user.full_name || ''}"`,
            `"${user.email || ''}"`,
            balanceValue.toFixed(2),
            user.id,
            `"${format(new Date(user.created_at), 'yyyy-MM-dd')}"`
          ];
          csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_balance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading users balance:', error);
      alert('Failed to download users balance');
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProviderBadge = (provider: string) => {
    switch(provider) {
      case 'google':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Google</span>;
      case 'local':
        return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Local</span>;
      default:
        return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Both</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeTickets={0}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 min-h-screen flex flex-col`}>
        <AdminHeader
          title="Users Management"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          activeTickets={0} 
        />

        <div className="flex-1 p-4 md:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-3 md:p-4">
              <p className="text-xs text-gray-400 mb-1">Total Users</p>
              <p className="text-xl md:text-2xl font-bold text-white">{stats.total_users}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-3 md:p-4">
              <p className="text-xs text-gray-400 mb-1">Admins</p>
              <p className="text-xl md:text-2xl font-bold text-purple-400">{stats.admin_users}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchUsers();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl p-3 md:p-4 hover:border-brand/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar - FIXED: Using getImageUrl */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
                      {user.profile_picture ? (
                        <img 
                          src={getImageUrl(user.profile_picture)}
                          alt={user.full_name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="text-xs md:text-sm font-bold text-white">${getInitials(user.full_name)}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-xs md:text-sm font-bold text-white">
                          {getInitials(user.full_name)}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h3 className="font-medium text-sm md:text-base text-white truncate max-w-[120px] md:max-w-[200px]">
                          {user.full_name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getProviderBadge(user.auth_provider)}
                          {user.admin_type === '1' && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] md:text-xs">Admin</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-[10px] md:text-xs text-gray-400">
                        <span className="flex items-center gap-1 truncate max-w-[140px] xs:max-w-[180px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance & Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400">Balance</p>
                        <p className="text-sm md:text-base font-bold text-brand whitespace-nowrap">
                          LKR {formatCurrency(user.balance)}
                        </p>
                      </div>
                      <button
                        onClick={() => fetchUserDetails(user.id)}
                        className="p-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile Balance */}
                  <div className="sm:hidden flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                    <span className="text-xs text-gray-400">Balance</span>
                    <span className="text-sm font-bold text-brand">LKR {formatCurrency(user.balance)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 mt-4 border-t border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-xs sm:text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-2xl shadow-2xl z-[51]"
            >
              <div className="sticky top-0 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border-b border-white/10 p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Avatar in Modal - FIXED */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
                    {selectedUser.profile_picture ? (
                      <img 
                        src={getImageUrl(selectedUser.profile_picture)}
                        alt={selectedUser.full_name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<span class="text-xs sm:text-sm font-bold text-white">${getInitials(selectedUser.full_name)}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {getInitials(selectedUser.full_name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-lg font-bold text-white truncate">{selectedUser.full_name}</h2>
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Balance Section */}
                <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2">Balance (LKR)</p>
                  {editingBalance ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                        placeholder="Enter amount"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateBalance}
                          disabled={updatingBalance}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        >
                          {updatingBalance ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingBalance(false);
                            setNewBalance(selectedUser.balance);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xl sm:text-2xl font-bold text-brand">LKR {formatCurrency(selectedUser.balance)}</p>
                      <button
                        onClick={() => setEditingBalance(true)}
                        className="p-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                    <p className="text-[8px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Spent</p>
                    <p className="text-xs sm:text-sm font-bold text-purple-400 truncate">LKR {formatCurrency(selectedUser.spent)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                    <p className="text-[8px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Deposits</p>
                    <p className="text-xs sm:text-sm font-bold text-green-400 truncate">LKR {formatCurrency(selectedUser.total_deposit_amount || 0)}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1 sm:mb-2">Account Information</h3>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">User ID</span>
                    <span className="text-[10px] sm:text-xs text-brand font-mono">#{selectedUser.id}</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">Phone</span>
                    <span className="text-[10px] sm:text-xs text-white">{selectedUser.phone || '-'}</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">WhatsApp</span>
                    <span className="text-[10px] sm:text-xs text-white">{selectedUser.whatsapp || '-'}</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">Joined</span>
                    <span className="text-[10px] sm:text-xs text-white">{format(new Date(selectedUser.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">Last Login</span>
                    <span className="text-[10px] sm:text-xs text-white">{selectedUser.last_login ? format(new Date(selectedUser.last_login), 'MMM dd, HH:mm') : 'Never'}</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">Email Verified</span>
                    <span className={`text-[10px] sm:text-xs ${selectedUser.email_verified === 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedUser.email_verified === 1 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">Currency</span>
                    <span className="text-[10px] sm:text-xs text-white">
                      {selectedUser.currency === '1' ? 'USD' : selectedUser.currency === '2' ? 'LKR' : 'INR'}
                    </span>
                  </div>
                  
                  {/* API Key Section */}
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-gray-400">API Key</span>
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] sm:text-xs text-brand font-mono break-all">
                        {selectedUser.apikey ? selectedUser.apikey.substring(0, 15) + '...' : 'Not set'}
                      </code>
                      {selectedUser.apikey && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedUser.apikey!);
                            alert('API key copied!');
                          }}
                          className="text-gray-400 hover:text-brand shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsersPage;
