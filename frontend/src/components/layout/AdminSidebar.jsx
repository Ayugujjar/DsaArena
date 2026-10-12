import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Trophy,
  RefreshCw,
  Activity,
  FileSpreadsheet,
  ShieldAlert,
  BellRing,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout, admin, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/batches', label: 'Batches', icon: FolderKanban },
    { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/admin/sync-monitor', label: 'Sync Monitor', icon: RefreshCw },
    { to: '/admin/system/sync-health', label: 'System Health', icon: Activity },
    { to: '/admin/reports', label: 'Reports & Matrix', icon: FileSpreadsheet },
    ...(isSuperAdmin ? [{ to: '/admin/admins', label: 'Admins & Roles', icon: ShieldAlert }] : []),
    { to: '/admin/notifications', label: 'Announcements', icon: BellRing },
    { to: '/admin/settings', label: 'System Settings', icon: Sliders },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Admin Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600">
              Admin Portal
            </span>
          </div>
          <p className="text-slate-900 font-bold text-sm mt-1 truncate">{admin?.name}</p>
          <span className="inline-block mt-0.5 text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md">
            {admin?.role || 'Admin'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
