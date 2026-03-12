import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';
import axios from 'axios';

interface NewService {
  service_id: number;
  service_name: string;
  service_description: string;
  category_id: number;
  service_price: string;
  service_min: number;
  service_max: number;
  created_date: string;
  service_status: 'active' | 'inactive';
}

const DailyUpdatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [newServices, setNewServices] = useState<NewService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('7'); 

const API_URL = import.meta.env.VITE_API_URL;

  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { state: { from: '/dashboard/updates' } });
          return;
        }

        const userData = await authService.getCurrentUser();
        if (!userData) {
          navigate('/login');
          return;
        }

        setUser(userData);
        loadNewServices();
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadNewServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/services/new`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { days: dateFilter }
      });
      
      if (response.data.success) {
        setNewServices(response.data.services);
      }
    } catch (err) {
      console.error('Error loading new services:', err);
      setError('Failed to load new services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadNewServices();
    }
  }, [dateFilter]);

  const filteredServices = newServices.filter(service => 
    service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.service_id.toString().includes(searchTerm) ||
    (service.service_description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-2">
            Daily <span className="text-brand">Updates</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            New services added to our platform
          </p>
        </div>
        
        <button
          onClick={loadNewServices}
          className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-brand/20 hover:bg-brand/30 text-brand rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          <span>Refresh</span>
        </button>
      </div>

    
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
  
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name or description..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Date Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => setDateFilter('7')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              dateFilter === '7' 
                ? 'bg-brand text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter('30')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              dateFilter === '30' 
                ? 'bg-brand text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              dateFilter === 'all' 
                ? 'bg-brand text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-gray-400">New Services</p>
              <p className="text-2xl font-bold text-white">{filteredServices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Active Services</p>
              <p className="text-2xl font-bold text-white">{filteredServices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Latest Update</p>
              <p className="text-sm font-bold text-white truncate">
                {filteredServices.length > 0 
                  ? getTimeAgo(filteredServices[0].created_date)
                  : 'No updates'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-sm md:text-base">{error}</p>
          <button
            onClick={loadNewServices}
            className="mt-4 px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors text-sm md:text-base"
          >
            Try Again
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No new services</h3>
          <p className="text-gray-400 text-sm px-4">
            {searchTerm 
              ? 'No services match your search' 
              : 'No new services have been added in this period'}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] md:min-w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">ID</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Service Name</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Description</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Price/1K</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Min/Max</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Date Added</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.service_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-sm text-brand font-mono">#{service.service_id}</span>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="space-y-1">
                        <p className="text-sm text-white font-medium line-clamp-2">
                          {service.service_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Cat ID: {service.category_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-sm">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {service.service_description || 'No description available'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        Rs {parseFloat(service.service_price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-green-400">{service.service_min}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-400">
                          {service.service_max === 1000000 ? '1M' : service.service_max}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-white">
                            {formatDate(service.created_date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getTimeAgo(service.created_date)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Activated</span>
                        </span>
                        <button
                          onClick={() => navigate(`/dashboard/services/${service.service_id}`)}
                          className="p-2 text-gray-400 hover:text-brand transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-white/5">
            <p className="text-xs text-gray-400">
              Showing {filteredServices.length} of {newServices.length} new services
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DailyUpdatesPage;
