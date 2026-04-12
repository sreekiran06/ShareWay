import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

export default function AdminDriversPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', statusFilter],
    queryFn: () => adminService.getDrivers({ status: statusFilter, page: 1, limit: 20 }).then(r => r.data)
  });

  const handleApprove = async (driverId, status) => {
    try {
      await adminService.approveDriver(driverId, { status });
      qc.invalidateQueries(['admin-drivers']);
      toast.success(`Driver ${status}`);
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="section-title">Drivers</h1>
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'approved', 'suspended', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500'}`}>
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
                {['Driver', 'Vehicle', 'License', 'Status', 'Rating', 'Rides', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="py-3 px-4"><div className="skeleton h-8" /></td></tr>
              )) : (data?.drivers || []).map(driver => (
                <tr key={driver._id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">{driver.user?.name?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-surface-900">{driver.user?.name}</p>
                        <p className="text-xs text-surface-400">{driver.user?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-surface-600">{driver.vehicleDetails?.make} {driver.vehicleDetails?.model} <span className="font-mono text-surface-400">({driver.vehicleDetails?.licensePlate})</span></td>
                  <td className="py-3 px-4 font-mono text-xs text-surface-600">{driver.licenseNumber}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${driver.status === 'approved' ? 'badge-success' : driver.status === 'pending' ? 'badge-warning' : driver.status === 'rejected' ? 'badge-danger' : 'badge-neutral'}`}>{driver.status}</span>
                  </td>
                  <td className="py-3 px-4">⭐ {driver.rating?.average || 'N/A'}</td>
                  <td className="py-3 px-4 font-semibold">{driver.totalRides}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {driver.status === 'pending' && <>
                        <button onClick={() => handleApprove(driver._id, 'approved')} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">Approve</button>
                        <button onClick={() => handleApprove(driver._id, 'rejected')} className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Reject</button>
                      </>}
                      {driver.status === 'approved' && <button onClick={() => handleApprove(driver._id, 'suspended')} className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">Suspend</button>}
                      {driver.status === 'suspended' && <button onClick={() => handleApprove(driver._id, 'approved')} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">Reinstate</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
