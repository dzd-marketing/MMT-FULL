import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Facebook, 
  Send, 
  X, 
  Sparkles,
  Globe,
  MessageSquare,
  Users,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface SocialData {
  facebook_url: string;
  contact_whatsapp: string;
  whatsapp_channel: string;
  telegram_url: string;
}

const SocialChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socialData, setSocialData] = useState<SocialData>({
    facebook_url: '',
    contact_whatsapp: '',
    whatsapp_channel: '',
    telegram_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/config/public`);
      if (response.data.success) {
        const config = response.data.config;
        setSocialData({
          facebook_url: config.facebook_url || '',
          contact_whatsapp: config.contact_whatsapp || '',
          whatsapp_channel: config.whatsapp_channel || '',
          telegram_url: config.telegram_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialButtons = () => {
    const buttons = [];
    
    if (socialData.facebook_url) {
      buttons.push({
        id: 'facebook',
        icon: <Facebook className="w-5 h-5 md:w-6 md:h-6" />,
        url: socialData.facebook_url,
        bgColor: 'bg-[#1877F2]',
        hoverBg: 'hover:bg-[#0E5FD9]',
        ringColor: 'ring-blue-500/30',
        label: 'Facebook'
      });
    }
    
    if (socialData.contact_whatsapp) {
      const whatsappNumber = socialData.contact_whatsapp.replace(/\D/g, '');
      buttons.push({
        id: 'whatsapp',
        icon: <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />,
        url: `https://wa.me/${whatsappNumber}`,
        bgColor: 'bg-[#25D366]',
        hoverBg: 'hover:bg-[#20BD5E]',
        ringColor: 'ring-green-500/30',
        label: 'WhatsApp Chat'
      });
    }
    
    if (socialData.whatsapp_channel) {
      buttons.push({
        id: 'whatsapp-channel',
        icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
        url: socialData.whatsapp_channel,
        bgColor: 'bg-[#25D366]',
        hoverBg: 'hover:bg-[#20BD5E]',
        ringColor: 'ring-green-500/30',
        label: 'WhatsApp Channel'
      });
    }
    
    if (socialData.telegram_url) {
      buttons.push({
        id: 'telegram',
        icon: <Send className="w-5 h-5 md:w-6 md:h-6" />,
        url: socialData.telegram_url,
        bgColor: 'bg-[#0088cc]',
        hoverBg: 'hover:bg-[#0077B5]',
        ringColor: 'ring-blue-500/30',
        label: 'Telegram'
      });
    }
    
    return buttons;
  };

  const buttons = getSocialButtons();

  if (loading || buttons.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.8,
      transition: { 
        duration: 0.2,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
   
      <AnimatePresence>
        {isOpen && (
          <>
         
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

    
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute bottom-20 right-0 flex flex-col items-end gap-3 z-50"
            >
           
              <div className="flex flex-col items-end gap-3">
                {buttons.map((button, index) => (
                  <motion.a
                    key={button.id}
                    href={button.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={itemVariants}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredButton(button.id)}
                    onHoverEnd={() => setHoveredButton(null)}
                    className={`
                      relative group
                      w-12 h-12 md:w-14 md:h-14
                      rounded-full
                      ${button.bgColor} ${button.hoverBg}
                      shadow-lg hover:shadow-xl
                      flex items-center justify-center
                      text-white
                      transition-all duration-300
                      ring-4 ring-transparent hover:ring-2 ${button.ringColor}
                      cursor-pointer
                    `}
                    title={button.label}
                  >
           
                    <AnimatePresence>
                      {hoveredButton === button.id && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-white"
                        />
                      )}
                    </AnimatePresence>
                    
          
                    <motion.div
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="relative z-10"
                    >
                      {button.icon}
                    </motion.div>

        
                    <span className="absolute right-16 px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden md:block pointer-events-none">
                      {button.label}
                      <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45" />
                    </span>
                  </motion.a>
                ))}
              </div>

  
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="md:hidden w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        animate={{ 
          rotate: isOpen ? 90 : 0,
          scale: isOpen ? 1.1 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          relative w-14 h-14 md:w-16 md:h-16
          rounded-full
          bg-gradient-to-r from-brand to-purple-600
          text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300
          ring-4 ring-brand/30 hover:ring-brand/50
          cursor-pointer
        `}
      >

        <motion.span
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-brand"
        />
        

        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative z-10"
        >
          {isOpen ? (
            <X className="w-6 h-6 md:w-7 md:h-7" />
          ) : (
            <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
          )}
        </motion.div>


        {!isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0A0A0A] rounded-full"
          >
            <motion.span
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-green-500"
            />
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};


export default SocialChat;

