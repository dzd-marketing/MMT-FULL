import {useEffect} from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { BrandSlider } from './BrandSlider';
import { ServiceSlider } from './ServiceSlider';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Globe, 
  Star, 
  Cpu, 
  Activity, 
  TrendingUp,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  CreditCard,
  Wallet,
  Bitcoin,
  MessageSquare,
  Layout,
  Code,
  FileText,
  Server,
  BookOpen
} from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Dispatch event to update navbar
        window.dispatchEvent(new Event('auth-change'));
        
        // Clean URL by removing the token param without refreshing
        window.history.replaceState({}, '', '/');
    }
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-brand selection:text-white">
      <main>
        <Hero />
        <BrandSlider />
        
        {/* Why Choose Us Section */}
        <section id="services" className="py-16 md:py-24 px-6 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
            {/* Top Part: Text + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-brand font-black text-xs uppercase tracking-[0.2em]">{t('Why Choose Us')}</p>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                    {t('Premium SMM Services')} <br />
                    <span className="text-brand">{t('Built for Growth')}</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl font-medium">
                    {t('We offer the fastest, cheapest, and most secure social media marketing services on the market. Boost your presence today with a partner you can trust.')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="bg-brand text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all cursor-pointer"
                  >
                    {t('Crate account')}
                  </button>
                  <button 
                    onClick={() => navigate('/services')}
                    className="glass px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all cursor-pointer"
                  >
                    {t('View Pricing')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass p-8 rounded-3xl space-y-2">
                  <div className="text-4xl font-black tracking-tighter">10M+</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('Orders Completed')}</div>
                </div>
                <div className="bg-brand/10 dark:bg-brand/5 p-8 rounded-3xl space-y-2 border border-brand/20">
                  <div className="text-4xl font-black tracking-tighter text-brand">24/7</div>
                  <div className="text-xs font-bold text-brand/70 uppercase tracking-widest">{t('Live Support')}</div>
                </div>
                <div className="sm:col-span-2 glass p-6 rounded-3xl flex items-center space-x-4">
                  <div className="bg-brand/20 p-3 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{t('Guaranteed Growth')}</div>
                    <div className="text-sm text-gray-500 font-medium">{t('Real results, no bots')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Part: Navigation Cards - REPLACED WITH TERMS, SERVICES, API */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Terms Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/terms')}
                className="glass p-10 rounded-[2.5rem] hover:shadow-2xl transition-all group flex flex-col h-full cursor-pointer hover:border-brand/30"
              >
                <div className="bg-purple-100 dark:bg-purple-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 break-words">{t('Terms & Conditions')}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 flex-grow break-words">
                  {t('Review our terms of service, refund policy, and guidelines for using our SMM panel.')}
                </p>
                <div className="flex items-center space-x-2 text-sm font-bold text-brand group-hover:translate-x-2 transition-transform">
                  <span>{t('Read Terms')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </div>
              </motion.div>

              {/* Services Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onClick={() => navigate('/services')}
                className="glass p-10 rounded-[2.5rem] hover:shadow-2xl transition-all group flex flex-col h-full cursor-pointer hover:border-brand/30"
              >
                <div className="bg-blue-100 dark:bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Server className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 break-words">{t('All Services')}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 flex-grow break-words">
                  {t('Explore our complete range of SMM services for Instagram, TikTok, YouTube, and more.')}
                </p>
                <div className="flex items-center space-x-2 text-sm font-bold text-brand group-hover:translate-x-2 transition-transform">
                  <span>{t('View Services')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </div>
              </motion.div>

              {/* API Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate('/api')}
                className="glass p-10 rounded-[2.5rem] hover:shadow-2xl transition-all group flex flex-col h-full cursor-pointer hover:border-brand/30"
              >
                <div className="bg-green-100 dark:bg-green-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Code className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 break-words">{t('API Documentation')}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 flex-grow break-words">
                  {t('Integrate our services with your applications using our powerful and well-documented API.')}
                </p>
                <div className="flex items-center space-x-2 text-sm font-bold text-brand group-hover:translate-x-2 transition-transform">
                  <span>{t('View API Docs')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </div>
              </motion.div>
            </div>

            {/* Bottom Part: API Card (Keep this one) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => navigate('/api')}
              className="glass p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-brand/10 cursor-pointer hover:border-brand/30 transition-all"
            >
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="bg-purple-100 dark:bg-purple-500/10 p-4 rounded-2xl">
                  <Cpu className="w-10 h-10 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold break-words">{t('Developer API Available')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl break-words">
                    {t('Building your own panel? Connect seamlessly with our robust API designed for developers. High uptime and detailed documentation included.')}
                  </p>
                </div>
              </div>
              <button className="whitespace-nowrap glass px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border-black/5 dark:border-white/10 cursor-pointer">
                {t('Read Documentation')}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="py-16 md:py-24 px-6 overflow-hidden relative">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto space-y-16 md:space-y-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <p className="text-brand font-black text-xs uppercase tracking-[0.2em]">{t('Scale Fast')}</p>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight break-words">
                    {t('Scale your')} <br />
                    <span className="gradient-text">{t('Engagement')}</span> {t('like a pro.')}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl font-medium break-words">
                    {t('Whether you are an influencer, a brand, or an agency, our panel provides the tools you need to dominate social media. From likes to followers, we have it all.')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <img 
                        key={i}
                        src={`https://picsum.photos/seed/user${i}/100/100`} 
                        className="w-12 h-12 rounded-full border-4 border-white dark:border-black"
                        alt="User"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center text-brand">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-sm font-bold break-words">{t('Trusted by 10,000+ users')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/services')}
                  className="bg-brand text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center space-x-2 group cursor-pointer"
                >
                  <span>{t('Explore All Services')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-brand/20 rounded-[3rem] blur-3xl" />
                <div className="relative glass p-8 rounded-[2.5rem] shadow-2xl overflow-hidden border-brand/10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] break-words">{t('Live Service Feed')}</div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { user: 'Alex', action: 'purchased 5k TikTok Followers', time: '2m ago' },
                      { user: 'Sarah', action: 'boosted YouTube Views by 10k', time: '5m ago' },
                      { user: 'Mike', action: 'started Instagram Growth', time: '12m ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-brand/5 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-[10px] font-black text-brand group-hover:scale-110 transition-transform shrink-0">
                            {item.user[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold break-words">{item.user} <span className="text-gray-500 font-medium">{t(item.action)}</span></div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap ml-2">{t(item.time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 glass p-6 rounded-2xl shadow-2xl hidden md:block border-brand/20">
                  <div className="text-brand font-black text-2xl">24/7</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 break-words">{t('Live Support')}</div>
                </div>
              </motion.div>
            </div>

            {/* Service Slider Integration */}
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-5xl font-black tracking-tighter break-words">{t('Popular')} <span className="text-brand">TikTok</span> {t('Services')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-lg break-words">{t('Real-time pricing for our most requested TikTok engagement packages.')}</p>
                </div>
                <div className="flex space-x-3">
                   <div className="px-6 py-2.5 rounded-xl glass text-xs font-black uppercase tracking-widest border-brand/20 text-brand shadow-lg shadow-brand/5">{t('Trending')}</div>
                   <div className="px-6 py-2.5 rounded-xl glass text-xs font-black uppercase tracking-widest border-black/5 text-gray-400">{t('New')}</div>
                </div>
              </div>
              <ServiceSlider />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-6 relative overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/10 rounded-full blur-[120px] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto relative z-10"
          >
            <div className="glass rounded-[3.5rem] p-8 md:p-16 lg:p-24 text-center border border-brand/20 shadow-2xl shadow-brand/5 relative overflow-hidden group">
              {/* Inner Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-[0.2em] border border-brand/20">
                    <Zap className="w-3 h-3 fill-current shrink-0" />
                    <span className="break-words">{t('Instant Activation')}</span>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] dark:text-white text-black break-words">
                    {t('Ready to trend')} <br /> 
                    <span className="gradient-text">{t('worldwide?')}</span>
                  </h2>
                  <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed break-words">
                    {t('Join the fastest growing SMM community. Create an account and start your journey to the top today. Experience the power of premium engagement.')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full sm:w-auto bg-brand text-white font-black px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-brand/30 flex items-center justify-center space-x-3 group/btn cursor-pointer"
                  >
                    <span>{t('Get Started Now')}</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform shrink-0" />
                  </button>
                  <button 
                    onClick={() => navigate('/services')}
                    className="w-full sm:w-auto glass text-black dark:text-white font-black px-12 py-5 rounded-2xl border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    {t('View All Services')}
                  </button>
                </div>
                
                <div className="pt-10 border-t border-black/5 dark:border-white/5 flex flex-wrap justify-center gap-8 md:gap-16">
                  {[
                    { label: 'Active Users', value: '50k+' },
                    { label: 'Orders Completed', value: '2.4M+' },
                    { label: 'Support Response', value: '< 15m' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-black tracking-tighter text-brand">{stat.value}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">{t(stat.label)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>
        {/* Expert CTA Section */}
        <section className="py-12 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] dark:text-white text-black break-words">
                  {t('Speak with our')} <br />
                  <span className="flex items-center gap-3">
                    <div className="flex -space-x-2 shrink-0">
                      {[1, 2, 3].map((i) => (
                        <img 
                          key={i}
                          src={`https://picsum.photos/seed/expert${i}/100/100`} 
                          className="w-10 h-10 rounded-full border-2 border-white dark:border-black"
                          alt="Expert"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                    {t('experts')}
                  </span>
                  {t('about your needs.')}
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md font-medium leading-relaxed break-words">
                  {t('Let\'s talk about how we can craft a social strategy that not only looks great but drives real growth for your brand.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: 'Strategy', desc: 'Your growth, crafted through data-driven insights.', icon: Layout },
                  { title: 'Automation', desc: 'Crafting seamless, functional digital experiences.', icon: Code },
                ].map((item, i) => (
                  <div key={i} className="glass p-8 rounded-3xl border border-black/5 dark:border-white/10 group hover:border-brand/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-xl font-black break-words">{t(item.title)}</div>
                      <div className="w-10 h-10 shrink-0 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4 -rotate-45" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed break-words">
                      {t(item.desc)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Row: Button + Payment Partners */}
            <div className="mt-16 flex flex-col lg:flex-row items-center justify-between gap-12 pt-12 border-t border-black/5 dark:border-white/10">
              <button 
                onClick={() => navigate('/contact')}
                className="bg-[#D9F99D] text-black font-black px-10 py-5 rounded-full hover:scale-105 transition-all flex items-center space-x-4 shadow-2xl shadow-lime-500/20 whitespace-nowrap cursor-pointer"
              >
                <span className="text-lg">{t('BOOK A CALL')}</span>
                <div className="bg-black/10 p-1.5 rounded-md shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </button>

              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-10 opacity-50 dark:opacity-70 hover:opacity-100 transition-opacity">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mr-2 break-words">{t('WE ACCEPT')}</div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Visa_Inc._logo_%282005%E2%80%932014%29.svg" className="h-6 md:h-7 w-auto" alt="Visa" referrerPolicy="no-referrer" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" className="h-8 md:h-9 w-auto" alt="Mastercard" referrerPolicy="no-referrer" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg" className="h-6 md:h-7 w-auto dark:brightness-0 dark:invert" alt="Binance" referrerPolicy="no-referrer" />
                <div className="text-xl font-black tracking-tighter text-black dark:text-white">EZ CASH</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Container */}
          <div className="bg-[#0A0A0A] text-white rounded-[3.5rem] p-8 md:p-16 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 relative z-10">
              {/* Left Column: Brand & Newsletter */}
              <div className="lg:col-span-4 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png" 
                      alt="Make Me Trend Logo" 
                      className="h-16 sm:h-20 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter leading-tight max-w-xs break-words">
                    {t('Imaginative minds for')} <br />
                    <span className="text-gray-500">{t('imaginative brands.')}</span>
                  </h3>
                </div>

                <div className="space-y-6">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500 break-words">{t('Subscribe to our newsletter')}</p>
                  <div className="relative max-w-sm">
                    <input 
                      type="email" 
                      placeholder={t('Your email address')} 
                      className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-brand/50 transition-all"
                    />
                    <button className="absolute right-2 top-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer">
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Columns: Links */}
              <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 break-words">{t('Services')}</h4>
                  <ul className="space-y-4 text-sm font-bold text-gray-400">
                    <li><a href="/services" className="hover:text-white transition-colors cursor-pointer break-words">{t('Instagram Growth')}</a></li>
                    <li><a href="/services" className="hover:text-white transition-colors cursor-pointer break-words">{t('TikTok Boost')}</a></li>
                    <li><a href="/services" className="hover:text-white transition-colors cursor-pointer break-words">{t('YouTube Views')}</a></li>
                    <li><a href="/services" className="hover:text-white transition-colors cursor-pointer break-words">{t('Twitter Engagement')}</a></li>
                  </ul>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 break-words">{t('Company')}</h4>
                  <ul className="space-y-4 text-sm font-bold text-gray-400">
                    <li><a href="/about" className="hover:text-white transition-colors cursor-pointer break-words">{t('About Us')}</a></li>
                    <li><a href="/process" className="hover:text-white transition-colors cursor-pointer break-words">{t('Our Process')}</a></li>
                    <li><a href="/projects" className="hover:text-white transition-colors cursor-pointer break-words">{t('Projects')}</a></li>
                    <li><a href="/blogs" className="hover:text-white transition-colors cursor-pointer break-words">{t('Blog')}</a></li>
                  </ul>
                </div>
                <div className="space-y-6 col-span-2 sm:col-span-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 break-words">{t('Support')}</h4>
                  <ul className="space-y-4 text-sm font-bold text-gray-400">
                    <li><a href="/contact" className="hover:text-white transition-colors cursor-pointer break-words">{t('Contact Us')}</a></li>
                    <li><a href="/faq" className="hover:text-white transition-colors cursor-pointer break-words">{t('FAQ')}</a></li>
                    <li><a href="/resources" className="hover:text-white transition-colors cursor-pointer break-words">{t('Resources')}</a></li>
                    <li><a href="/api" className="hover:text-white transition-colors cursor-pointer break-words">{t('API Docs')}</a></li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Socials */}
              <div className="lg:col-span-2 flex flex-row lg:flex-col justify-start lg:justify-center items-center gap-4 pt-8 lg:pt-0 border-t border-white/10 lg:border-t-0">
                {[Instagram, Twitter, Linkedin, Mail].map((Icon, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all group cursor-pointer"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            {/* Bottom Section: Copyright */}
            <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 break-words text-center">
                {t('© 2026 Make Me Trend. All rights reserved.')}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
