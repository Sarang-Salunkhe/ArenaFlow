import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close the menu automatically when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const desktopLinks = [
    { to: '/operations', label: 'Operations' },
    { to: '/fan', label: 'Fan' },
    { to: '/volunteer', label: 'Volunteer' },
  ];

  const mobileLinks = [
    { to: '/', label: 'Home' },
    { to: '/operations', label: 'Operations' },
    { to: '/fan', label: 'Fan' },
    { to: '/volunteer', label: 'Volunteer' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-arena-navy/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
          aria-label="ArenaFlow home"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/30 bg-arena-blue text-sm font-bold text-white shadow-lg shadow-blue-950/40"
            aria-hidden="true"
          >
            AF
          </span>
          <span>
            <span className="block text-xl font-semibold tracking-tight text-white group-hover:text-blue-200">
              ArenaFlow
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:block">
              Tournament Command
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary Desktop Navigation" className="hidden md:block">
          <ul className="flex items-center gap-2">
            {desktopLinks.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isActive
                        ? 'border-blue-500/30 bg-blue-500/10 text-white'
                        : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Hamburger Toggle Button for Tablet/Mobile */}
        <button
          type="button"
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile slide-out drawer - backdrop */}
        <div
          className={`fixed inset-0 top-[73px] z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile slide-out drawer - container */}
        <nav
          id="mobile-navigation"
          aria-label="Primary Mobile Navigation"
          className={`fixed right-0 top-[73px] z-40 h-[calc(100vh-73px)] w-full max-w-xs border-l border-white/5 bg-slate-950/95 p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ul className="flex flex-col gap-3">
            {mobileLinks.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setIsOpen(false)}
                    className={`flex h-12 items-center rounded-2xl border px-5 text-base font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isActive
                        ? 'border-blue-500/30 bg-blue-500/10 text-white shadow-inner shadow-blue-500/5'
                        : 'border-transparent text-slate-300 hover:border-white/5 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
