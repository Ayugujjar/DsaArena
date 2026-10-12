import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Bell, RefreshCw, Flame, User, LogOut, Check, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { notificationAPI, integrationAPI } from '../../services/api';

export const Navbar = ({ isAdmin = false, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout: studentLogout, refreshUser } = useAuth();
  const { admin, logout: adminLogout } = useAdminAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (isAdmin || !user) return undefined;

    let active = true;
    notificationAPI
      .getMyNotifications()
      .then((res) => {
        if (active && res.success) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      })
      .catch((error) => console.error('Failed to load notifications:', error));

    return () => {
      active = false;
    };
  }, [isAdmin, user]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await integrationAPI.syncNow();
      if (res.success) {
        setSyncMessage('Synced!');
        if (refreshUser) await refreshUser();
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch {
      setSyncMessage('Sync failed');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    if (isAdmin) {
      adminLogout();
      navigate('/admin/login');
    } else {
      studentLogout();
      navigate('/login');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">DsArena</span>
              {isAdmin && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">DSA Progress Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Student Streak Badge & Sync */}
        {!isAdmin && user && (
          <div className="flex items-center gap-2">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{user.currentStreak || 0} Day Streak</span>
            </div>

            {/* Sync Now Button */}
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-xs"
              title="Sync LeetCode and GFG progress"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
              <span>{syncing ? 'Syncing...' : syncMessage || 'Sync Now'}</span>
            </button>
          </div>
        )}

        {/* Notifications Dropdown (Student) */}
        {!isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 border border-slate-200 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Announcements & Alerts</h4>
                  <span className="text-[11px] text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No announcements yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-3 text-xs transition-colors ${
                          n.isRead ? 'bg-white text-slate-500' : 'bg-orange-50/40 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{n.title}</span>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkRead(n._id)}
                              className="text-[10px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Mark read
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>By: {n.senderName || 'Admin'}</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User / Admin Profile pill */}
        {showProfileMenu && (
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setShowProfileMenu(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
        )}
        <div className="relative z-40 flex items-center gap-2 pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => setShowProfileMenu((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={showProfileMenu}
            aria-label="Open profile menu"
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 overflow-hidden flex items-center justify-center text-xs font-bold text-orange-700">
              {!isAdmin && user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : isAdmin ? (
                <Shield className="w-4 h-4 text-orange-600" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                {isAdmin ? admin?.name : user?.name}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isAdmin ? admin?.role : `Batch: ${user?.batch || 'General'}`}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50"
            >
              {!isAdmin ? (
                <>
                  <Link
                    role="menuitem"
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  >
                    View / Edit Profile
                  </Link>
                  <Link
                    role="menuitem"
                    to="/connect-platforms"
                    onClick={() => setShowProfileMenu(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  >
                    Coding Platforms
                  </Link>
                  <Link
                    role="menuitem"
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  >
                    Account & Security
                  </Link>
                </>
              ) : (
                <Link
                  role="menuitem"
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                >
                  Admin Settings
                </Link>
              )}
              <button
                role="menuitem"
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
