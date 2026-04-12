import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Header */}
      <header className="py-6 px-8">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-surface-900">ShareWay</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-surface-400">
        © {new Date().getFullYear()} ShareWay. Built for the future of mobility.
      </footer>
    </div>
  );
}
