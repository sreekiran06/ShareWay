import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Package, Clock, Star, MapPin, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const quickActions = [
  { to: '/book-ride', icon: Car, label: 'Book Ride', desc: 'Go anywhere', color: 'brand', bg: 'bg-brand-500' },
  { to: '/send-package', icon: Package, label: 'Send Package', desc: 'Fast delivery', color: 'emerald', bg: 'bg-emerald-500' },
  { to: '/history', icon: Clock, label: 'History', desc: 'Past trips', color: 'blue', bg: 'bg-blue-500' },
];

const features = [
  { icon: Zap, title: 'Instant Booking', desc: 'Get matched with a driver in under 2 minutes', color: 'text-amber-500 bg-amber-50' },
  { icon: Shield, title: 'Safe & Secure', desc: 'All drivers verified with background checks', color: 'text-emerald-500 bg-emerald-50' },
  { icon: TrendingUp, title: 'Best Prices', desc: 'Transparent pricing, no hidden charges', color: 'text-blue-500 bg-blue-50' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Hero greeting */}
      <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-12 -translate-x-8" />
        <div className="relative z-10">
          <p className="text-brand-200 text-sm font-medium mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">
            {user?.name?.split(' ')[0]}, where to?
          </h1>
          <p className="text-brand-200 text-sm mb-4">Your city, your way. Fast, safe & affordable.</p>
          <Link to="/book-ride" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-5 py-2.5 rounded-2xl hover:bg-brand-50 transition-colors shadow-lg">
            <Car size={16} /> Book Now <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-lg text-surface-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ to, icon: Icon, label, desc, bg }) => (
            <Link
              key={to}
              to={to}
              className="card card-hover p-4 flex flex-col items-center text-center gap-3 cursor-pointer"
            >
              <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center shadow-lg`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 text-sm">{label}</p>
                <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Rides', value: user?.rideCount || 0, icon: Car, color: 'text-brand-500' },
          { label: 'Wallet', value: `₹${(user?.walletBalance || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Total Spent', value: `₹${(user?.totalSpent || 0).toFixed(0)}`, icon: Star, color: 'text-amber-500' },
          { label: 'Saved Places', value: user?.savedAddresses?.length || 0, icon: MapPin, color: 'text-blue-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-display font-bold text-xl text-surface-900">{value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="font-display font-bold text-lg text-surface-900 mb-3">Why ShareWay?</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-5 flex gap-4">
              <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-surface-900 text-sm">{title}</p>
                <p className="text-xs text-surface-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Become a driver CTA */}
      {user?.role === 'user' && (
        <div className="card p-6 bg-gradient-to-r from-surface-900 to-surface-800 text-white flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg mb-1">Become a Driver</h3>
            <p className="text-surface-300 text-sm">Earn up to ₹50,000/month on your schedule</p>
          </div>
          <Link
            to="/driver/register"
            className="flex-shrink-0 btn-primary text-sm px-4 py-2.5"
          >
            Start Earning
          </Link>
        </div>
      )}
    </div>
  );
}
