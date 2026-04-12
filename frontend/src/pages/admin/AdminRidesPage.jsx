import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

const statusColors = {
  completed: 'badge-success', cancelled: 'badge-danger',
  started: 'badge-brand', requested: 'badge-warning',
  accepted: 'badge-info', driver_arriving: 'badge-info'
};

export default function AdminRidesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rides', page, status],
    queryFn: () => adminService.getRides({ page, limit: 15, status }).then(r => r.data),
    keepPreviousData: true
  });

  const rides = data?.rides || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="section-title">All Rides</h1>
        <div className="flex flex-wrap gap-2">
          {['', 'requested', 'accepted', 'started', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                status === s
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-200 text-surface-500 hover:border-surface-300'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Ride ID', 'Rider', 'Driver', 'Route', 'Fare', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-3 px-4"><div className="skeleton h-8 w-full" /></td></tr>
                  ))
                : rides.map(ride => (
                    <tr key={ride._id} className="hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-surface-600 bg-surface-100 px-2 py-1 rounded-lg">
                          {ride.rideId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-surface-900">{ride.rider?.name}</p>
                        <p className="text-xs text-surface-400">{ride.rider?.phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        {ride.driver ? (
                          <>
                            <p className="font-medium text-surface-900">{ride.driver?.user?.name}</p>
                            <p className="text-xs text-surface-400">{ride.driver?.user?.phone}</p>
                          </>
                        ) : (
                          <span className="text-surface-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                          <p className="text-xs text-surface-600 truncate">{ride.pickup?.address}</p>
                        </div>
                        <div className="flex items-start gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
                          <p className="text-xs text-surface-600 truncate">{ride.destination?.address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-surface-900">₹{ride.fare?.total}</p>
                        <p className="text-xs text-surface-400">{ride.distance?.text}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${statusColors[ride.status] || 'badge-neutral'}`}>
                          {ride.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-surface-500 text-xs whitespace-nowrap">
                        {format(new Date(ride.createdAt), 'MMM d, yyyy')}
                        <br />
                        {format(new Date(ride.createdAt), 'h:mm a')}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between p-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {rides.length} of {data.pagination.total} rides
            </p>
            <div className="flex gap-2 items-center">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-surface-700">
                {page} / {data.pagination.pages || 1}
              </span>
              <button
                disabled={page >= (data.pagination.pages || 1)}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
