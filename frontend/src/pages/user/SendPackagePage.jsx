import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, User, Phone, Weight, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryService } from '../../services/api';

const CATEGORIES = ['documents', 'electronics', 'clothing', 'food', 'medicine', 'fragile', 'other'];

export default function SendPackagePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({
    pickup: { address: '', contactName: '', contactPhone: '', instructions: '' },
    destination: { address: '', contactName: '', contactPhone: '', instructions: '' },
    package: { description: '', weight: 1, category: 'other', isFragile: false, requiresSignature: false, value: '' },
    paymentMethod: 'cash',
    paidBy: 'sender'
  });

  const set = (section, key, value) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: value } }));

  const handleEstimate = async () => {
    if (!form.pickup.address || !form.destination.address) { toast.error('Fill in pickup and delivery addresses'); return; }
    setLoading(true);
    try {
      const { data } = await deliveryService.estimate({ distance: 8000, weight: form.package.weight, category: form.package.category });
      setEstimate(data);
      setStep(3);
    } catch { toast.error('Failed to get estimate'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data } = await deliveryService.create({ ...form, distance: 8000, duration: 1800 });
      toast.success('Delivery request created!');
      navigate(`/delivery/${data.delivery._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create delivery'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Send a Package</h1>
        <p className="text-surface-500 text-sm">Fast and reliable door-to-door delivery</p>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-500' : 'bg-surface-200'}`} />
          ))}
        </div>
      </div>

      {/* Step 1: Pickup details */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <h3 className="font-semibold text-surface-900">Pickup Details</h3>
            </div>
            <input placeholder="Pickup address" className="input-field" value={form.pickup.address} onChange={e => set('pickup', 'address', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-surface-400" />
                <input placeholder="Contact name" className="input-field pl-9 text-sm" value={form.pickup.contactName} onChange={e => set('pickup', 'contactName', e.target.value)} />
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3.5 text-surface-400" />
                <input placeholder="Phone" className="input-field pl-9 text-sm" value={form.pickup.contactPhone} onChange={e => set('pickup', 'contactPhone', e.target.value)} />
              </div>
            </div>
            <input placeholder="Special instructions (optional)" className="input-field text-sm" value={form.pickup.instructions} onChange={e => set('pickup', 'instructions', e.target.value)} />
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <h3 className="font-semibold text-surface-900">Delivery Details</h3>
            </div>
            <input placeholder="Delivery address *" className="input-field" required value={form.destination.address} onChange={e => set('destination', 'address', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-surface-400" />
                <input placeholder="Recipient name *" className="input-field pl-9 text-sm" required value={form.destination.contactName} onChange={e => set('destination', 'contactName', e.target.value)} />
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3.5 text-surface-400" />
                <input placeholder="Recipient phone *" className="input-field pl-9 text-sm" required value={form.destination.contactPhone} onChange={e => set('destination', 'contactPhone', e.target.value)} />
              </div>
            </div>
            <input placeholder="Delivery instructions (optional)" className="input-field text-sm" value={form.destination.instructions} onChange={e => set('destination', 'instructions', e.target.value)} />
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full">
            Next: Package Info <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Package details */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-brand-500" />
              <h3 className="font-semibold text-surface-900">Package Information</h3>
            </div>
            <input placeholder="Package description *" className="input-field" required value={form.package.description} onChange={e => set('package', 'description', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Weight size={14} className="absolute left-3 top-3.5 text-surface-400" />
                <input type="number" min="0.1" step="0.1" placeholder="Weight (kg)" className="input-field pl-9 text-sm" value={form.package.weight} onChange={e => set('package', 'weight', parseFloat(e.target.value))} />
              </div>
              <input type="number" placeholder="Declared value (₹)" className="input-field text-sm" value={form.package.value} onChange={e => set('package', 'value', e.target.value)} />
            </div>

            <div>
              <p className="text-sm font-medium text-surface-700 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => set('package', 'category', cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      form.package.category === cat ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {[
                { key: 'isFragile', label: 'Fragile item', icon: AlertTriangle, color: 'text-amber-500' },
                { key: 'requiresSignature', label: 'Signature required on delivery', icon: User, color: 'text-blue-500' },
              ].map(({ key, label, icon: Icon, color }) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={form.package[key]} onChange={e => set('package', key, e.target.checked)} />
                  <Icon size={14} className={color} />
                  <span className="text-sm text-surface-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button onClick={handleEstimate} disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="loading-dots"><span /><span /><span /></span> : <>Get Price <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & price */}
      {step === 3 && estimate && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Delivery Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 bg-emerald-500 rounded-full flex-shrink-0" />
                <div><p className="text-surface-400 text-xs">From</p><p className="font-medium text-surface-800">{form.pickup.address}</p></div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 bg-red-500 rounded-full flex-shrink-0" />
                <div><p className="text-surface-400 text-xs">To</p><p className="font-medium text-surface-800">{form.destination.address}</p></div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-3">Pricing</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Base Fare', `₹${estimate.fare.baseFare}`],
                ['Distance Fare', `₹${estimate.fare.distanceFare}`],
                ['Weight Surcharge', `₹${estimate.fare.weightFare}`],
                ['Tax (5%)', `₹${estimate.fare.tax}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-surface-500">{k}</span>
                  <span className="text-surface-700">{v}</span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brand-600">₹{estimate.fare.total}</span>
              </div>
            </div>
            <p className="text-xs text-surface-400 mt-2">Estimated delivery: {estimate.eta}</p>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-surface-700 mb-2">Payment Method</p>
            <div className="flex gap-2">
              {['cash', 'wallet', 'upi'].map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, paymentMethod: m }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.paymentMethod === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500'
                  }`}>{m.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="loading-dots"><span /><span /><span /></span> : <>Send Package — ₹{estimate.fare.total}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
