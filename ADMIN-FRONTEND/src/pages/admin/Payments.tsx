import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Landmark, Smartphone, Plus, Edit, Trash2, 
  CheckCircle, AlertCircle, Search,
  CreditCard, Bitcoin, Save, X, Loader2, Menu, Bell,
  Image as ImageIcon, Upload, Shield, LogOut
} from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';

interface DepositMethod {
  id: number;
  type: 'bank' | 'ez_cash' | 'other';
  name: string;
  description: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  branch: string | null;
  ez_cash_number: string | null;
  custom_details: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const iconOptions = [
  { value: 'Landmark',   label: 'Bank',   icon: Landmark },
  { value: 'Smartphone', label: 'Mobile', icon: Smartphone },
  { value: 'CreditCard', label: 'Card',   icon: CreditCard },
  { value: 'Bitcoin',    label: 'Crypto', icon: Bitcoin },
  { value: 'Wallet',     label: 'Wallet', icon: Wallet },
];

// ── Real admin info from JWT ──────────────────────────────────────────────
const useAdminInfo = () => {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email: string = payload.email || 'admin@panel.com';
      const name: string = (import.meta.env.VITE_ADMIN_NAME as string) || email.split('@')[0];
      return { name, email, initials: name.slice(0, 2).toUpperCase() };
    } catch {
      return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };
    }
  }, []);
};

const PaymentsPage: React.FC = () => {
  const { name, initials } = useAdminInfo();
  const navigate = (window as any).__navigate || ((path: string) => { window.location.href = path; });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DepositMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'bank' as 'bank' | 'ez_cash' | 'other',
    name: '',
    description: '',
    bank_name: '',
    account_number: '',
    account_holder: '',
    branch: '',
    ez_cash_number: '',
    custom_details: '',
    icon: 'Landmark',
    image_url: '',
    is_active: 1,
    display_order: 0
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/deposit-details/admin/all`, {
        headers: authHeader()
      });
      if (response.data.success) setMethods(response.data.methods);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setStatus(type);
    setStatusMessage(message);
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'bank', name: '', description: '', bank_name: '', account_number: '',
      account_holder: '', branch: '', ez_cash_number: '', custom_details: '',
      icon: 'Landmark', image_url: '', is_active: 1, display_order: methods.length
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingMethod(null);
  };

  const handleAddNew = () => { resetForm(); setShowAddModal(true); };

  const handleEdit = (method: DepositMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type, name: method.name, description: method.description || '',
      bank_name: method.bank_name || '', account_number: method.account_number || '',
      account_holder: method.account_holder || '', branch: method.branch || '',
      ez_cash_number: method.ez_cash_number || '', custom_details: method.custom_details || '',
      icon: method.icon || 'Landmark', image_url: method.image_url || '',
      is_active: method.is_active, display_order: method.display_order
    });
    if (method.image_url) setImagePreview(getImageUrl(method.image_url));
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) return;
    try {
      setDeleteLoading(id);
      const response = await axios.delete(`${API_URL}/deposit-details/admin/${id}`, {
        headers: authHeader()
      });
      if (response.data.success) {
        showNotification('success', 'Payment method deleted successfully');
        fetchMethods();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to delete payment method');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/deposit-details/admin/${id}/toggle`,
        { is_active: currentStatus === 1 ? 0 : 1 },
        { headers: authHeader() }
      );
      if (response.data.success) {
        showNotification('success', 'Status updated successfully');
        fetchMethods();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formDataToSend.append(key, String(value));
      });
      if (imageFile) formDataToSend.append('image', imageFile);

      const url = editingMethod
        ? `${API_URL}/deposit-details/admin/${editingMethod.id}`
        : `${API_URL}/deposit-details/admin/create`;

      const response = await axios({
        method: editingMethod ? 'PUT' : 'POST',
        url,
        data: formDataToSend,
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showNotification('success', editingMethod ? 'Method updated successfully' : 'Method added successfully');
        setShowAddModal(false);
        resetForm();
        fetchMethods();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/logout';
  };

  const filteredMethods = methods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (method.type === 'bank' && method.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (method.type === 'ez_cash' && method.ez_cash_number?.includes(searchQuery))
  );

  const getTypeIcon = (type: string) => {
    switch (type) { case 'bank': return Landmark; case 'ez_cash': return Smartphone; default: return CreditCard; }
  };
  const getTypeColor = (type: string) => {
    switch (type) { case 'bank': return 'text-blue-400 bg-blue-500/20'; case 'ez_cash': return 'text-green-400 bg-green-500/20'; default: return 'text-purple-400 bg-purple-500/20'; }
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

        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">

            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors">
                <Menu className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </button>
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
              <h1 className="text-base md:text-2xl font-black text-white hidden sm:block">Payment Methods</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button className="relative p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </button>

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-white">{initials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs md:text-sm font-bold text-white leading-tight">{name}</p>
                  <div className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-green-400" />
                    <p className="text-[9px] md:text-[10px] text-green-400/80 font-medium">Super Admin</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 group ml-1"
                >
                  <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
                  <span className="text-[10px] md:text-xs text-red-400 group-hover:text-red-300 font-medium hidden md:block">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Payment Methods</h1>
              <p className="text-sm text-gray-400">Manage deposit methods and details</p>
            </div>
            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors text-sm font-bold">
              <Plus className="w-4 h-4" /> Add New Method
            </button>
          </div>

          <AnimatePresence>
            {status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-xl border shadow-2xl backdrop-blur-2xl ${
                  status === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                }`}
              >
                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium text-sm">{statusMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payment methods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Methods Grid */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>
          ) : filteredMethods.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No payment methods found</p>
              <button onClick={handleAddNew} className="mt-4 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors text-sm font-bold">Add Your First Method</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMethods.map((method, index) => {
                const TypeIcon = getTypeIcon(method.type);
                const typeColorClass = getTypeColor(method.type);
                return (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-6 hover:border-brand/30 transition-all"
                  >
                    <div className="flex justify-end items-center gap-2 mb-4">
                      <button onClick={() => handleEdit(method)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(method.id)} disabled={deleteLoading === method.id} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                        {deleteLoading === method.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {method.image_url && (
                      <div className="mb-4 flex justify-center">
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                          <img src={getImageUrl(method.image_url)} alt={method.name} className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200/2a2a2a/ffffff?text=Image'; }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3 rounded-xl ${typeColorClass} shrink-0`}><TypeIcon className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg mb-2 break-words">{method.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColorClass}`}>{method.type.replace('_', ' ').toUpperCase()}</span>
                          <button
                            onClick={() => handleToggleActive(method.id, method.is_active)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${method.is_active === 1 ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}
                          >
                            {method.is_active === 1 ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      {method.type === 'bank' && (<>
                        {method.bank_name && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Bank</span><span className="text-white font-medium text-right">{method.bank_name}</span></div>}
                        {method.account_number && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Account</span><span className="text-brand font-mono text-right break-all">{method.account_number}</span></div>}
                        {method.account_holder && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Holder</span><span className="text-white text-right break-words">{method.account_holder}</span></div>}
                        {method.branch && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Branch</span><span className="text-white text-right">{method.branch}</span></div>}
                      </>)}
                      {method.type === 'ez_cash' && method.ez_cash_number && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Number</span><span className="text-brand font-mono text-right">{method.ez_cash_number}</span></div>}
                      {method.type === 'other' && method.custom_details && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-500 text-xs">Details</span><span className="text-white text-right max-w-[200px] break-words">{method.custom_details}</span></div>}
                      {method.description && <div className="pt-2"><p className="text-xs text-gray-400 leading-relaxed">{method.description}</p></div>}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5"><p className="text-[10px] text-gray-600 text-right">ID: {method.id}</p></div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl z-[51] max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-xl font-black text-white">{editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4" encType="multipart/form-data">
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand outline-none" required>
                    <option value="bank">Bank Transfer</option>
                    <option value="ez_cash">eZ Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Method Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Bank of Ceylon (BOC)"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">QR Code / Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                      {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" /> Choose Image
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Description (Optional)</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description..." rows={2}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none resize-none" />
                </div>

                {/* Bank Fields */}
                {formData.type === 'bank' && (<>
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Bank Name</label>
                    <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder="Bank of Ceylon"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Account Number</label>
                    <input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} placeholder="1234567890"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Account Holder</label>
                    <input type="text" name="account_holder" value={formData.account_holder} onChange={handleInputChange} placeholder="SMM PANEL PVT LTD"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Branch</label>
                    <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} placeholder="Colombo Fort"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" /></div>
                </>)}

                {/* eZ Cash Fields */}
                {formData.type === 'ez_cash' && (
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">eZ Cash Number</label>
                    <input type="text" name="ez_cash_number" value={formData.ez_cash_number} onChange={handleInputChange} placeholder="0771234567"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required /></div>
                )}

                {/* Other Fields */}
                {formData.type === 'other' && (
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Custom Details</label>
                    <textarea name="custom_details" value={formData.custom_details} onChange={handleInputChange} placeholder="Enter payment details..." rows={3}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" required /></div>
                )}

                {/* Icon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Icon</label>
                  <select name="icon" value={formData.icon} onChange={handleInputChange} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand outline-none">
                    {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-bold text-gray-400">Active</label>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_active: prev.is_active === 1 ? 0 : 1 }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active === 1 ? 'bg-brand' : 'bg-gray-600'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active === 1 ? 'translate-x-6' : ''}`} />
                  </button>
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Display Order (Optional)</label>
                  <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} placeholder="Auto if empty"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand outline-none" />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 transition-colors font-bold text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Method'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


export default PaymentsPage;
