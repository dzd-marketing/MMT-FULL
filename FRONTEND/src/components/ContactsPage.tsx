import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, Phone, MapPin, Clock, Globe, 
  Facebook, Instagram, Twitter, Youtube, 
  Send, MessageCircle, Sparkles, ChevronRight,
  Copy, CheckCircle, Smartphone, MailOpen
} from 'lucide-react';
import axios from 'axios';

interface ContactData {

  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  

  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  telegram_url: string;
  tiktok_url: string;
  

  address: string;
  

  footer_copyright: string;
  footer_description: string;
}

const ContactsPage: React.FC = () => {
  const [contactData, setContactData] = useState<ContactData>({
    contact_email: 'support@makemetrend.lk',
    contact_phone: '+94 77 123 4567',
    contact_whatsapp: '+94 77 123 4567',
    facebook_url: 'https://facebook.com/makemetrend',
    instagram_url: 'https://instagram.com/makemetrend',
    twitter_url: 'https://twitter.com/makemetrend',
    youtube_url: 'https://youtube.com/@makemetrend',
    telegram_url: 'https://t.me/makemetrend',
    tiktok_url: 'https://tiktok.com/@makemetrend',
    address: '123, Main Street, Colombo, Sri Lanka',
    footer_copyright: '© 2026 MAKE ME TREND. All rights reserved.',
    footer_description: 'Best SMM Panel in Sri Lanka'
  });
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

const API_URL = import.meta.env.VITE_API_URL;
  
  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/config/public`);
      if (response.data.success) {
        const config = response.data.config;
        setContactData(prev => ({
          ...prev,
          contact_email: config.contact_email || prev.contact_email,
          contact_phone: config.contact_phone || prev.contact_phone,
          contact_whatsapp: config.contact_whatsapp || prev.contact_whatsapp,
          facebook_url: config.facebook_url || prev.facebook_url,
          telegram_url: config.telegram_url || prev.telegram_url,
          address: config.address || prev.address,
          footer_copyright: config.footer_copyright || prev.footer_copyright,
          footer_description: config.footer_description || prev.footer_description
        }));
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const socialLinks = [
    { name: 'Facebook', url: contactData.facebook_url, icon: Facebook, color: 'bg-[#1877F2]', hover: 'hover:bg-[#0E5FD9]' },
    { name: 'Telegram', url: contactData.telegram_url, icon: Send, color: 'bg-[#0088cc]', hover: 'hover:bg-[#0077B5]' },

  ].filter(link => link.url);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
    
      <div className="relative overflow-hidden">
      
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-brand/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand/3 to-purple-600/3 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >

           
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
              <span className="bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">
                Contact Us
              </span>
            </h1>

    
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to us through any of these channels.
            </p>
          </motion.div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-8">
       
          <div className="space-y-6">
        
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Mail className="w-6 h-6 text-brand" />
                Contact Information
              </h2>

           
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
                <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/2 hover:border-brand/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Email Address</p>
                        <p className="text-lg font-bold text-white break-all">{contactData.contact_email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(contactData.contact_email, 'email')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <a 
                    href={`mailto:${contactData.contact_email}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:gap-3 transition-all"
                  >
                    Send Email
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

     
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
                <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/2 hover:border-brand/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Phone Number</p>
                        <p className="text-lg font-bold text-white">{contactData.contact_phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(contactData.contact_phone, 'phone')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {copiedField === 'phone' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <a 
                    href={`tel:${contactData.contact_phone}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:gap-3 transition-all"
                  >
                    Call Now
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

           
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
                <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-green-500/5 to-green-500/2 hover:border-green-500/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">WhatsApp</p>
                        <p className="text-lg font-bold text-white">{contactData.contact_whatsapp}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(contactData.contact_whatsapp, 'whatsapp')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {copiedField === 'whatsapp' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <a 
                    href={`https://wa.me/${contactData.contact_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-green-400 hover:gap-3 transition-all"
                  >
                    Chat on WhatsApp
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Address Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
              <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/2 hover:border-brand/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Business Address</p>
                    <p className="text-base text-white leading-relaxed">
                      {contactData.address}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

     
          <div className="space-y-6">
      
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Globe className="w-6 h-6 text-brand" />
                Follow Us
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {socialLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="group relative"
                    >
                      <div className={`absolute -inset-0.5 ${link.color} rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur`} />
                      <div className="relative glass border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-brand/30 transition-all">
                        <div className={`w-12 h-12 rounded-full ${link.color} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 text-white`} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                          {link.name}
                        </span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
              <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/2 hover:border-brand/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Our Location</h3>
                    <p className="text-xs text-gray-400">Find us on map</p>
                  </div>
                </div>
                
               
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-brand/10 to-purple-600/10 border border-white/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-12 h-12 text-brand/30 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">{contactData.address}</p>
                    </div>
                  </div>
           
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.1) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(contactData.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:gap-3 transition-all"
                >
                  Open in Google Maps
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur" />
              <div className="relative glass border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-white/5 to-white/2 hover:border-brand/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Business Hours</h3>
                    <p className="text-xs text-gray-400 mt-1">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-xs text-gray-400">Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

  
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16 pt-8 border-t border-white/10 text-center"
        >
          <p className="text-sm text-gray-400">{contactData.footer_description}</p>
          <p className="text-xs text-gray-500 mt-2">{contactData.footer_copyright}</p>
        </motion.footer>
      </div>
    </div>
  );
};


export default ContactsPage;

