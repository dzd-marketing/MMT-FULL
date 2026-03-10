// pages/dashboard/TicketsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    Ticket,
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Loader as LoaderIcon,
    ChevronLeft,
    ChevronRight,
    Paperclip,
    Send,
    Upload,
    X,
    Info,
    ChevronDown
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';
import toast from 'react-hot-toast';

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    department: 'technical' | 'billing' | 'general' | 'refill' | 'api';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    message: string;
    attachments: any[];
    last_reply_at: string;
    created_at: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

const TicketsPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
    });

    // Refs for dropdown
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    // New ticket modal state
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        department: 'general',
        priority: 'medium',
        message: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // File upload state
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Status tabs
    const statusTabs = [
        { id: 'all', label: 'All Tickets', icon: Ticket, color: 'text-blue-400' },
        { id: 'open', label: 'Open', icon: AlertCircle, color: 'text-green-400' },
        { id: 'in_progress', label: 'In Progress', icon: LoaderIcon, color: 'text-blue-400' },
        { id: 'waiting', label: 'Waiting', icon: Clock, color: 'text-yellow-400' },
        { id: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-purple-400' },
        { id: 'closed', label: 'Closed', icon: XCircle, color: 'text-gray-400' }
    ];

    // Department options
    const departments = [
        { value: 'technical', label: 'Technical Support', icon: '💻' },
        { value: 'billing', label: 'Billing & Payments', icon: '💰' },
        { value: 'general', label: 'General Inquiry', icon: '📝' },
        { value: 'refill', label: 'Refill Issues', icon: '🔄' },
        { value: 'api', label: 'API Support', icon: '🔌' }
    ];

    // Priority options
    const priorities = [
        { value: 'low', label: 'Low', color: 'text-green-400 bg-green-500/20' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-500/20' },
        { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-500/20' },
        { value: 'urgent', label: 'Urgent', color: 'text-red-400 bg-red-500/20' }
    ];

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login', { state: { from: '/dashboard/tickets' } });
                    return;
                }

                const userData = await authService.getCurrentUser();
                if (!userData) {
                    navigate('/login');
                    return;
                }

                setUser(userData);
            } catch (error) {
                console.error('Auth error:', error);
                navigate('/login');
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    // Load tickets
    useEffect(() => {
        if (!authLoading && user) {
            loadTickets();
        }
    }, [authLoading, user, selectedStatus, currentPage, searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showNewTicketModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showNewTicketModal]);

    const loadTickets = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pagination.limit.toString(),
                ...(selectedStatus !== 'all' && { status: selectedStatus }),
                ...(searchQuery && { search: searchQuery })
            });

            const response = await fetch(`${API_URL}/tickets/my-tickets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setTickets(data.tickets);
                setPagination(data.pagination);
            } else {
                setError('Failed to load tickets');
                toast.error('Failed to load tickets');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
            console.error('Error loading tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`File ${file.name} is too large. Max size is 5MB`);
                return false;
            }
            return true;
        });

        setAttachments(prev => [...prev, ...validFiles]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.subject.trim()) {
            errors.subject = 'Subject is required';
        } else if (formData.subject.length < 5) {
            errors.subject = 'Subject must be at least 5 characters';
        }

        if (!formData.message.trim()) {
            errors.message = 'Message is required';
        } else if (formData.message.length < 10) {
            errors.message = 'Message must be at least 10 characters';
        }

        if (!formData.department) {
            errors.department = 'Department is required';
        }

        if (!formData.priority) {
            errors.priority = 'Priority is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitTicket = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            const formDataToSend = new FormData();
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('department', formData.department);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('message', formData.message);

            // Append attachments
            attachments.forEach((file) => {
                formDataToSend.append('attachments', file);
            });

            const response = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                setShowNewTicketModal(false);
                resetForm();
                loadTickets();
                toast.success('Ticket created successfully! Check your email for confirmation.');
            } else {
                toast.error(data.message || 'Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            subject: '',
            department: 'general',
            priority: 'medium',
            message: ''
        });
        setAttachments([]);
        setFormErrors({});
    };

    const getStatusBadge = (status: string) => {
        const config = {
            open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Open' },
            in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
            waiting: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Waiting' },
            resolved: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Resolved' },
            closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Closed' }
        }[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const config = {
            low: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Low' },
            medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Medium' },
            high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High' },
            urgent: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Urgent' }
        }[priority] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: priority };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getCurrentStatusLabel = () => {
        const currentTab = statusTabs.find(tab => tab.id === selectedStatus);
        return currentTab ? currentTab.label : 'All Tickets';
    };

    const getCurrentStatusIcon = () => {
        const currentTab = statusTabs.find(tab => tab.id === selectedStatus);
        const Icon = currentTab ? currentTab.icon : Ticket;
        return <Icon className="w-4 h-4" />;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
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
            className="w-full max-w-7xl mx-auto px-4 pb-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
                        Support <span className="text-brand">Tickets</span>
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Create and manage your support tickets
                    </p>
                </div>

                <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-all font-medium text-sm md:text-base"
                >
                    <Plus className="w-4 h-5 md:w-5 md:h-5" />
                    <span>New Ticket</span>
                </button>
            </div>

            {/* Desktop Status Tabs - Hidden on mobile */}
            <div className="hidden md:block mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2 min-w-max p-1 bg-white/5 rounded-2xl">
                    {statusTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setSelectedStatus(tab.id);
                                    setCurrentPage(1);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedStatus === tab.id
                                        ? 'bg-brand text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Filter Dropdown */}
            <div className="md:hidden mb-6">
                <div className="relative" ref={filterDropdownRef}>
                    <button
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-center space-x-2">
                            {getCurrentStatusIcon()}
                            <span className="font-medium">{getCurrentStatusLabel()}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isFilterDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-50 left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-xl"
                            >
                                {statusTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isSelected = selectedStatus === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setSelectedStatus(tab.id);
                                                setCurrentPage(1);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-all ${isSelected
                                                    ? 'bg-brand/20 text-brand'
                                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-brand' : tab.color}`} />
                                            <span className="flex-1 text-left font-medium">{tab.label}</span>
                                            {isSelected && (
                                                <span className="w-2 h-2 rounded-full bg-brand"></span>
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Dropdown Footer */}
                                <div className="px-4 py-2 bg-white/5 border-t border-white/10">
                                    <p className="text-xs text-gray-500">
                                        Showing {tickets.length} tickets
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tickets by subject or number..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <LoaderIcon className="w-8 h-8 text-brand animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={loadTickets}
                        className="mt-4 px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
                    <p className="text-gray-400">
                        {searchQuery ? 'Try adjusting your search' : 'Create your first support ticket'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowNewTicketModal(true)}
                            className="mt-4 px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
                        >
                            Create New Ticket
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Ticket</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Subject</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Department</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Priority</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Last Updated</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-mono text-brand">#{ticket.ticket_number}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-white font-medium">{ticket.subject}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-300 capitalize">{ticket.department}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {getPriorityBadge(ticket.priority)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(ticket.status)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-300">{formatDate(ticket.created_at)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {/* Actions column intentionally left empty */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-default hover:bg-white/5 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-sm font-mono text-brand">#{ticket.ticket_number}</span>
                                    {getStatusBadge(ticket.status)}
                                </div>

                                <h3 className="text-white font-medium mb-2">{ticket.subject}</h3>

                                <div className="flex items-center space-x-2 mb-3">
                                    {getPriorityBadge(ticket.priority)}
                                    <span className="text-xs text-gray-400 capitalize">{ticket.department}</span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
                                    <span className="text-xs text-gray-400"></span> {/* Empty span for spacing */}
                                </div>
                            </div>
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
                                    const current = currentPage;
                                    const total = pagination.pages;
                                    if (total <= 5) return true;
                                    if (page === 1 || page === total) return true;
                                    if (page >= current - 1 && page <= current + 1) return true;
                                    return false;
                                })
                                .map((page, index, array) => {
                                    if (index > 0 && array[index - 1] !== page - 1) {
                                        return (
                                            <React.Fragment key={`ellipsis-${page}`}>
                                                <span className="px-3 py-2 text-gray-500">...</span>
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === page
                                                            ? 'bg-brand text-white'
                                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === page
                                                    ? 'bg-brand text-white'
                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
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

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNewTicketModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 md:pt-24 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={() => {
                        setShowNewTicketModal(false);
                        resetForm();
                    }}>
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-2xl mt-8 mb-8"
                        >
                            <div className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-0 bg-[#1A1A1A] z-10 pb-2 border-b border-white/10">
                                    <h2 className="text-xl md:text-2xl font-bold text-white">Create New Ticket</h2>
                                    <button
                                        onClick={() => {
                                            setShowNewTicketModal(false);
                                            resetForm();
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Form Content */}
                                <div className="space-y-4 md:space-y-5">
                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                                            Subject <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Brief description of your issue"
                                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm md:text-base ${formErrors.subject ? 'border-red-500' : 'border-white/10'
                                                }`}
                                        />
                                        {formErrors.subject && (
                                            <p className="mt-1 text-xs text-red-400">{formErrors.subject}</p>
                                        )}
                                    </div>

                                    {/* Department & Priority */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                                                Department <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    className={`w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/5 border rounded-xl text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none appearance-none text-sm md:text-base ${formErrors.department ? 'border-red-500' : 'border-white/10'
                                                        }`}
                                                >
                                                    {departments.map(dept => (
                                                        <option
                                                            key={dept.value}
                                                            value={dept.value}
                                                            className="bg-[#2A2A2A] text-white py-3 hover:bg-brand hover:text-white"
                                                            style={{ backgroundColor: '#2A2A2A', color: 'white' }}
                                                        >
                                                            {dept.icon} {dept.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                            {formErrors.department && (
                                                <p className="mt-1 text-xs text-red-400">{formErrors.department}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                                                Priority <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                    className={`w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/5 border rounded-xl text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none appearance-none text-sm md:text-base ${formErrors.priority ? 'border-red-500' : 'border-white/10'
                                                        }`}
                                                >
                                                    {priorities.map(priority => (
                                                        <option
                                                            key={priority.value}
                                                            value={priority.value}
                                                            className="bg-[#2A2A2A] text-white py-3 hover:bg-brand hover:text-white"
                                                            style={{ backgroundColor: '#2A2A2A', color: 'white' }}
                                                        >
                                                            {priority.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                            {formErrors.priority && (
                                                <p className="mt-1 text-xs text-red-400">{formErrors.priority}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                                            Message <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            rows={5}
                                            placeholder="Describe your issue in detail..."
                                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none resize-none text-sm md:text-base ${formErrors.message ? 'border-red-500' : 'border-white/10'
                                                }`}
                                        />
                                        {formErrors.message && (
                                            <p className="mt-1 text-xs text-red-400">{formErrors.message}</p>
                                        )}
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                                            Attachments <span className="text-gray-500">(Optional - Max 5MB per file)</span>
                                        </label>

                                        {/* Upload Area */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-white/10 rounded-xl p-4 md:p-6 text-center hover:border-brand/50 transition-colors cursor-pointer"
                                        >
                                            <Upload className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs md:text-sm text-gray-400">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Supported: Images, PDF, ZIP (Max 5MB)
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept="image/*,.pdf,.zip,.rar,.doc,.docx"
                                            />
                                        </div>

                                        {/* File List */}
                                        {attachments.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {attachments.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                                    >
                                                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                            <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-xs md:text-sm text-gray-300 truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                                ({(file.size / 1024).toFixed(1)} KB)
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeAttachment(index)}
                                                            className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2 flex-shrink-0"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col-reverse md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3 pt-4 md:pt-6 mt-4 border-t border-white/10 sticky bottom-0 bg-[#1A1A1A]">
                                    <button
                                        onClick={() => {
                                            setShowNewTicketModal(false);
                                            resetForm();
                                        }}
                                        disabled={submitting}
                                        className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all font-medium text-sm md:text-base disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitTicket}
                                        disabled={submitting}
                                        className="w-full md:w-auto flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-all font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <LoaderIcon className="w-4 h-5 md:w-5 md:h-5 animate-spin" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-5 md:w-5 md:h-5" />
                                                <span>Submit Ticket</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TicketsPage;