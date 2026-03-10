// components/admin/AdminHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for the hardcoded header on every admin page.
// Usage:
//   import AdminHeader from './AdminHeader';
//   <AdminHeader
//     title="Page Title"
//     onMenuClick={() => setSidebarOpen(!sidebarOpen)}
//     onMobileMenuClick={() => setMobileSidebarOpen(true)}
//     activeTickets={stats.activeTickets}   // optional — shows red dot on bell
//   />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { Menu, Bell, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
  onMobileMenuClick: () => void;
  activeTickets?: number;
}

// Read real admin name + initials from adminToken JWT
const useAdminInfo = () => {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return { name: 'Admin', initials: 'AD' };
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email: string = payload.email || '';
      const name: string = (import.meta.env.VITE_ADMIN_NAME as string) || email.split('@')[0] || 'Admin';
      return { name, initials: name.slice(0, 2).toUpperCase() };
    } catch {
      return { name: 'Admin', initials: 'AD' };
    }
  }, []);
};

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  onMenuClick,
  onMobileMenuClick,
  activeTickets = 0,
}) => {
  const navigate = useNavigate();
  const { name, initials } = useAdminInfo();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/logout');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">

        {/* Left — hamburger + page title */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop sidebar toggle */}
          <button
            onClick={onMenuClick}
            className="hidden md:block p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors"
          >
            <Menu className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </button>
          {/* Mobile sidebar toggle */}
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-base md:text-2xl font-black text-white hidden sm:block">{title}</h1>
        </div>

        {/* Right — bell + admin account */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Notification bell */}
          <button className="relative p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors">
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            {activeTickets > 0 && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Admin account */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-white">{initials}</span>
            </div>

            {/* Name + role */}
            <div className="hidden sm:block">
              <p className="text-xs md:text-sm font-bold text-white leading-tight">{name}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-green-400" />
                <p className="text-[9px] md:text-[10px] text-green-400/80 font-medium">Super Admin</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 group ml-1"
            >
              <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-[10px] md:text-xs text-red-400 group-hover:text-red-300 font-medium hidden md:block transition-colors">
                Logout
              </span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;