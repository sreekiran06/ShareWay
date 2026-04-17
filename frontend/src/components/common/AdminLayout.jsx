import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Users, Car, MapPin, Package, Settings, LogOut, Menu, Shield } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', icon: Activity, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/drivers', icon: Car, label: 'Drivers' },
  { to: '/admin/rides', icon: MapPin, label: 'Rides' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const isActive = (path) => path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-surface-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-surface-100 z-50 flex flex-col
        transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-surface-100 bg-gradient-to-r from-surface-900 to-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none">Admin</p>
              <p className="text-xs text-surface-400 mt-0.5">ShareWay Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-4 mb-3">Management</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={isActive(to) ? 'nav-link-active' : 'nav-link'}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-100">
          <div className="px-4 py-3 mb-2 rounded-2xl bg-surface-50">
            <p className="text-xs font-medium text-surface-500">Logged in as</p>
            <p className="font-semibold text-surface-900 text-sm truncate">{user?.name}</p>
            <span className="badge badge-brand mt-1">Admin</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 font-medium transition-all duration-200">
            <LogOut size={18} /><span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-surface-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-surface-100">
                <Menu size={20} />
              </button>
              <h1 className="font-display font-bold text-surface-900 text-xl">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-surface-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <div className="w-9 h-9 bg-surface-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
