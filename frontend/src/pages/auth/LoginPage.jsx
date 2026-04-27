import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Phone, ArrowRight, User, Car, Map, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, setUser, setToken } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [usePhone, setUsePhone] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCred, setGoogleCred] = useState(null);
  const [googleRole, setGoogleRole] = useState('user');

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCallback = (response) => {
    // Intercept flow to ask for role
    setGoogleCred(response.credential);
  };

  const submitGoogleAuth = async () => {
    if (!googleCred) return;
    setGoogleLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        credential: googleCred,
        role: googleRole,
      });

      // ✅ Use store methods directly — zustand-persist handles localStorage automatically
      setToken(data.token, data.refreshToken);
      setUser(data.user);

      toast.success(`Welcome, ${data.user.name.split(' ')[0]}! 👋`);
      navigate(
        data.user.role === 'admin' ? '/admin' :
          ['driver', 'both'].includes(data.user.role) ? '/driver' : '/'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
      setGoogleCred(null);
    }
  };

  // Removed manual google initialization

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = usePhone
      ? { phone: form.email.trim(), password: form.password }
      : { email: form.email.trim(), password: form.password };
    const result = await login(payload);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}! 👋`);
      navigate(
        result.user.role === 'admin' ? '/admin' :
          result.user.role === 'driver' ? '/driver' : '/'
      );
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
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Welcome back</h1>
        <p className="text-surface-500 text-sm">Sign in to your ShareWay account</p>
      </div>

      {/* Google Sign-In */}
      <div className="mb-5">
        {GOOGLE_CLIENT_ID ? (
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleCallback}
              onError={() => toast.error('Google sign-in failed')}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              width="320"
            />
            {googleLoading && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-surface-500 absolute">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-surface-400 py-3 border border-surface-200 rounded-2xl">
            Google Sign-In not configured
          </div>
        )}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-surface-200" />
          <span className="text-xs text-surface-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-surface-200" />
        </div>
      </div>

      {/* Email/Phone toggle */}
      <div className="flex bg-surface-100 rounded-2xl p-1 mb-5">
        <button type="button" onClick={() => setUsePhone(false)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${!usePhone ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}>
          Email
        </button>
        <button type="button" onClick={() => setUsePhone(true)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${usePhone ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}>
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
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading
            ? <span className="loading-dots"><span /><span /><span /></span>
            : <>Sign In <ArrowRight size={16} /></>}
        </button>
      </form>



      <p className="text-center text-sm text-surface-500 mt-5">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-500 hover:text-brand-600 font-semibold">Sign up free</Link>
      </p>

      {/* Google Role Selection Modal */}
      {googleCred && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setGoogleCred(null)}
              className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-display font-bold text-surface-900">Complete Sign In</h3>
              <p className="text-surface-500 text-sm mt-1">If you are new, what is your primary role?</p>
            </div>

            <div className="flex gap-3 mb-6">
              {[
                { value: 'user', icon: User, label: 'Rider' },
                { value: 'driver', icon: Car, label: 'Driver' },
                { value: 'both', icon: Map, label: 'Both' }
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoogleRole(value)}
                  className={`flex-1 p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                    googleRole === value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                  }`}
                >
                  <Icon size={20} className={`mx-auto mb-2 ${googleRole === value ? 'text-brand-500' : 'text-surface-400'}`} />
                  <p className={`font-semibold text-xs ${googleRole === value ? 'text-brand-700' : 'text-surface-700'}`}>{label}</p>
                </button>
              ))}
            </div>

            <button 
              onClick={submitGoogleAuth} 
              disabled={googleLoading} 
              className="btn-primary w-full"
            >
              {googleLoading ? <span className="loading-dots"><span /><span /><span /></span> : 'Continue'}
            </button>
            <p className="text-xs text-center text-surface-400 mt-4">For existing accounts, your role will not be overwritten.</p>
          </div>
        </div>
      )}
    </div>
  );
}