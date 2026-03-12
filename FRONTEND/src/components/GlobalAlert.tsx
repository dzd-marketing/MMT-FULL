import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, CheckCircle, Info, XCircle, 
  X, Bell, AlertTriangle, Volume2, VolumeX,
  Clock, ExternalLink, Sparkles, Zap,
  Star, Gift, Megaphone, Rocket, ThumbsUp
} from 'lucide-react';
import axios from 'axios';

interface AlertData {
  enabled: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  heading: string;
  description: string;
  message: string;
}

const GlobalAlert: React.FC = () => {
  const [alert, setAlert] = useState<AlertData>({
    enabled: false,
    type: 'info',
    heading: '',
    description: '',
    message: ''
  });
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(100);

const API_URL = import.meta.env.VITE_API_URL;
  
  useEffect(() => {
    fetchAlertConfig();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const startTime = Date.now();
      const duration = 8000; 

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (elapsed >= duration) {
          clearInterval(timer);
          handleClose();
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isVisible]);

  const fetchAlertConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/config/public`);
      if (response.data.success) {
        const config = response.data.config;
        const enabled = config.alert_enabled === '1';
        
        const newAlert = {
          enabled: enabled,
          type: config.alert_type || 'info',
          heading: config.alert_heading || '',
          description: config.alert_description || '',
          message: config.alert_message || ''
        };
        
        setAlert(newAlert);

   
        const alertKey = `alert_${newAlert.heading}_${newAlert.description}`;
        const hasBeenShown = localStorage.getItem(alertKey);

  
        if (enabled && !hasBeenShown && (newAlert.heading || newAlert.description || newAlert.message)) {
          setTimeout(() => {
            setIsVisible(true);
       
            localStorage.setItem(alertKey, 'true');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error fetching alert config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const getAlertIcon = () => {
    const icons = {
      success: <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />,
      warning: <AlertTriangle className="w-6 h-6 md:w-7 md:h-7" />,
      error: <XCircle className="w-6 h-6 md:w-7 md:h-7" />,
      info: <Info className="w-6 h-6 md:w-7 md:h-7" />
    };
    return icons[alert.type] || icons.info;
  };

  const getAlertColors = () => {
    const colors = {
      success: {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        light: 'bg-emerald-950/60',
        gradient: 'from-emerald-500 to-green-500',
        shadow: 'shadow-emerald-500/10',
        accent: 'bg-emerald-500',
        ring: 'ring-emerald-500/30'
      },
      warning: {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        light: 'bg-amber-950/60',
        gradient: 'from-amber-500 to-yellow-500',
        shadow: 'shadow-amber-500/10',
        accent: 'bg-amber-500',
        ring: 'ring-amber-500/30'
      },
      error: {
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        light: 'bg-rose-950/60',
        gradient: 'from-rose-500 to-red-500',
        shadow: 'shadow-rose-500/10',
        accent: 'bg-rose-500',
        ring: 'ring-rose-500/30'
      },
      info: {
        bg: 'bg-blue-950/40',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        light: 'bg-blue-950/60',
        gradient: 'from-blue-500 to-indigo-500',
        shadow: 'shadow-blue-500/10',
        accent: 'bg-blue-500',
        ring: 'ring-blue-500/30'
      }
    };
    return colors[alert.type] || colors.info;
  };


  const hasContent = alert.heading || alert.description || alert.message;
  if (!hasContent || !alert.enabled || loading) {
    return null;
  }

  const colors = getAlertColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
       
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

        
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90%] sm:w-[400px] max-w-[400px]"
          >
      
            <div className={`
              relative overflow-hidden
              ${colors.bg}
              border ${colors.border}
              rounded-2xl shadow-2xl ${colors.shadow}
              backdrop-blur-md
            `}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />

     
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-xl" />

  
              <div className="relative p-5">
            
                <div className="flex items-start gap-3 mb-4">
               
                  <div className={`
                    relative p-2.5 rounded-xl
                    ${colors.light}
                    border ${colors.border}
                  `}>
                    <div className={colors.text}>
                      {getAlertIcon()}
                    </div>
                  </div>

        
                  <div className="flex-1">
                    <h3 className={`text-base font-bold ${colors.text}`}>
                      {alert.heading || (
                        alert.type === 'info' ? 'Information' :
                        alert.type === 'success' ? 'Success' :
                        alert.type === 'warning' ? 'Notice' : 'Alert'
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date().toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

         
                  <button
                    onClick={handleClose}
                    className={`
                      p-1.5 rounded-lg
                      bg-white/5 hover:bg-white/10
                      border border-white/10
                      transition-colors
                      text-gray-400 hover:text-white
                    `}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {(alert.description || alert.message) && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {alert.description || alert.message}
                    </p>
                  </div>
                )}

                <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05, ease: "linear" }}
                    className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${colors.gradient}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalAlert;


