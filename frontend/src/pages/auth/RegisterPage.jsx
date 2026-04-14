import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Car } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

/* ── Google Sign-In helper ── */
const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    document.head.appendChild(script);
  });
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, googleAuth, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    loadGoogleScript().then((google) => {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        cancel_on_tap_outside: true,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        { theme: 'outline', size: 'large', width: '100%', shape: 'rectangular', text: 'continue_with' }
      );
    });
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    try {
      const result = await googleAuth(response.credential, form.role);
      if (result.success) {
        toast.success(`Welcome to ShareWay, ${result.user.name.split(' ')[0]}! 🎉`);
        navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'driver' ? '/driver' : '/');
      } else {
        toast.error(result.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In not configured.');
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    const { confirmPassword, ...payload } = form;
    const result = await register(payload);
    if (result.success) {
      toast.success(`Account created! Welcome to ShareWay, ${result.user.name.split(' ')[0]}! 🎉`);
      navigate(result.user.role === 'driver' ? '/driver/register' : '/');
    } else {
      toast.error(result.message);
    }
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Create account</h1>
        <p className="text-surface-500 text-sm">Join thousands of ShareWay users</p>
      </div>

      {/* Role selector */}
      <div className="flex gap-3 mb-6">
        {[
          { value: 'user', icon: User, label: 'Rider', desc: 'Book rides & deliveries' },
          { value: 'driver', icon: Car, label: 'Driver', desc: 'Earn money driving' }
        ].map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setForm({ ...form, role: value })}
            className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
              form.role === value
                ? 'border-brand-500 bg-brand-50'
                : 'border-surface-200 bg-surface-50 hover:border-surface-300'
            }`}
          >
            <Icon size={20} className={form.role === value ? 'text-brand-500' : 'text-surface-400'} />
            <p className={`font-semibold text-sm mt-2 ${form.role === value ? 'text-brand-700' : 'text-surface-700'}`}>{label}</p>
            <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Full name" className="input-field pl-11" required {...f('name')} />
        </div>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="email" placeholder="Email address" className="input-field pl-11" required {...f('email')} />
        </div>
        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="tel" placeholder="+91 98765 43210" className="input-field pl-11" required {...f('phone')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              className="input-field pl-11"
              required
              {...f('password')}
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm"
              className="input-field pl-11"
              required
              {...f('confirmPassword')}
            />
          </div>
        </div>
        <button type="button" onClick={() => setShowPass(!showPass)} className="flex items-center gap-2 text-xs text-surface-400 hover:text-surface-600">
          {showPass ? <EyeOff size={12} /> : <Eye size={12} />} {showPass ? 'Hide' : 'Show'} password
        </button>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <span className="loading-dots"><span /><span /><span /></span> : <>Create Account <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="mt-6 mb-6 flex items-center">
        <div className="flex-1 border-t border-surface-200"></div>
        <span className="px-3 text-sm text-surface-400">OR</span>
        <div className="flex-1 border-t border-surface-200"></div>
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div>
          <div id="google-signup-btn" className="w-full" />
          {googleLoading && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-surface-500">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Signing up with Google...
            </div>
          )}
        </div>
      ) : (
        <button disabled={isLoading} onClick={handleGoogleButtonClick} type="button" className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors shadow-sm disabled:opacity-50">
          Default Google Button
        </button>
      )}

      <p className="text-center text-xs text-surface-400 mt-4">
        By registering, you agree to our{' '}
        <span className="text-brand-500 cursor-pointer">Terms of Service</span> and{' '}
        <span className="text-brand-500 cursor-pointer">Privacy Policy</span>
      </p>

      <p className="text-center text-sm text-surface-500 mt-4">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-brand-500 hover:text-brand-600 font-semibold">Sign in</Link>
      </p>
    </div>
  );
}
