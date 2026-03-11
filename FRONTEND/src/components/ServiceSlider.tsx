import React from 'react';
import { motion } from 'motion/react';
import { 
  Music2, 
  Users, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  Instagram, 
  Facebook, 
  Youtube,
  Play,
  ThumbsUp,
  Star
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const services = [
  // TikTok Services
  { 
    id: 1001, 
    platform: 'TikTok',
    name: 'TikTok Likes', 
    description: 'Real likes | Instant delivery | Non-drop guarantee',
    rate: '32.16', 
    type: 'Likes', 
    badge: 'Popular',
    minMax: '100 / 10,000',
    avgTime: 'Instant',
    icon: Play,
    iconColor: 'text-black dark:text-white',
    bgColor: 'bg-black/5 dark:bg-white/5'
  },
  { 
    id: 1002, 
    platform: 'TikTok',
    name: 'TikTok Followers', 
    description: 'Real followers | HQ accounts | Cancel enable',
    rate: '482.20', 
    originalRate: '550.00',
    type: 'Followers', 
    badge: 'Best Seller',
    minMax: '100 / 50,000',
    avgTime: '0-24H',
    icon: Users,
    iconColor: 'text-black dark:text-white',
    bgColor: 'bg-black/5 dark:bg-white/5'
  },
  
  // Facebook Services
  { 
    id: 2001, 
    platform: 'Facebook',
    name: 'Facebook Followers', 
    description: 'Real followers | High retention | Non-drop',
    rate: '93.49', 
    originalRate: '120.00',
    type: 'Followers', 
    badge: 'Popular',
    minMax: '100 / 50,000',
    avgTime: '0-48H',
    icon: Facebook,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10'
  },
  
  // Instagram Services
  { 
    id: 3001, 
    platform: 'Instagram',
    name: 'Instagram Followers', 
    description: 'Real followers | HQ accounts | Instant start',
    rate: '198.89', 
    originalRate: '250.00',
    type: 'Followers', 
    badge: 'Trending',
    minMax: '100 / 50,000',
    avgTime: '0-24H',
    icon: Instagram,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-500/10'
  },
  
  // YouTube Services
  { 
    id: 4001, 
    platform: 'YouTube',
    name: 'YouTube Subscribers', 
    description: 'Real subscribers | High retention | Lifetime',
    rate: '112.80', 
    originalRate: '150.00',
    type: 'Subscribers', 
    badge: 'Popular',
    minMax: '100 / 50,000',
    avgTime: '0-72H',
    icon: Youtube,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-500/10'
  },
  { 
    id: 4002, 
    platform: 'YouTube',
    name: 'YouTube Views', 
    description: 'High retention views | 30+ seconds | Lifetime',
    rate: '18.99', 
    type: 'Views', 
    badge: 'New',
    minMax: '1,000 / 100,000',
    avgTime: '0-48H',
    icon: Eye,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-500/10'
  },
  { 
    id: 4003, 
    platform: 'YouTube',
    name: 'YouTube Likes', 
    description: 'Real likes | High retention | Non-drop',
    rate: '35.25', 
    type: 'Likes', 
    badge: 'New',
    minMax: '100 / 10,000',
    avgTime: '0-24H',
    icon: ThumbsUp,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-500/10'
  },
  
  // Twitter/X Services
  { 
    id: 5001, 
    platform: 'Twitter',
    name: 'Twitter Followers', 
    description: 'Real followers | High quality | Non-drop',
    rate: '65.99', 
    type: 'Followers', 
    badge: 'New',
    minMax: '100 / 50,000',
    avgTime: '0-48H',
    icon: Music2, // Using Music2 as Twitter icon
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10'
  }
];

export function ServiceSlider() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleOrderClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard/new-order');
    } else {
      navigate('/signin');
    }
  };

  // Function to get platform color
  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'TikTok': return 'text-black dark:text-white';
      case 'Facebook': return 'text-blue-600';
      case 'Instagram': return 'text-pink-600';
      case 'YouTube': return 'text-red-600';
      case 'Twitter': return 'text-sky-500';
      default: return 'text-brand';
    }
  };

  // Function to get platform badge color
  const getPlatformBadgeColor = (platform: string) => {
    switch(platform) {
      case 'TikTok': return 'bg-black/10 dark:bg-white/10';
      case 'Facebook': return 'bg-blue-500/10';
      case 'Instagram': return 'bg-pink-500/10';
      case 'YouTube': return 'bg-red-500/10';
      case 'Twitter': return 'bg-sky-500/10';
      default: return 'bg-brand/10';
    }
  };

  return (
    <div className="relative w-full overflow-hidden py-10">
      {/* Gradient Overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white dark:from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white dark:from-[#050505] to-transparent z-10 pointer-events-none" />

      <motion.div 
        className="flex space-x-6"
        animate={{ x: [0, -3000] }}
        transition={{ 
          duration: 60, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {[...services, ...services, ...services].map((service, index) => {
          const Icon = service.icon;
          const platformColor = getPlatformColor(service.platform);
          const platformBadgeColor = getPlatformBadgeColor(service.platform);
          
          return (
            <div 
              key={`${service.id}-${index}`}
              className="flex-shrink-0 w-[280px] sm:w-[340px] glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-white/5 hover:border-brand/30 transition-all group relative overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-colors" />

              {/* Platform Icon */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`${platformBadgeColor} p-3 rounded-2xl`}>
                  <Icon className={`w-6 h-6 ${platformColor}`} />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 break-words">
                    {service.platform}
                  </div>
                  <div className="text-sm font-black text-brand">#{service.id}</div>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg ${platformBadgeColor} ${platformColor} text-[10px] font-black uppercase tracking-wider break-words`}>
                      {service.badge}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">
                      {service.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-xl leading-tight group-hover:text-brand transition-colors break-words">
                    {service.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 break-words">
                    {service.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5 dark:border-white/5">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 break-words">{t('Min / Max')}</div>
                    <div className="text-xs font-bold">{service.minMax}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 break-words">{t('Avg. Time')}</div>
                    <div className="text-xs font-bold">{service.avgTime}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 break-words">{t('Rate per 1k')}</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-black tracking-tighter">
                        Rs. <span className="text-brand">{service.rate}</span>
                      </div>
                      {service.originalRate && (
                        <span className="text-xs text-gray-500 line-through">
                          Rs. {service.originalRate}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={handleOrderClick}
                    className="bg-brand text-white p-4 rounded-2xl shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:scale-105 transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
