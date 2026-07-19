import { useState, useRef, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { LogOut, Shield, ChevronDown, Radio, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => navigate('/access')}
        className="rounded-full bg-blue-500 hover:bg-blue-400 text-slate-950 px-4 py-1.5 text-xs font-black tracking-wide transition-all shadow hover:shadow-blue-500/20 cursor-pointer"
      >
        🔐 Tournament Access
      </button>
    );
  }

  // Define colors based on roles
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'OPERATIONS':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-400',
          dot: 'bg-red-500',
          label: 'OPERATIONS',
          icon: <Shield className="h-3 w-3" />
        };
      case 'VOLUNTEER':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-500',
          label: 'VOLUNTEER',
          icon: <Radio className="h-3 w-3" />
        };
      case 'FAN':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'FAN SPECTATOR',
          icon: <Navigation className="h-3 w-3" />
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-950/40 p-1.5 pr-3 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User Profile'}
            className="h-7 w-7 rounded-full object-cover border border-white/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
          </div>
        )}

        <div className="hidden text-left sm:block">
          <p className="max-w-[100px] truncate text-[11px] font-black text-white leading-none">
            {user.displayName || 'Spectator'}
          </p>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            <span className={`h-1 w-1 rounded-full ${roleConfig.dot}`} />
            {roleConfig.label}
          </span>
        </div>

        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-800 bg-slate-950 p-3.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-3 duration-150">
          {/* User Bio Header */}
          <div className="border-b border-white/5 pb-2.5 mb-3.5">
            <p className="text-xs font-black text-white">{user.displayName || 'Spectator'}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
            
            <div className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-extrabold tracking-wider w-fit uppercase ${roleConfig.bg}`}>
              {roleConfig.icon}
              {roleConfig.label}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            De-authenticate Session
          </button>
        </div>
      )}
    </div>
  );
}
export default UserMenu;
