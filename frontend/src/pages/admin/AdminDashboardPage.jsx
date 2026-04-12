import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Car, Package, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/api';

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className="card stat-card">
    <div className={`w-11 h-11 ${bg} rounded-2xl flex items-center justify-center mb-3`}>
      <Icon size={20} className={color} />
    </div>
    <p className="font-display font-bold text-2xl text-surface-900">{value}</p>
    <p className="text-sm font-medium text-surface-600">{label}</p>
    {sub && <p className="text-xs text-surface-400">{sub}</p>}
  </div>
);

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard().then(r => r.data),
    refetchInterval: 30000
  });

  const stats = data?.stats;
  const rideTrend = data?.rideTrend || [];
  const topDrivers = data?.topDrivers || [];

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-32" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Platform overview & analytics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.users?.total?.toLocaleString() || 0} sub={`+${stats?.users?.new || 0} this week`} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Car} label="Total Drivers" value={stats?.drivers?.total || 0} sub={`${stats?.drivers?.active || 0} online now`} color="text-brand-600" bg="bg-brand-50" />
        <StatCard icon={TrendingUp} label="Total Rides" value={stats?.rides?.total?.toLocaleString() || 0} sub={`${stats?.rides?.today || 0} today`} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={`₹${(stats?.revenue?.monthly || 0).toLocaleString()}`} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Completed Rides" value={stats?.rides?.completed || 0} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Package} label="Total Deliveries" value={stats?.deliveries?.total || 0} sub={`${stats?.deliveries?.completed || 0} completed`} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={AlertCircle} label="Pending Approvals" value={stats?.drivers?.pending || 0} sub="Driver applications" color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Clock} label="This Week's Rides" value={stats?.rides?.week || 0} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg text-surface-900 mb-5">Weekly Ride Trend</h3>
          {rideTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rideTrend}>
                <defs>
                  <linearGradient id="rideGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#rideGrad)" name="Rides" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-surface-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg text-surface-900 mb-5">Revenue Trend</h3>
          {rideTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rideTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-surface-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Top Drivers */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-lg text-surface-900 mb-4">Top Drivers</h3>
        {topDrivers.length === 0 ? (
          <p className="text-surface-400 text-sm text-center py-8">No driver data available yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  {['Driver', 'Vehicle', 'Rides', 'Rating', 'Earnings'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {topDrivers.map(driver => (
                  <tr key={driver._id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">
                          {driver.user?.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-surface-900">{driver.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-surface-600">{driver.vehicleDetails?.make} {driver.vehicleDetails?.model}</td>
                    <td className="py-3 px-2 font-semibold text-surface-900">{driver.totalRides}</td>
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-1">⭐ {driver.rating?.average || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-emerald-600">₹{Math.round(driver.totalEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
