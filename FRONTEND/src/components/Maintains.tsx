import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WifiOff, Clock, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface MaintenanceData {
  maintenance_message: string;
}

const MaintenancePage: React.FC = () => {
  const [data, setData] = useState<MaintenanceData>({
    maintenance_message: 'Site is under maintenance. We will be back soon!'
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const response = await axios.get(`${API_URL}/config/check-maintenance`);
      if (response.data.success) {
        setData({
          maintenance_message: response.data.maintenance_message || 'Site is under maintenance. We will be back soon!'
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center space-y-8">
          {/* Icon with rotating animation */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand/20 to-purple-600/20 border border-brand/30 flex items-center justify-center"
          >
            <WifiOff className="w-12 h-12 text-brand" />
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black">
            <span className="bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">
              Under Maintenance
            </span>
          </h1>

          {/* Message */}
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            {data.maintenance_message}
          </p>

          {/* Date and Time Row */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full" />
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Back Soon</span>
            </div>
          </div>

          {/* Simple Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ 
                  x: ['-100%', '100%']
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-full h-full bg-gradient-to-r from-brand to-purple-600"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 text-xs text-gray-600">
            <p>© 2026 MAKE ME TREND. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;