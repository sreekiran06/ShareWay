import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, DollarSign, LogOut, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/driver', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/rides', icon: Car, label: 'My Rides' },
  { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
];

export default function DriverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const isActive = (path) => path === '/driver' ? location.pathname === '/driver' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-surface-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Dark sidebar for driver */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface-950 border-r border-surface-800 z-50 flex flex-col
        transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none">Driver</p>
              <p className="text-xs text-surface-400 mt-0.5">ShareWay</p>
            </div>
          </div>
        </div>

        <div className="p-4 mx-4 mt-4 rounded-2xl bg-surface-800 border border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
              <p className="text-xs text-surface-400 truncate">{user?.phone}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${isActive(to)
                ? 'bg-brand-500 text-white shadow-brand'
                : 'text-surface-400 hover:text-white hover:bg-surface-800'
                }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-surface-400 hover:text-white hover:bg-surface-800 font-medium transition-all duration-200 mb-1">
            <LayoutDashboard size={18} /><span>User Dashboard</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-900/30 hover:text-red-300 font-medium transition-all duration-200">
            <LogOut size={18} /><span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-surface-900/90 backdrop-blur border-b border-surface-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="font-display font-bold text-white text-lg">Driver Portal</h1>
            <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-surface-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
