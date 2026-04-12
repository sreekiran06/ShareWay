import React, { useState } from 'react';
import { User, Mail, Phone, Camera, Save, Wallet, Star, Car, Shield, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(form);
    if (result.success) { toast.success('Profile updated!'); setEditing(false); }
    else toast.error(result.message || 'Update failed');
    setSaving(false);
  };

  const stats = [
    { icon: Car, label: 'Total Rides', value: user?.rideCount || 0 },
    { icon: Wallet, label: 'Wallet Balance', value: `₹${(user?.walletBalance || 0).toFixed(2)}` },
    { icon: Star, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display font-bold text-2xl text-surface-900">Profile</h1>

      {/* Avatar + basic info */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl flex items-center justify-center text-white font-display font-bold text-3xl shadow-brand">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors">
              <Camera size={12} className="text-surface-600" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Full name" />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="Phone" />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
                    {saving ? '...' : <><Save size={14} /> Save</>}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl text-surface-900">{user?.name}</h2>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'driver' ? 'badge-info' : 'badge-brand'}`}>
                    {user?.role}
                  </span>
                </div>
                <p className="text-surface-500 text-sm flex items-center gap-1.5 mt-1"><Mail size={12} />{user?.email}</p>
                <p className="text-surface-500 text-sm flex items-center gap-1.5 mt-0.5"><Phone size={12} />{user?.phone}</p>
                <button onClick={() => setEditing(true)} className="mt-3 text-brand-500 text-sm font-medium hover:text-brand-600">Edit Profile</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={18} className="text-brand-500 mx-auto mb-2" />
            <p className="font-display font-bold text-xl text-surface-900">{value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral code */}
      <div className="card p-5">
        <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
          <Shield size={16} className="text-brand-500" /> Referral Code
        </h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-surface-50 border border-surface-200 px-4 py-3 rounded-2xl font-mono font-bold text-brand-600 tracking-wider text-lg">
            {user?.referralCode || 'SW000000'}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(user?.referralCode || ''); toast.success('Copied!'); }}
            className="btn-secondary px-4 py-3 text-sm"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-2">Share this code to earn rewards when friends sign up</p>
      </div>

      {/* Settings quick links */}
      <div className="card divide-y divide-surface-100">
        {[
          { icon: Bell, label: 'Notification Preferences', desc: 'Manage alerts & updates' },
          { icon: Wallet, label: 'Payment Methods', desc: 'Cards, UPI & wallet' },
          { icon: Shield, label: 'Privacy & Security', desc: 'Password, 2FA settings' },
        ].map(({ icon: Icon, label, desc }) => (
          <button key={label} className="w-full flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors text-left">
            <div className="w-10 h-10 bg-surface-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-surface-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 text-sm">{label}</p>
              <p className="text-xs text-surface-400">{desc}</p>
            </div>
            <span className="text-surface-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
