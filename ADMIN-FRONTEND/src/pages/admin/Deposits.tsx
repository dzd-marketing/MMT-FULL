import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, CheckCircle, XCircle, AlertCircle, Search,
  Eye, Download, Filter, ChevronDown, Loader2, RefreshCw,
  Calendar, User, Mail, Phone, MessageSquare, Clock,
  CheckCheck, X, Info, FileText, Edit2, Menu, Bell
} from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

interface Deposit {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  amount: number;
  receipt_url: string;
  receipt_filename: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  approved_at: string | null;
  current_balance?: number;
}

const AdminDepositsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  
  // Modal states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Form states
  const [approveAmount, setApproveAmount] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_approved_amount: 0
  });

  const API_URL = 'https://admin.mmtsmmpanel.cyberservice.online';

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };
    alert(`${icons[type]} ${message}`);
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const endpoint = filterStatus === 'pending' 
        ? '/admin/deposits/pending'
        : `/admin/deposits/all${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      if (response.data.success) {
        setDeposits(response.data.deposits);
      }
    } catch (error: any) {
      console.error('Error fetching deposits:', error);
      showNotification(error.response?.data?.message || 'Failed to fetch deposits', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/deposits/stats/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDeposits();
    fetchStats();
  }, [filterStatus]);

  // Handle approve with amount editing
  const handleApprove = async () => {
    if (!selectedDeposit) return;
    
    if (approveAmount <= 0) {
      showNotification('Amount must be greater than 0', 'error');
      return;
    }

    setProcessingId(selectedDeposit.id);
    try {
      const response = await axios.post(
        `${API_URL}/admin/deposits/${selectedDeposit.id}/approve`,
        { amount: approveAmount },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );

      if (response.data.success) {
        showNotification(`Deposit approved! Amount: LKR ${approveAmount.toLocaleString()}`, 'success');
        setShowApproveModal(false);
        setSelectedDeposit(null);
        setApproveAmount(0);
        fetchDeposits();
        fetchStats();
        
        try {
          await axios.post(
            `${API_URL}/admin/deposits/${selectedDeposit.id}/delete-receipt`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
          );
        } catch (deleteError) {
          console.error('Error deleting receipt:', deleteError);
        }
      }
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      showNotification(error.response?.data?.message || 'Failed to approve deposit', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;

    setProcessingId(selectedDeposit.id);
    try {
      const response = await axios.post(
        `${API_URL}/admin/deposits/${selectedDeposit.id}/reject`, 
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );

      if (response.data.success) {
        showNotification('Deposit rejected successfully', 'success');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedDeposit(null);
        fetchDeposits();
        fetchStats();
        
        try {
          await axios.post(
            `${API_URL}/admin/deposits/${selectedDeposit.id}/delete-receipt`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
          );
        } catch (deleteError) {
          console.error('Error deleting receipt:', deleteError);
        }
      }
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      showNotification(error.response?.data?.message || 'Failed to reject deposit', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open approve modal
  const openApproveModal = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setApproveAmount(deposit.amount);
    setShowApproveModal(true);
  };

  // Filter deposits by search
  const filteredDeposits = deposits.filter(deposit => 
    deposit.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.id.toString().includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeTickets={0}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 h-screen flex flex-col overflow-hidden`}>
<AdminHeader
  title="Deposits Management"
  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
  onMobileMenuClick={() => setMobileSidebarOpen(true)}
  activeTickets={0} 
/>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Deposit Requests</h1>
              <p className="text-sm text-gray-400">Manage and approve user deposits</p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none w-64"
                />
              </div>

              <button
                onClick={() => {
                  fetchDeposits();
                  fetchStats();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total Deposits</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-purple-400">LKR {stats.total_approved_amount?.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['pending', 'approved', 'rejected', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-brand text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {status} {status !== 'all' && `(${stats[status as keyof typeof stats] || 0})`}
              </button>
            ))}
          </div>

          {/* Deposits Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No deposit requests found</p>
              {searchTerm && (
                <p className="text-gray-500 text-xs mt-2">Try clearing the search</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDeposits.map((deposit) => (
                <motion.div
                  key={deposit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6 hover:border-brand/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{deposit.full_name}</h3>
                      <p className="text-sm text-gray-400">{deposit.email}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: #{deposit.id}</p>
                    </div>
                    {getStatusBadge(deposit.status)}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-500">Amount</span>
                      <span className="text-lg font-bold text-brand">LKR {deposit.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-500">Date</span>
                      <span className="text-sm text-gray-300">{formatDate(deposit.created_at)}</span>
                    </div>
                    {deposit.current_balance !== undefined && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-gray-500">Current Balance</span>
                        <span className="text-sm text-green-400">LKR {deposit.current_balance?.toLocaleString()}</span>
                      </div>
                    )}
                    {deposit.reject_reason && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-gray-500">Reject Reason</span>
                        <span className="text-sm text-red-400 text-right">{deposit.reject_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Receipt Preview */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setSelectedDeposit(deposit);
                        setShowReceiptModal(true);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand" />
                        <span className="text-sm text-gray-300">View Receipt</span>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Actions */}
                  {deposit.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => openApproveModal(deposit)}
                        disabled={processingId === deposit.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {processingId === deposit.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeposit(deposit);
                          setShowRejectModal(true);
                        }}
                        disabled={processingId === deposit.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showReceiptModal && selectedDeposit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceiptModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Receipt - {selectedDeposit.full_name}
                  </h3>
                  <p className="text-xs text-gray-400">Amount: LKR {selectedDeposit.amount?.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <img
                  src={`${API_URL}${selectedDeposit.receipt_url}`}
                  alt="Receipt"
                  className="w-full h-auto rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Receipt+Not+Found';
                  }}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <a
                    href={`${API_URL}${selectedDeposit.receipt_url}`}
                    download={selectedDeposit.receipt_filename}
                    className="flex items-center gap-2 px-4 py-2 bg-brand/20 text-brand rounded-xl hover:bg-brand/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== APPROVE MODAL ========== */}
      <AnimatePresence>
        {showApproveModal && selectedDeposit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowApproveModal(false);
                setSelectedDeposit(null);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl z-[101] p-6"
            >
              <h3 className="text-xl font-bold text-white mb-2">Approve Deposit</h3>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  You can edit the amount before approving
                </p>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-sm text-gray-300">{selectedDeposit.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedDeposit.email}</p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Amount (LKR)</label>
                  <input
                    type="number"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(Number(e.target.value))}
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter amount"
                  />
                </div>

                {/* Original Amount */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Original Amount:</span>
                  <span className="text-gray-300">LKR {selectedDeposit.amount?.toLocaleString()}</span>
                </div>

                {/* Current Balance */}
                {selectedDeposit.current_balance !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Current Balance:</span>
                    <span className="text-green-400">LKR {selectedDeposit.current_balance?.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedDeposit(null);
                  }}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processingId === selectedDeposit.id || approveAmount <= 0}
                  className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedDeposit.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  Approve
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== REJECT MODAL ========== */}
      <AnimatePresence>
        {showRejectModal && selectedDeposit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRejectModal(false);
                setSelectedDeposit(null);
                setRejectReason('');
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl z-[101] p-6"
            >
              <h3 className="text-xl font-bold text-white mb-2">Reject Deposit</h3>
              
              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-300">{selectedDeposit.full_name}</p>
                <p className="text-xs text-gray-500">Amount: LKR {selectedDeposit.amount?.toLocaleString()}</p>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none mb-4"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDeposit(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === selectedDeposit.id}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedDeposit.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Reject
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDepositsPage;

