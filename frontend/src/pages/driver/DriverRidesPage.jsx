import React from 'react';
import { Car } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../../services/api';
import { format } from 'date-fns';

export default function DriverRidesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-rides'],
    queryFn: () => driverService.getRides({ limit: 20 }).then(r => r.data)
  });
  const rides = data?.rides || [];

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <h1 className="font-display font-bold text-xl text-white">My Rides</h1>
      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="bg-surface-800 h-20 rounded-2xl animate-pulse" />)}</div>
      ) : rides.length === 0 ? (
        <div className="text-center py-16 bg-surface-800 rounded-2xl">
          <Car size={40} className="mx-auto mb-3 text-surface-600" />
          <p className="text-surface-400">No rides yet. Go online to start receiving requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div key={ride._id} className="bg-surface-800 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`badge ${ride.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{ride.status}</span>
                <span className="font-bold text-white">₹{Math.round(ride.fare?.total * 0.8)}</span>
              </div>
              <p className="text-surface-300 text-sm truncate">{ride.destination?.address}</p>
              <p className="text-surface-500 text-xs mt-1">{format(new Date(ride.createdAt), 'MMM d, yyyy · h:mm a')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
