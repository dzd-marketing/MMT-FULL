import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, ArrowRight, Globe, User, Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import authService from '../services/auth';
import axios from 'axios';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  profilePicture?: string;
  email_verified?: boolean;
}

interface NavbarProps {
  user?: UserData | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user: propUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(propUser || null);
  const [loading, setLoading] = useState(true);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  // Fetch site logo from database
  useEffect(() => {
    const fetchSiteLogo = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/config/public`);
        if (response.data.success) {
          const config = response.data.config;
          if (config.site_logo) {
            setSiteLogo(config.site_logo);
          }
        }
      } catch (error) {
        console.error('Error fetching site logo:', error);
      }
    };

    fetchSiteLogo();
  }, [API_URL]);

  // Get image URL helper
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads')) return `${BASE_URL}${path}`;
    return `${BASE_URL}${path}`;
  };

  // Update user when prop changes
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setLoading(false);
    }
  }, [propUser]);

  // Fetch user data with profile picture
  const fetchUserWithProfile = async () => {
    try {
      // Get basic user data from auth service
      const userData = await authService.getCurrentUser();
      
      if (userData) {
        // Try to get profile data with picture
        try {
          const profileResponse = await axios.get('/api/user/profiles', { 
            withCredentials: true 
          });
          
          if (profileResponse.data.success) {
            const profileUser = profileResponse.data.user;
            // Merge profile data with auth data
            setUser({
              ...userData,
              profilePicture: profileUser.profile_picture || userData.profilePicture,
              phone: profileUser.phone || userData.phone,
              whatsapp: profileUser.whatsapp || userData.whatsapp,
            });
          } else {
            setUser(userData);
          }
        } catch (profileError) {
          console.log('Could not fetch profile data, using auth data');
          setUser(userData);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      if (isMounted) {
        await fetchUserWithProfile();
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      if (localStorage.getItem('token')) {
        fetchUserWithProfile();
      } else {
        setUser(null);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      
      // Clear all storage
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      // Full page refresh to homepage
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Terms', href: '/terms' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ];

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate avatar color based on user id
  const getAvatarColor = () => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    const index = user?.id ? user.id % colors.length : 0;
    return colors[index];
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-full px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={siteLogo ? getImageUrl(siteLogo) : "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png"}
              alt="Make Me Trend Logo" 
              className="h-12 sm:h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png";
              }}
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-brand transition-colors cursor-pointer">
                {t(link.name)}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative group hidden md:block">
              <button className="flex items-center space-x-1 text-sm font-semibold hover:text-brand transition-colors cursor-pointer">
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${language === 'en' ? 'text-brand font-bold' : ''} break-words`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('si')}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${language === 'si' ? 'text-brand font-bold' : ''} break-words`}
                >
                  සිංහල (Sinhala)
                </button>
              </div>
            </div>
            
            <div className="block">
              <ThemeToggle />
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="w-10 h-10 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            ) : user ? (
              /* User Section - Show when logged in */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 md:space-x-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors p-1"
                >
                  {/* Avatar - Always visible */}
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture.startsWith('http') 
                        ? user.profilePicture 
                        : `https://mmtsmmpanel.cyberservice.online${user.profilePicture}`
                      }
                      alt={user.name}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-brand"
                      onError={(e) => {
                        console.log('Image failed to load:', user.profilePicture);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold ${getAvatarColor()}">${getInitials()}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold ${getAvatarColor()}`}>
                      {getInitials()}
                    </div>
                  )}
                  
                  {/* Chevron only on desktop */}
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform hidden md:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      key="dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[70]"
                    >
                      {/* User info */}
                      <div className="p-4 border-b border-black/5 dark:border-white/5">
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>

                      {/* Menu items */}
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand/5 hover:text-brand rounded-xl transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          to="/dashboard/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand/5 hover:text-brand rounded-xl transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>

                        

                        <div className="border-t border-black/5 dark:border-white/5 my-2"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Show login/signup buttons when not logged in */
              <>
                <Link to="/login" className="hidden lg:block text-sm font-semibold hover:text-brand transition-colors cursor-pointer break-words">
                  {t('Log in')}
                </Link>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden md:block bg-brand text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-all cursor-pointer break-words"
                  >
                    {t('Sign up')}
                  </motion.button>
                </Link>
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xl"
            />

            <motion.div
              key="sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[80%] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-2">
                  <img 
                    src={siteLogo ? getImageUrl(siteLogo) : "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png"}
                    alt="Make Me Trend Logo" 
                    className="h-10 sm:h-12 w-auto object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png";
                    }}
                  />
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Navigation */}
              <div className="flex-1 overflow-y-auto py-8 px-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2">{t('Navigation')}</p>
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-3 text-lg font-medium hover:bg-brand/5 hover:text-brand rounded-xl transition-all cursor-pointer group"
                      >
                        {t(link.name)}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </a>
                    ))}
                    
                    {/* Mobile-only navigation for logged-in users */}
                    {user && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-3 text-lg font-medium hover:bg-brand/5 hover:text-brand rounded-xl transition-all cursor-pointer group"
                        >
                          Dashboard
                          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-3 text-lg font-medium hover:bg-brand/5 hover:text-brand rounded-xl transition-all cursor-pointer group"
                        >
                          Profile
                          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                        
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2">{t('Language')}</p>
                  <div className="flex space-x-2 px-2">
                    <button 
                      onClick={() => { setLanguage('en'); setIsOpen(false); }}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg border ${language === 'en' ? 'border-brand text-brand bg-brand/5' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'} transition-all cursor-pointer`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => { setLanguage('si'); setIsOpen(false); }}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg border ${language === 'si' ? 'border-brand text-brand bg-brand/5' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'} transition-all cursor-pointer`}
                    >
                      SI
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Section - User Info & Logout */}
              <div className="p-6 border-t border-black/5 dark:border-white/5 space-y-4">
                {user ? (
                  <>
                    {/* User Info */}
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 pb-4 border-b border-black/5 dark:border-white/5 hover:bg-brand/5 rounded-xl transition-all p-2 -mx-2"
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture.startsWith('http') 
                            ? user.profilePicture 
                            : `https://mmtsmmpanel.cyberservice.online{user.profilePicture}`
                          }
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-brand"
                          onError={(e) => {
                            console.log('Image failed to load:', user.profilePicture);
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${getAvatarColor()}">${getInitials()}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${getAvatarColor()}`}>
                          {getInitials()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    
                    {/* Small Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      onClick={() => setIsOpen(false)}
                      className="block w-full p-4 text-center text-sm font-semibold border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {t('Log in')}
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-brand text-white p-4 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 cursor-pointer"
                      >
                        {t('Sign up')}
                      </motion.button>
                    </Link>
                  </>
                )}
                <p className="text-[10px] text-center text-gray-400 pt-2 break-words">{t('© 2024 Make Me Trend. All rights reserved.')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
