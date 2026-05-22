import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Box,
  Wrench,
  Users,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Bell
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const getNavItems = () => {
    const items = [
      { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['hod', 'staff', 'student'] },
      { path: '/equipment', name: 'Equipment Roster', icon: Wrench, roles: ['hod', 'staff', 'student'] },
      { path: '/inventory', name: 'Consumables Stock', icon: Box, roles: ['hod', 'staff'] },
      { path: '/students', name: 'Students & Attendance', icon: Users, roles: ['hod', 'staff'] },
      { path: '/experiments', name: 'Experiments Manuals', icon: GraduationCap, roles: ['hod', 'staff', 'student'] },
      { path: '/reports', name: 'Systems Reports', icon: FileSpreadsheet, roles: ['hod', 'staff'] },
      { path: '/ai-hub', name: 'AI Analytics Hub', icon: Sparkles, roles: ['hod', 'staff'] }
    ];
    return items.filter(item => item.roles.includes(user?.role));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/v1/notifications');
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await api.patch(`/api/v1/notifications/${id}/read`);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.warn('Failed to mark read:', err.message);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/api/v1/notifications/${id}`);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.warn('Failed to delete notification:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex justify-between items-center bg-darkCard px-4 py-3 border-b border-gray-800 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">LABS</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-300 ease-in-out
        w-64 bg-darkCard/95 border-r border-white/5 p-4 flex flex-col justify-between z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2 mb-8 px-2 py-3">
            <span className="text-2xl font-black font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider">LABS</span>
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-primary/15 to-secondary/10 text-primary border-l-2 border-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="mt-8 border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-darkBg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition duration-200"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-8 py-5 border-b border-white/5 bg-darkCard/30 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold font-display text-white">Lab Management</h1>
            <p className="text-xs text-gray-400">Institutional control center and automation dashboard</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications Dropdown */}
            <div className="relative text-left" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-400 hover:text-white transition focus:outline-none flex items-center justify-center p-1 rounded-full hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-accentRed text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-white font-display">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          onClick={() => !notification.isRead && markAsRead(notification._id)}
                          className={`p-4 transition cursor-pointer hover:bg-white/5 flex gap-3 items-start relative ${
                            !notification.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0 font-sans">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-semibold text-white truncate">{notification.title}</h4>
                              <span className="text-[9px] text-gray-500 whitespace-nowrap">
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteNotification(notification._id, e)}
                            className="text-gray-500 hover:text-red-400 transition p-0.5 rounded focus:outline-none"
                            aria-label="Delete notification"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-gray-500">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <UserIcon size={18} className="text-gray-300" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
