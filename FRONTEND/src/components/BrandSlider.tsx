import React from 'react';
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Music2, 
  Send, 
  Twitch 
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const platforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'TikTok', icon: Music2 },
  { name: 'YouTube', icon: Youtube },
  { name: 'Facebook', icon: Facebook },
  { name: 'Twitter/X', icon: Twitter },
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'Telegram', icon: Send },
  { name: 'Twitch', icon: Twitch },
];

export const BrandSlider: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full py-8 md:py-12 overflow-hidden border-t border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase text-center break-words">
          {t('Supported Platforms')}
        </p>
      </div>
      
      <div className="relative flex overflow-x-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...platforms, ...platforms].map((platform, index) => (
            <div
              key={index}
              className="flex items-center mx-12 text-gray-400 hover:text-brand transition-colors cursor-default group"
            >
              <platform.icon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold tracking-tight break-words">{t(platform.name)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
