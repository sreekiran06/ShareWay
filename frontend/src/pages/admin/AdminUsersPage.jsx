import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, role],
    queryFn: () => adminService.getUsers({ search, page, limit: 15, role }).then(r => r.data),
    keepPreviousData: true
  });

  const handleToggle = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      qc.invalidateQueries(['admin-users']);
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="section-title">Users</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="input-field pl-9 text-sm py-2.5" />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field text-sm py-2.5 w-28">
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['User', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={6} className="py-3 px-4"><div className="skeleton h-8 w-full" /></td></tr>
              )) : (data?.users || []).map(user => (
                <tr key={user._id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{user.name}</p>
                        <p className="text-xs text-surface-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-surface-600">{user.phone}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'driver' ? 'badge-info' : 'badge-brand'}`}>{user.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="py-3 px-4 text-surface-500 text-xs">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleToggle(user._id)}
                      className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>
                      {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between p-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">Total: {data.pagination.total} users</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 text-sm font-medium">{page} / {data.pagination.pages}</span>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl hover:bg-surface-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDriversPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', statusFilter, page],
    queryFn: () => adminService.getDrivers({ status: statusFilter, page, limit: 15 }).then(r => r.data)
  });

  const handleApprove = async (driverId, status) => {
    try {
      await adminService.approveDriver(driverId, { status });
      qc.invalidateQueries(['admin-drivers']);
      toast.success(`Driver ${status}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="section-title">Drivers</h1>
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'suspended', 'rejected'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500 hover:border-surface-300'}`}>
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
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">
                        {driver.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{driver.user?.name}</p>
                        <p className="text-xs text-surface-400">{driver.user?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-surface-600">{driver.vehicleDetails?.make} {driver.vehicleDetails?.model} <span className="text-xs text-surface-400 font-mono">({driver.vehicleDetails?.licensePlate})</span></td>
                  <td className="py-3 px-4 font-mono text-xs text-surface-600">{driver.licenseNumber}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      driver.status === 'approved' ? 'badge-success' :
                      driver.status === 'pending' ? 'badge-warning' :
                      driver.status === 'rejected' ? 'badge-danger' : 'badge-neutral'
                    }`}>{driver.status}</span>
                  </td>
                  <td className="py-3 px-4 text-surface-600">⭐ {driver.rating?.average || 'N/A'}</td>
                  <td className="py-3 px-4 font-semibold text-surface-900">{driver.totalRides}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      {driver.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(driver._id, 'approved')} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">Approve</button>
                          <button onClick={() => handleApprove(driver._id, 'rejected')} className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Reject</button>
                        </>
                      )}
                      {driver.status === 'approved' && (
                        <button onClick={() => handleApprove(driver._id, 'suspended')} className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors">Suspend</button>
                      )}
                      {driver.status === 'suspended' && (
                        <button onClick={() => handleApprove(driver._id, 'approved')} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">Reinstate</button>
                      )}
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

export default AdminUsersPage;
