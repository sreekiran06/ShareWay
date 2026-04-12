import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Car, Package, Clock, User, Bell, LogOut,
  Menu, X, ChevronRight, Wallet, MapPin, Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/book-ride', icon: Car, label: 'Book Ride' },
  { to: '/send-package', icon: Package, label: 'Send Package' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/auth/login');
  };

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-surface-100 z-50 flex flex-col
        transition-transform duration-300 ease-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-surface-100">
          <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-lg text-surface-900 leading-none">ShareWay</p>
              <p className="text-xs text-surface-400 mt-0.5">Ride & Deliver</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-brand">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-surface-600">
              <Wallet size={12} className="text-brand-500" />
              <span>₹{(user?.walletBalance || 0).toFixed(2)}</span>
            </div>
            <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-4 mb-3">Main Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={isActive(to) ? 'nav-link-active' : 'nav-link'}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {isActive(to) && <ChevronRight size={14} className="text-brand-400" />}
            </Link>
          ))}

          {user?.role === 'driver' && (
            <>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-4 mb-3 mt-6">Driver</p>
              <Link to="/driver" className={isActive('/driver') ? 'nav-link-active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
                <Car size={18} /><span>Driver Dashboard</span>
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-4 mb-3 mt-6">Admin</p>
              <Link to="/admin" className={isActive('/admin') ? 'nav-link-active' : 'nav-link'} onClick={() => setSidebarOpen(false)}>
                <Settings size={18} /><span>Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-surface-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-surface-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-surface-500">
                <MapPin size={14} className="text-brand-500" />
                <span>Hyderabad, India</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <Bell size={20} className="text-surface-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
              </Link>
              <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-brand cursor-pointer">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
