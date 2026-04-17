import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverService } from '../../services/api';

export function DriverRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    licenseNumber: '',
    vehicleDetails: { make: '', model: '', year: '', color: '', licensePlate: '', type: 'car', capacity: 4 },
    bankDetails: { accountHolder: '', accountNumber: '', ifscCode: '', bankName: '' },
    serviceTypes: ['ride']
  });

  const set = (section, key, val) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await driverService.register(form);
      toast.success('Registration submitted! We\'ll review and approve within 24 hours.');
      navigate('/driver');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Driver Registration</h1>
        <p className="text-surface-500 text-sm">Complete your profile to start earning</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2"><Car size={16} className="text-brand-500" /> Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Make (e.g. Maruti)" className="input-field" value={form.vehicleDetails.make} onChange={e => set('vehicleDetails', 'make', e.target.value)} />
            <input required placeholder="Model (e.g. Swift)" className="input-field" value={form.vehicleDetails.model} onChange={e => set('vehicleDetails', 'model', e.target.value)} />
            <input required placeholder="Year" type="number" min="2000" max="2024" className="input-field" value={form.vehicleDetails.year} onChange={e => set('vehicleDetails', 'year', parseInt(e.target.value))} />
            <input required placeholder="Color" className="input-field" value={form.vehicleDetails.color} onChange={e => set('vehicleDetails', 'color', e.target.value)} />
            <input required placeholder="License Plate" className="input-field uppercase" value={form.vehicleDetails.licensePlate} onChange={e => set('vehicleDetails', 'licensePlate', e.target.value.toUpperCase())} />
            <select className="input-field" value={form.vehicleDetails.type} onChange={e => set('vehicleDetails', 'type', e.target.value)}>
              {['bike', 'auto', 'car', 'suv', 'van'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <input required placeholder="Driver License Number" className="input-field" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
        </div>

        {/* Bank Details */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2"><FileText size={16} className="text-brand-500" /> Bank Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Account Holder Name" className="input-field" value={form.bankDetails.accountHolder} onChange={e => set('bankDetails', 'accountHolder', e.target.value)} />
            <input placeholder="Bank Name" className="input-field" value={form.bankDetails.bankName} onChange={e => set('bankDetails', 'bankName', e.target.value)} />
            <input placeholder="Account Number" className="input-field" value={form.bankDetails.accountNumber} onChange={e => set('bankDetails', 'accountNumber', e.target.value)} />
            <input placeholder="IFSC Code" className="input-field uppercase" value={form.bankDetails.ifscCode} onChange={e => set('bankDetails', 'ifscCode', e.target.value.toUpperCase())} />
          </div>
        </div>

        {/* Services */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-3">Service Types</h3>
          <div className="flex gap-3">
            {['ride', 'delivery'].map(s => (
              <label key={s} className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.serviceTypes.includes(s) ? 'border-brand-500 bg-brand-50' : 'border-surface-200'}`}>
                <input type="checkbox" checked={form.serviceTypes.includes(s)} onChange={e => {
                  setForm(f => ({ ...f, serviceTypes: e.target.checked ? [...f.serviceTypes, s] : f.serviceTypes.filter(x => x !== s) }));
                }} className="w-4 h-4 rounded" />
                <span className="font-medium text-sm capitalize">{s === 'ride' ? '🚗 Ride Sharing' : '📦 Deliveries'}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <span className="loading-dots"><span /><span /><span /></span> : <>Submit for Review <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}

export function DriverRidesPage() {
  const { data, isLoading } = { data: null, isLoading: false };
  const [page, setPage] = useState(1);

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <h1 className="font-display font-bold text-xl text-white">My Rides</h1>
      <div className="text-center py-16 text-surface-500">
        <Car size={40} className="mx-auto mb-3 text-surface-600" />
        <p>Your completed rides will appear here</p>
      </div>
    </div>
  );
}

export function DriverEarningsPage() {
  const { data } = { data: null };

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <h1 className="font-display font-bold text-xl text-surface-900">Earnings</h1>
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white">
        <p className="text-brand-200 text-sm">Total Lifetime Earnings</p>
        <p className="font-display font-bold text-4xl mt-1">₹0.00</p>
        <p className="text-brand-200 text-xs mt-2">Keep driving to earn more!</p>
      </div>
      <div className="text-center py-8 bg-gray-50 rounded-2xl text-gray-500">
        <p className="text-sm">Earnings breakdown will appear here as you complete rides</p>
      </div>
    </div>
  );
}

export default DriverRegisterPage;
