import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Users, Wallet, Ticket, Globe,
  Settings, LogOut, ChevronRight, X, ChevronLeft,
  Book, House, Shield
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  activeTickets?: number;
}

const useAdminInfo = () => {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };

      const payload = JSON.parse(atob(token.split('.')[1]));
      const email: string = payload.email || 'admin@panel.com';

      const name: string = import.meta.env.VITE_ADMIN_NAME || email.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();

      return { name, email, initials };
    } catch {
      return { name: 'Admin', email: 'admin@panel.com', initials: 'AD' };
    }
  }, []);
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
  activeTickets = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, email, initials } = useAdminInfo();

  const menuItems = [
    { name: 'Dashboard',       icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Orders',          icon: ShoppingBag,     path: '/admin/orders' },
    { name: 'Services',        icon: Globe,           path: '/admin/services' },
    { name: 'Deposits',        icon: Wallet,          path: '/admin/deposits' },
    { name: 'Payment options', icon: House,           path: '/admin/payments' },
    { name: 'Blogs',           icon: Book,            path: '/admin/blogs' },
    { name: 'Users',           icon: Users,           path: '/admin/users' },
    { name: 'Tickets',         icon: Ticket,          path: '/admin/tickets', badge: activeTickets },
    { name: 'Settings',        icon: Settings,        path: '/admin/configs' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/logout');
  };

  const AccountSection = () => (
    <div className="p-2 md:p-4 border-t border-white/10">
      <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-white/5 border border-white/5">
      
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-xs md:text-sm font-black text-white">{initials}</span>
        </div>

   
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-bold text-white truncate">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield className="w-2.5 h-2.5 text-green-400" />
            <p className="text-[8px] md:text-[10px] text-green-400/80 font-medium">Super Admin</p>
          </div>
        </div>

   
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 group shrink-0"
        >
          <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
          <span className="text-[10px] md:text-xs text-red-400 group-hover:text-red-300 font-medium transition-colors hidden md:block">Logout</span>
        </button>
      </div>
    </div>
  );

  const DesktopSidebar = () => (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isOpen ? 0 : -320 }}
      className="fixed top-0 left-0 bottom-0 w-64 md:w-80 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border-r border-white/10 z-50 backdrop-blur-xl hidden md:flex md:flex-col"
    >
 
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-black text-white">SMM Panel</h2>
            <p className="text-[8px] md:text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

   
      <nav className="p-2 md:p-4 space-y-1 md:space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all text-sm md:text-base ${
                isActive
                  ? 'bg-gradient-to-r from-brand/20 to-purple-600/20 text-white border border-brand/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="text-xs md:text-sm font-medium flex-1 text-left">{item.name}</span>
              {item.badge ? (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[8px] md:text-[10px] font-medium">
                  {item.badge}
                </span>
              ) : null}
              {isActive && <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-brand shrink-0" />}
            </button>
          );
        })}
      </nav>


      <AccountSection />

  
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 md:w-7 md:h-7 bg-brand rounded-full flex items-center justify-center shadow-lg hover:bg-brand/90 transition-colors"
      >
        <ChevronLeft className={`w-3 h-3 md:w-4 md:h-4 text-white transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>
    </motion.aside>
  );

  const MobileSidebar = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border-r border-white/10 z-50 backdrop-blur-xl md:hidden flex flex-col"
          >

            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">SMM Panel</h2>
                    <p className="text-xs text-gray-500">Admin Dashboard</p>
                  </div>
                </div>
                <button
                  onClick={onMobileClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

       
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand/20 to-purple-600/20 text-white border border-brand/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">{item.name}</span>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium">
                        {item.badge}
                      </span>
                    ) : null}
                    {isActive && <ChevronRight className="w-4 h-4 text-brand shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Account - pinned to bottom */}
            <AccountSection />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;
