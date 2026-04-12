// RideHistoryPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Package, Clock, MapPin, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { rideService, deliveryService } from '../../services/api';
import { format } from 'date-fns';

const statusColors = {
  completed: 'badge-success', cancelled: 'badge-danger',
  started: 'badge-brand', requested: 'badge-warning',
  delivered: 'badge-success', failed: 'badge-danger'
};

export function RideHistoryPage() {
  const [tab, setTab] = useState('rides');

  const { data: ridesData, isLoading: ridesLoading } = useQuery({
    queryKey: ['ride-history'],
    queryFn: () => rideService.getHistory({ limit: 20 }).then(r => r.data)
  });

  const { data: deliveriesData, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () => deliveryService.getHistory({ limit: 20 }).then(r => r.data)
  });

  const rides = ridesData?.rides || [];
  const deliveries = deliveriesData?.deliveries || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <h1 className="font-display font-bold text-2xl text-surface-900">Trip History</h1>

      <div className="flex bg-surface-100 rounded-2xl p-1">
        {[
          { key: 'rides', icon: Car, label: `Rides (${rides.length})` },
          { key: 'deliveries', icon: Package, label: `Packages (${deliveries.length})` }
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow text-surface-900' : 'text-surface-500'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'rides' && (
        <div className="space-y-3">
          {ridesLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-24" />) :
          rides.length === 0 ? (
            <div className="text-center py-16">
              <Car size={40} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-500 font-medium">No rides yet</p>
              <Link to="/book-ride" className="btn-primary mt-4 inline-flex">Book your first ride</Link>
            </div>
          ) : rides.map(ride => (
            <Link key={ride._id} to={`/ride/${ride._id}`} className="card card-hover p-4 flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Car size={20} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${statusColors[ride.status] || 'badge-neutral'}`}>{ride.status}</span>
                  <span className="text-xs text-surface-400">{ride.rideType}</span>
                </div>
                <p className="text-sm font-medium text-surface-900 truncate">{ride.destination?.address}</p>
                <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />{format(new Date(ride.createdAt), 'MMM d, yyyy · h:mm a')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-surface-900">₹{ride.fare?.total}</p>
                <p className="text-xs text-surface-400">{ride.distance?.text}</p>
                {ride.rating?.byRider?.score && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-surface-500">{ride.rating.byRider.score}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="space-y-3">
          {deliveriesLoading ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24" />) :
          deliveries.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-500 font-medium">No deliveries yet</p>
              <Link to="/send-package" className="btn-primary mt-4 inline-flex">Send a package</Link>
            </div>
          ) : deliveries.map(d => (
            <Link key={d._id} to={`/delivery/${d._id}`} className="card card-hover p-4 flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${statusColors[d.status] || 'badge-neutral'}`}>{d.status}</span>
                </div>
                <p className="text-sm font-medium text-surface-900 truncate">{d.destination?.address}</p>
                <p className="text-xs text-surface-400 mt-0.5">{d.package?.description} · {d.deliveryId}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-surface-900">₹{d.fare?.total}</p>
                <p className="text-xs text-surface-400">{format(new Date(d.createdAt), 'MMM d')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default RideHistoryPage;
