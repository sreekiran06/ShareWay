import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [usePhone, setUsePhone] = useState(false);
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
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', shape: 'rectangular', text: 'continue_with' }
      );
    });
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    try {
      // Decode the JWT credential from Google
      const base64 = response.credential.split('.')[1];
      const payload = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));

      const { data } = await api.post('/auth/google', {
        token: response.credential,
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
      });

      // Store token and user in zustand
      const { setUser, setToken } = useAuthStore.getState();
      setToken(data.token, data.refreshToken);
      setUser(data.user);

      // Persist to localStorage (zustand persist)
      const stored = JSON.parse(localStorage.getItem('shareway-auth') || '{}');
      stored.state = { ...stored.state, token: data.token, refreshToken: data.refreshToken, user: data.user, isAuthenticated: true };
      localStorage.setItem('shareway-auth', JSON.stringify(stored));

      toast.success(`Welcome, ${data.user.name.split(' ')[0]}! 👋`);
      navigate(data.user.role === 'admin' ? '/admin' : data.user.role === 'driver' ? '/driver' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In not configured. Use email/password login.');
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

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

      {/* Google Sign-In */}
      {GOOGLE_CLIENT_ID ? (
        <div className="mb-5">
          <div id="google-signin-btn" className="w-full" />
          {googleLoading && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-surface-500">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Signing in with Google...
            </div>
          )}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>
        </div>
      ) : (
        /* Fallback Google button when no client ID configured */
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleButtonClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-surface-200 rounded-2xl hover:bg-surface-50 transition-colors font-medium text-surface-700 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>
        </div>
      )}

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

      {/* Demo accounts */}
      <div className="mt-5 p-4 bg-surface-50 rounded-2xl border border-surface-200">
        <p className="text-xs font-semibold text-surface-500 mb-2">Demo Accounts</p>
        <div className="space-y-1.5 text-xs text-surface-600">
          {[
            ['🧑', 'user@demo.com'],
            ['🚗', 'driver@demo.com'],
            ['🛡️', 'admin@demo.com'],
          ].map(([icon, email]) => (
            <div key={email} className="flex items-center justify-between">
              <span>{icon} <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">{email}</span></span>
              <button
                type="button"
                onClick={() => setForm({ email, password: 'demo1234' })}
                className="text-brand-500 font-semibold hover:text-brand-600 ml-2"
              >
                Use
              </button>
            </div>
          ))}
          <p className="text-surface-400 mt-1">Password: <span className="font-mono bg-surface-200 px-1.5 py-0.5 rounded">demo1234</span></p>
        </div>
      </div>

      <p className="text-center text-sm text-surface-500 mt-5">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-500 hover:text-brand-600 font-semibold">Sign up free</Link>
      </p>
    </div>
  );
}
