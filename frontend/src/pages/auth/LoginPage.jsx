import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [usePhone, setUsePhone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = usePhone
      ? { phone: form.email, password: form.password }
      : { email: form.email, password: form.password };
    const result = await login(payload);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}! 👋`);
      navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'driver' ? '/driver' : '/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Welcome back</h1>
        <p className="text-surface-500 text-sm">Sign in to your ShareWay account</p>
      </div>

      {/* Toggle email/phone */}
      <div className="flex bg-surface-100 rounded-2xl p-1 mb-6">
        <button
          type="button"
          onClick={() => setUsePhone(false)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${!usePhone ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setUsePhone(true)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${usePhone ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
            {usePhone ? <Phone size={16} /> : <Mail size={16} />}
          </div>
          <input
            type={usePhone ? 'tel' : 'email'}
            placeholder={usePhone ? '+91 98765 43210' : 'you@example.com'}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field pl-11"
            required
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
            <Lock size={16} />
          </div>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input-field pl-11 pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="text-right">
          <button type="button" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <span className="loading-dots"><span /><span /><span /></span>
          ) : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="mt-6 p-4 bg-surface-50 rounded-2xl border border-surface-200">
        <p className="text-xs font-semibold text-surface-500 mb-2">Demo Accounts</p>
        <div className="space-y-1.5 text-xs text-surface-600">
          <p>🧑 User: <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">user@demo.com</span> / <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">demo1234</span></p>
          <p>🚗 Driver: <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">driver@demo.com</span> / <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">demo1234</span></p>
          <p>🛡️ Admin: <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">admin@demo.com</span> / <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">demo1234</span></p>
        </div>
      </div>

      <p className="text-center text-sm text-surface-500 mt-6">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-500 hover:text-brand-600 font-semibold">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
