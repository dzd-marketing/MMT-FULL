import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactDOM from 'react-dom';
import { 
  Ticket, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
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
  LayoutGrid, ListTodo, SlidersHorizontal, Settings2, Code,
  Inbox, Send, Reply, Paperclip, AtSign, Flag, AlertTriangle,
  AlertOctagon, MessageCircle, MessagesSquare, PhoneCall,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Archive, Tag, Minus,
  FileText, File, FileImage, FileArchive
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format, formatDistance } from 'date-fns';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

// ============= Type Definitions =============

interface Ticket {
  id: number;
  ticket_number: string;
  user_id: number;
  subject: string;
  department: 'technical' | 'billing' | 'general' | 'refill' | 'api';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  message: string;
  attachments: any;
  last_reply_at: string | null;
  last_reply_by: number | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  profile_picture?: string;
  reply_count: number;
  attachment_count: number;
}

interface TicketReply {
  id: number;
  ticket_id: number;
  user_id: number | null;
  message: string;
  attachments: any;
  is_staff: number;
  created_at: string;
  full_name: string;
  email: string;
  profile_picture?: string;
  admin_type?: string;
}

interface TicketAttachment {
  id: number;
  ticket_id: number;
  reply_id: number | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number | null;
  created_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  waiting: number;
  resolved: number;
  closed: number;
  unique_users: number;
  by_department: Array<{ department: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============= Custom Select =============

interface DropdownOption { value: string; label: string; }
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Select", icon, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button ref={buttonRef} onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-all duration-200 focus:ring-2 focus:ring-brand/50 outline-none">
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="truncate font-medium">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && dropdownPosition && ReactDOM.createPortal(
        <motion.div ref={dropdownRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
          style={{ position: 'absolute', top: dropdownPosition.top, left: dropdownPosition.left, width: dropdownPosition.width, zIndex: 9999 }}
          className="bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${option.value === value ? 'text-brand bg-brand/10' : 'text-gray-300'}`}>
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

// ============= Badge Components =============

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const info: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    open:        { label: 'Open',        color: 'bg-green-500/20 text-green-400 border-green-500/30',   icon: <CheckCircle className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: <Play className="w-3 h-3" /> },
    waiting:     { label: 'Waiting',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
    resolved:    { label: 'Resolved',    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <CheckCircle className="w-3 h-3" /> },
    closed:      { label: 'Closed',      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: <XCircle className="w-3 h-3" /> },
  };
  const s = info[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <HelpCircle className="w-3 h-3" /> };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.color}`}>{s.icon}{s.label}</span>;
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const info: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    low:    { label: 'Low',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: <ArrowDown className="w-3 h-3" /> },
    medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: <Minus className="w-3 h-3" /> },
    high:   { label: 'High',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <ArrowUp className="w-3 h-3" /> },
    urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30',         icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const p = info[priority] || { label: priority, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <HelpCircle className="w-3 h-3" /> };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${p.color}`}>{p.icon}{p.label}</span>;
};

const DepartmentBadge: React.FC<{ department: string }> = ({ department }) => {
  const info: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    technical: { label: 'Technical', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Server className="w-3 h-3" /> },
    billing:   { label: 'Billing',   color: 'bg-green-500/20 text-green-400 border-green-500/30',   icon: <DollarSign className="w-3 h-3" /> },
    general:   { label: 'General',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',      icon: <MessageSquare className="w-3 h-3" /> },
    refill:    { label: 'Refill',    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <RefreshCcw className="w-3 h-3" /> },
    api:       { label: 'API',       color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: <LinkIcon className="w-3 h-3" /> },
  };
  const d = info[department] || { label: department, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <HelpCircle className="w-3 h-3" /> };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${d.color}`}>{d.icon}{d.label}</span>;
};

// ============= Avatar Helper =============

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

const Avatar: React.FC<{ src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ src, name, size = 'sm' }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-lg';

  // Get image URL with proper base
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    const API_URL = import.meta.env.VITE_API_URL;
    const BASE_URL = API_URL?.replace('/api', '') || 'https://mmtsmmpanel.cyberservice.online';
    
    const cleanPath = imagePath.replace(/^\/api/, '');
    return `${BASE_URL}${cleanPath}`;
  };

  const imageUrl = getImageUrl(src || '');

  if (src && !imgError && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center font-bold flex-shrink-0`}>
      {getInitials(name || 'U')}
    </div>
  );
};

// ============= Attachment Preview Component =============

const AttachmentPreview: React.FC<{ attachment: TicketAttachment }> = ({ attachment }) => {
  const [imageError, setImageError] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL?.replace('/api', '') || 'https://mmtsmmpanel.cyberservice.online';

  // Get attachment URL from file_path
  const getAttachmentUrl = () => {
    if (!attachment.file_path) return '';
    
    // If it's already a full URL
    if (attachment.file_path.startsWith('http')) return attachment.file_path;
    
    // Extract just the filename from the full system path
    // Example: "/home/user/.../uploads/tickets/filename.png" -> "filename.png"
    const filename = attachment.file_path.split('/').pop();
    
    // Return the public URL
    return `${BASE_URL}/uploads/tickets/${filename}`;
  };

  const fileUrl = getAttachmentUrl();

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (attachment.mime_type?.startsWith('image/')) return <FileImage className="w-4 h-4 text-brand" />;
    if (attachment.mime_type?.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (attachment.mime_type?.includes('zip') || attachment.mime_type?.includes('rar') || attachment.mime_type?.includes('tar')) 
      return <FileArchive className="w-4 h-4 text-yellow-400" />;
    if (attachment.mime_type?.includes('word') || attachment.file_name?.endsWith('.doc') || attachment.file_name?.endsWith('.docx')) 
      return <FileText className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <a 
      href={fileUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 bg-black/30 rounded-lg hover:bg-black/50 transition-colors group"
    >
      {attachment.mime_type?.startsWith('image/') && !imageError ? (
        <img 
          src={fileUrl} 
          alt={attachment.file_name} 
          className="w-10 h-10 object-cover rounded group-hover:scale-110 transition-transform" 
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 bg-brand/10 rounded flex items-center justify-center">
          {getFileIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{attachment.file_name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
};

// ============= Main Component =============

const AdminTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, in_progress: 0, waiting: 0, resolved: 0, closed: 0, unique_users: 0, by_department: [], by_priority: [] });

  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkActionValue, setBulkActionValue] = useState<string>('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([]);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL?.replace('/api', '') || 'https://mmtsmmpanel.cyberservice.online';

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

  // ============= Helper Functions =============
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const department = params.get('department');
    const priority = params.get('priority');
    const page = params.get('page');
    if (status) setSelectedStatus(status);
    if (department) setSelectedDepartment(department);
    if (priority) setSelectedPriority(priority);
    if (page) setCurrentPage(parseInt(page));
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [currentPage, selectedStatus, selectedDepartment, selectedPriority, itemsPerPage]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredTickets(tickets);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTickets(tickets.filter(t =>
        t.ticket_number.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.full_name?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
      ));
    }
  }, [tickets, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedDepartment !== 'all') params.set('department', selectedDepartment);
    if (selectedPriority !== 'all') params.set('priority', selectedPriority);
    if (currentPage > 1) params.set('page', currentPage.toString());
    navigate({ search: params.toString() }, { replace: true });
  }, [selectedStatus, selectedDepartment, selectedPriority, currentPage]);

  useEffect(() => {
    if (selectAll) setSelectedTickets(filteredTickets.map(t => t.id));
    else setSelectedTickets([]);
  }, [selectAll, filteredTickets]);

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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedDepartment !== 'all' && { department: selectedDepartment }),
        ...(selectedPriority !== 'all' && { priority: selectedPriority }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axios.get(`${API_URL}/admin/tickets?${params}`, { headers: authHeader() });
      if (response.data.success) {
        setTickets(response.data.tickets);
        setFilteredTickets(response.data.tickets);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/tickets/stats`, { headers: authHeader() });
      if (response.data.success) setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const response = await axios.get(`${API_URL}/admin/tickets/${ticketId}`, { headers: authHeader() });
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
        setTicketReplies(response.data.ticket.replies || []);
        setTicketAttachments(response.data.ticket.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTickets.length === 0) return;
    setActionLoading(0);
    try {
      const response = await axios.post(`${API_URL}/admin/tickets/bulk-action`,
        { action: bulkAction, ticket_ids: selectedTickets, value: bulkActionValue },
        { headers: authHeader() }
      );
      if (response.data.success) {
        fetchTickets(); fetchStats();
        setSelectedTickets([]); setSelectAll(false);
        setBulkAction(''); setBulkActionValue('');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setActionLoading(ticketId);
    try {
      await axios.put(`${API_URL}/admin/tickets/${ticketId}/status`, { status: newStatus }, { headers: authHeader() });
      fetchTickets(); fetchStats();
      if (selectedTicket?.id === ticketId) fetchTicketDetails(ticketId);
      setActiveDropdown(null); setDropdownPosition(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePriorityChange = async (ticketId: number, newPriority: string) => {
    setActionLoading(ticketId);
    try {
      await axios.put(`${API_URL}/admin/tickets/${ticketId}/priority`, { priority: newPriority }, { headers: authHeader() });
      fetchTickets();
      if (selectedTicket?.id === ticketId) fetchTicketDetails(ticketId);
      setActiveDropdown(null); setDropdownPosition(null);
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTicket = async (ticketId: number, permanent: boolean = false) => {
    if (!window.confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'close'} this ticket?`)) return;
    setActionLoading(ticketId);
    try {
      await axios.delete(`${API_URL}/admin/tickets/${ticketId}?permanent=${permanent}`, { headers: authHeader() });
      fetchTickets(); fetchStats();
      if (selectedTicket?.id === ticketId) { setShowDetailsModal(false); setSelectedTicket(null); }
      setActiveDropdown(null); setDropdownPosition(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const formData = new FormData();
    formData.append('message', replyMessage);
    replyAttachments.forEach(file => formData.append('attachments', file));

    setActionLoading(selectedTicket.id);
    try {
      const response = await axios.post(
        `${API_URL}/admin/tickets/${selectedTicket.id}/reply`,
        formData,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) {
        setReplyMessage('');
        setReplyAttachments([]);
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
        fetchStats();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setReplyAttachments(Array.from(e.target.files));
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const openDropdown = (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const dropdownHeight = 400;
    const isMobile = window.innerWidth < 768;
    let top = rect.bottom + window.scrollY;
    if (top + dropdownHeight > window.innerHeight + window.scrollY) top = rect.top + window.scrollY - dropdownHeight;

    setDropdownPosition(isMobile
      ? { top: Math.max(10, top), left: window.innerWidth / 2 - 112 }
      : { top, left: rect.right - 200 }
    );
    setActiveDropdown(ticketId);
  };

  const StatCard = ({ label, count, icon: Icon, color, onClick, active }: any) => (
    <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} border ${active ? 'border-brand ring-2 ring-brand/20' : 'border-white/10'} rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${active ? 'bg-brand/20' : 'bg-white/5'}`}>
          <Icon className={`w-5 h-5 ${active ? 'text-brand' : 'text-white/80'}`} />
        </div>
        <span className="text-2xl font-bold text-white">{count}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </motion.div>
  );

  const statusOptions = [
    { value: 'all', label: 'All Status' }, { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' }, { value: 'waiting', label: 'Waiting' },
    { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }
  ];
  const departmentOptions = [
    { value: 'all', label: 'All Departments' }, { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' }, { value: 'general', label: 'General' },
    { value: 'refill', label: 'Refill' }, { value: 'api', label: 'API' }
  ];
  const priorityOptions = [
    { value: 'all', label: 'All Priorities' }, { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }
  ];
  const bulkActionOptions = [
    { value: 'status', label: 'Change Status' }, { value: 'priority', label: 'Change Priority' },
    { value: 'department', label: 'Change Department' }, { value: 'delete', label: 'Close Tickets' }
  ];
  const bulkStatusOptions = [
    { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }
  ];
  const bulkPriorityOptions = [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }
  ];
  const bulkDepartmentOptions = [
    { value: 'technical', label: 'Technical' }, { value: 'billing', label: 'Billing' },
    { value: 'general', label: 'General' }, { value: 'refill', label: 'Refill' }, { value: 'api', label: 'API' }
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-brand animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 animate-pulse">Loading tickets...</p>
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
        activeTickets={stats.open + stats.waiting}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 min-h-screen flex flex-col bg-[#0A0A0A]`}>

        <AdminHeader
          title="Tickets Management"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          activeTickets={stats.open + stats.waiting}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">

          {/* Page heading */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/20 rounded-xl"><Ticket className="w-6 h-6 text-brand" /></div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Support Tickets</h2>
                <p className="text-sm text-gray-500">{stats.total} total tickets · {stats.unique_users} unique users</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => { fetchTickets(); fetchStats(); }} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all border border-white/10">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all border border-white/10">
                <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard label="Total" count={stats.total} color="from-gray-600/20 to-gray-700/20" icon={Ticket}
              onClick={() => { setSelectedStatus('all'); setSelectedDepartment('all'); setSelectedPriority('all'); }}
              active={selectedStatus === 'all' && selectedDepartment === 'all' && selectedPriority === 'all'} />
            <StatCard label="Open" count={stats.open} color="from-green-600/20 to-green-700/20" icon={CheckCircle}
              onClick={() => setSelectedStatus('open')} active={selectedStatus === 'open'} />
            <StatCard label="In Progress" count={stats.in_progress} color="from-blue-600/20 to-blue-700/20" icon={Play}
              onClick={() => setSelectedStatus('in_progress')} active={selectedStatus === 'in_progress'} />
            <StatCard label="Waiting" count={stats.waiting} color="from-yellow-600/20 to-yellow-700/20" icon={Clock}
              onClick={() => setSelectedStatus('waiting')} active={selectedStatus === 'waiting'} />
            <StatCard label="Resolved" count={stats.resolved} color="from-purple-600/20 to-purple-700/20" icon={CheckCircle}
              onClick={() => setSelectedStatus('resolved')} active={selectedStatus === 'resolved'} />
            <StatCard label="Closed" count={stats.closed} color="from-gray-600/20 to-gray-700/20" icon={XCircle}
              onClick={() => setSelectedStatus('closed')} active={selectedStatus === 'closed'} />
          </div>

          {/* Search & Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input type="text" placeholder="Search by ticket #, subject, user name or email..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand/50 outline-none transition-all" />
              </div>
              <CustomSelect value={selectedStatus} onChange={setSelectedStatus} options={statusOptions} icon={<Filter className="w-4 h-4" />} className="w-full sm:w-40" />
              <CustomSelect value={selectedDepartment} onChange={setSelectedDepartment} options={departmentOptions} icon={<Layers className="w-4 h-4" />} className="w-full sm:w-40" />
              <CustomSelect value={selectedPriority} onChange={setSelectedPriority} options={priorityOptions} icon={<Flag className="w-4 h-4" />} className="w-full sm:w-40" />
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium">Close</button>
                    <button onClick={() => { fetchTickets(); setShowFilters(false); }} className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium">Apply Filters</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-brand/10 border border-brand/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">{selectedTickets.length} ticket(s) selected</span>
                <button onClick={() => { setSelectedTickets([]); setSelectAll(false); }} className="text-xs text-gray-400 hover:text-white">Clear</button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CustomSelect value={bulkAction} onChange={setBulkAction} options={bulkActionOptions} placeholder="Bulk Actions" className="w-40" />
                {bulkAction === 'status' && <CustomSelect value={bulkActionValue} onChange={setBulkActionValue} options={bulkStatusOptions} placeholder="Select status..." className="w-40" />}
                {bulkAction === 'priority' && <CustomSelect value={bulkActionValue} onChange={setBulkActionValue} options={bulkPriorityOptions} placeholder="Select priority..." className="w-40" />}
                {bulkAction === 'department' && <CustomSelect value={bulkActionValue} onChange={setBulkActionValue} options={bulkDepartmentOptions} placeholder="Select department..." className="w-40" />}
                <button onClick={handleBulkAction} disabled={!bulkAction || (bulkAction !== 'delete' && !bulkActionValue) || actionLoading !== null}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed">Apply</button>
              </div>
            </motion.div>
          )}

          {/* Tickets Table */}
          <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <table className="w-full min-w-[1200px]">
                <thead className="bg-white/5 sticky top-0 z-20">
                  <tr>
                    <th className="w-10 py-4 px-3">
                      <button onClick={() => setSelectAll(!selectAll)} className="text-gray-400 hover:text-white">
                        {selectAll ? <CheckSquare className="w-4 h-4 text-brand" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    {['Ticket #', 'User', 'Subject', 'Department', 'Priority', 'Status', 'Replies', 'Last Activity', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length > 0 ? filteredTickets.map((ticket, index) => (
                    <motion.tr key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => { setSelectedTicket(ticket); fetchTicketDetails(ticket.id); setShowDetailsModal(true); }}>
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <button onClick={e => { e.stopPropagation(); setSelectedTickets(prev => prev.includes(ticket.id) ? prev.filter(id => id !== ticket.id) : [...prev, ticket.id]); }} className="text-gray-400 hover:text-white">
                          {selectedTickets.includes(ticket.id) ? <CheckSquare className="w-4 h-4 text-brand" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-3"><span className="text-sm font-mono font-medium text-brand">#{ticket.ticket_number}</span></td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={ticket.profile_picture} name={ticket.full_name || 'User'} size="sm" />
                          <div>
                            <p className="text-sm text-white truncate max-w-[150px]">{ticket.full_name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{ticket.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3"><div className="text-sm text-white max-w-[200px] truncate" title={ticket.subject}>{ticket.subject}</div></td>
                      <td className="py-3 px-3"><DepartmentBadge department={ticket.department} /></td>
                      <td className="py-3 px-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="py-3 px-3"><StatusBadge status={ticket.status} /></td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-gray-500" /><span className="text-sm text-gray-300">{ticket.reply_count || 0}</span></div>
                      </td>
                      <td className="py-3 px-3"><span className="text-xs text-gray-400">{ticket.last_reply_at ? formatDistance(new Date(ticket.last_reply_at), new Date(), { addSuffix: true }) : 'No replies'}</span></td>
                      <td className="py-3 px-3"><span className="text-xs text-gray-400">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span></td>
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedTicket(ticket); fetchTicketDetails(ticket.id); setShowReplyModal(true); }} className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors" title="Reply">
                            <Reply className="w-4 h-4 text-gray-400 hover:text-brand" />
                          </button>
                          <button onClick={(e) => openDropdown(e, ticket.id)} className="p-1.5 hover:bg-brand/20 rounded-lg transition-colors" title="More">
                            <MoreVertical className="w-4 h-4 text-gray-400 hover:text-brand" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center">
                        <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No tickets found</p>
                        <button onClick={() => { setSearchQuery(''); setSelectedStatus('all'); setSelectedDepartment('all'); setSelectedPriority('all'); }} className="mt-2 text-sm text-brand hover:underline">Clear filters</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Show:</span>
                <div className="flex items-center gap-1">
                  {[20, 50, 100, 250].map(size => (
                    <button key={size} onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${itemsPerPage === size ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                      {size}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-400">per page</span>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-400">
                    Showing <span className="text-white font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="text-white font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="text-white font-medium">{pagination.total}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum = pagination.pages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= pagination.pages - 2 ? pagination.pages - 4 + i : currentPage - 2 + i;
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pageNum ? 'bg-brand text-white' : 'text-gray-400 hover:bg-white/10'}`}>
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============= Portal Dropdown ============= */}
      {activeDropdown && dropdownPosition && ReactDOM.createPortal(
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-[9998] md:hidden" onClick={() => { setActiveDropdown(null); setDropdownPosition(null); }} />
          <div ref={dropdownRef} style={{ position: 'fixed', top: dropdownPosition.top, left: dropdownPosition.left, zIndex: 9999 }} onClick={e => e.stopPropagation()}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
              className="w-56 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-3 py-2.5 bg-white/5 border-b border-white/10">
                <p className="text-xs font-medium text-gray-400">Actions for #{filteredTickets.find(t => t.id === activeDropdown)?.ticket_number}</p>
              </div>
              <div className="p-1">
                {(() => {
                  const ticket = filteredTickets.find(t => t.id === activeDropdown);
                  if (!ticket) return null;
                  return (
                    <>
                      <button onClick={() => { setSelectedTicket(ticket); fetchTicketDetails(ticket.id); setShowReplyModal(true); setActiveDropdown(null); setDropdownPosition(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-brand/20 rounded-lg transition-colors group">
                        <div className="w-6 h-6 bg-brand/10 rounded-lg flex items-center justify-center group-hover:bg-brand/20"><Reply className="w-3 h-3 text-brand" /></div>
                        <span>Reply</span>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <div className="px-3 py-1 text-xs text-gray-500">Change Status</div>
                      {['open', 'in_progress', 'waiting', 'resolved', 'closed'].map(status => (
                        <button key={status} onClick={() => handleStatusChange(activeDropdown, status)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${ticket.status === status ? 'text-brand bg-brand/10' : 'text-white hover:bg-white/10'}`}>
                          <div className="w-2 h-2 rounded-full bg-current mx-1" />
                          <span className="flex-1 text-left capitalize">{status.replace('_', ' ')}</span>
                          {ticket.status === status && <Check className="w-3 h-3 text-brand" />}
                        </button>
                      ))}
                      <div className="h-px bg-white/10 my-1" />
                      <button onClick={() => handleDeleteTicket(activeDropdown, false)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors group">
                        <div className="w-6 h-6 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20"><XCircle className="w-3 h-3 text-red-400" /></div>
                        <span>Close Ticket</span>
                      </button>
                    </>
                  );
                })()}
              </div>
              <div className="px-3 py-2 bg-white/5 border-t border-white/10">
                <p className="text-[10px] text-gray-500">Updated: {format(new Date(), 'HH:mm')}</p>
              </div>
            </motion.div>
          </div>
        </>,
        document.body
      )}

      {/* ============= Details Modal ============= */}
      <AnimatePresence>
        {showDetailsModal && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}>

              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-xl"><Ticket className="w-5 h-5 text-brand" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Ticket #{selectedTicket.ticket_number}</h2>
                      <p className="text-sm text-gray-400">{selectedTicket.subject}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Status</p><StatusBadge status={selectedTicket.status} /></div>
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Priority</p><PriorityBadge priority={selectedTicket.priority} /></div>
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Department</p><DepartmentBadge department={selectedTicket.department} /></div>
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Created</p><p className="text-sm text-white">{format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}</p></div>
                </div>

                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand" />User Information</h3>
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedTicket.profile_picture} name={selectedTicket.full_name || 'User'} size="lg" />
                    <div>
                      <p className="text-white font-medium">{selectedTicket.full_name}</p>
                      <p className="text-sm text-gray-400">{selectedTicket.email}</p>
                      <p className="text-xs text-gray-500 mt-1">User ID: #{selectedTicket.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand" />Original Message</h3>
                  <div className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</div>
                </div>

                {/* Attachments - FIXED */}
                {ticketAttachments.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-brand" />
                      Attachments ({ticketAttachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ticketAttachments.map(att => (
                        <AttachmentPreview key={att.id} attachment={att} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Replies / Conversation */}
                {ticketReplies.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessagesSquare className="w-4 h-4 text-brand" />Conversation ({ticketReplies.length} replies)</h3>
                    <div className="space-y-4">
                      {ticketReplies.map(reply => (
                        <div key={reply.id} className={`flex gap-3 ${reply.is_staff ? 'flex-row' : 'flex-row-reverse'}`}>
                          <Avatar src={reply.profile_picture} name={reply.full_name || (reply.is_staff ? 'Admin' : 'User')} size="md" />
                          <div className={`flex-1 max-w-[80%] ${reply.is_staff ? '' : 'text-right'}`}>
                            <div className={`inline-block max-w-full rounded-xl p-3 ${reply.is_staff ? 'bg-brand/20 text-white' : 'bg-white/5 text-gray-300'}`}>
                              <p className="text-xs font-medium mb-1 opacity-70">{reply.full_name}{reply.is_staff ? ' (Staff)' : ''}</p>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{format(new Date(reply.created_at), 'MMM d, h:mm a')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <button onClick={() => { setShowDetailsModal(false); setShowReplyModal(true); }}
                    className="px-5 py-2.5 bg-brand/20 hover:bg-brand/30 text-brand rounded-xl text-sm font-medium border border-brand/30 flex items-center gap-2">
                    <Reply className="w-4 h-4" />Reply to Ticket
                  </button>
                  <button onClick={() => handleStatusChange(selectedTicket.id, selectedTicket.status === 'resolved' ? 'open' : 'resolved')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 ${selectedTicket.status === 'resolved' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30'}`}>
                    {selectedTicket.status === 'resolved' ? <><RefreshCcw className="w-4 h-4" />Reopen</> : <><CheckCircle className="w-4 h-4" />Mark Resolved</>}
                  </button>
                  <button onClick={() => handleDeleteTicket(selectedTicket.id, false)}
                    className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium border border-red-500/30 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />Close Ticket
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============= Reply Modal ============= */}
      <AnimatePresence>
        {showReplyModal && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowReplyModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-white/10 rounded-2xl max-w-2xl w-full"
              onClick={e => e.stopPropagation()}>

              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-xl"><Reply className="w-5 h-5 text-brand" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Reply to Ticket</h2>
                      <p className="text-sm text-gray-400">#{selectedTicket.ticket_number} - {selectedTicket.subject}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Reply <span className="text-red-400">*</span></label>
                  <textarea value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type your reply here..." rows={6}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand/50 outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Attachments</label>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white border border-white/10">
                    <Upload className="w-4 h-4" />Upload Files
                  </button>
                  {replyAttachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {replyAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-white">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-red-500/20 rounded-lg">
                            <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button onClick={() => setShowReplyModal(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium">Cancel</button>
                  <button onClick={handleSendReply} disabled={!replyMessage.trim() || actionLoading === selectedTicket.id}
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading === selectedTicket.id ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Reply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1F2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6B7280; }
        @media (max-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; } }
        thead th { position: sticky; top: 0; background: rgba(31, 41, 55, 0.95); backdrop-filter: blur(8px); z-index: 10; }
      `}</style>
    </div>
  );
};

export default AdminTicketsPage;
