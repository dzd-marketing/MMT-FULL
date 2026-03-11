import React from 'react';
import { motion } from 'motion/react';
import { Play, ArrowUpRight, Trophy } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleViewServices = () => {
    navigate('/services');
  };

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-24 pb-32 md:pt-32 md:pb-40 px-6 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen"
        >
          <source src="https://res.cloudinary.com/dgb5a5fmm/video/upload/v1772494772/35344-405897623_ufgazt.mp4" type="video/mp4" />
        </video>
        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white dark:from-black/80 dark:via-black/40 dark:to-black" />
        <div className="absolute inset-0 hero-gradient opacity-50" />
      </div>

      {/* Floating Card 1 */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute left-10 top-1/2 -translate-y-1/2 hidden lg:block z-10"
      >
        <div className="glass p-6 rounded-2xl shadow-2xl border-l-4 border-l-brand">
          <div className="text-3xl font-bold mb-1">1M+</div>
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold break-words">
            {t('Orders Completed')}
          </div>
        </div>
      </motion.div>

      {/* Floating Card 2 */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="absolute right-10 bottom-40 hidden lg:block z-10"
      >
        <div className="glass p-6 rounded-2xl shadow-2xl flex items-center space-x-4">
          <div className="bg-brand/20 p-3 rounded-xl">
            <Trophy className="w-6 h-6 text-brand" />
          </div>
          <div>
            <div className="font-bold break-words">{t('#1 SMM Panel')}</div>
            <div className="text-xs text-gray-500 break-words">{t('Highest Quality Services')}</div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Heading stays on top */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Heading - Always on top */}
        <div className="text-center mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass mx-auto mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider break-words">
              {t('New: High-Speed TikTok Services Live')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6 break-words"
          >
            {t('Boost Your Social')} <br />
            <span className="gradient-text">{t('Presence')}</span>
          </motion.h1>
        </div>

        {/* Two Column Layout for Video and Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column - Video */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand/30 to-purple-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Video Container */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  src="https://www.youtube.com/embed/D96Yss8Hm68"
                  title="Himalayan - Ekwee Nam Ridawanna Epa"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
              
              {/* Video Caption */}
              <div className="absolute -bottom-4 left-4 right-4 flex justify-between items-center text-xs text-gray-400">
                <span className="glass px-3 py-1 rounded-full border border-white/10">
                  Make me trend 
                </span>
                <span className="glass px-3 py-1 rounded-full border border-white/10">
                  Smm panel
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Description */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="order-1 lg:order-2 text-center lg:text-left"
          >
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed break-words">
              {t('The fastest and most reliable SMM panel for Instagram, TikTok, YouTube, and more. High-quality engagement delivered in seconds.')}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-brand text-white px-8 py-4 rounded-full font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-brand/40 transition-all cursor-pointer"
              >
                <span>{t('Get Started Now')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewServices}
                className="w-full sm:w-auto glass px-8 py-4 rounded-full font-bold flex items-center justify-center space-x-2 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>{t('View Services')}</span>
                <Play className="w-3 h-3 fill-current" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 w-full px-4"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500 break-words text-center">
          {t('Scroll to explore')}
        </span>
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center p-1 shrink-0">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-brand rounded-full shrink-0"
          />
        </div>
      </motion.div>
    </section>
  );
};
