import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Car, Clock } from 'lucide-react';
import { driverService } from '../../services/api';

export default function DriverEarningsPage() {
  const { data } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: () => driverService.getEarnings().then(r => r.data)
  });
  const earnings = data?.earnings;

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <h1 className="font-display font-bold text-xl text-white">Earnings</h1>

      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white">
        <p className="text-brand-200 text-sm">Total Lifetime Earnings</p>
        <p className="font-display font-bold text-4xl mt-1">₹{earnings?.total?.amount || 0}</p>
        <p className="text-brand-200 text-xs mt-2">{earnings?.total?.rides || 0} rides completed</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today", value: earnings?.today?.amount || 0, rides: earnings?.today?.rides || 0, icon: Clock, color: 'text-emerald-400' },
          { label: "This Week", value: earnings?.week?.amount || 0, rides: earnings?.week?.rides || 0, icon: TrendingUp, color: 'text-brand-400' },
        ].map(({ label, value, rides, icon: Icon, color }) => (
          <div key={label} className="bg-surface-800 rounded-2xl p-5">
            <Icon size={18} className={`${color} mb-3`} />
            <p className={`font-display font-bold text-2xl ${color}`}>₹{value}</p>
            <p className="text-surface-400 text-xs mt-1">{label}</p>
            <p className="text-surface-500 text-xs">{rides} rides</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-800 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Car size={16} className="text-brand-400" />Payout Info</h3>
        <p className="text-surface-400 text-sm">You earn 80% of every fare. Payouts are processed weekly to your registered bank account.</p>
      </div>
    </div>
  );
}
