import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white py-12 px-4 min-h-[calc(100vh-140px)] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md border border-slate-800 bg-slate-900/30 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-center relative overflow-hidden">
        {/* red top bar indicator */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-600 to-red-500" />

        {/* Warning Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          <ShieldAlert className="h-6 w-6 animate-pulse" />
        </div>

        {/* Status Heading */}
        <span className="text-[9px] font-black tracking-[0.25em] text-red-500 uppercase block mb-1">
          SECURE SECTOR ACCESS RESTRICTED
        </span>
        <h1 className="text-xl font-black text-white">ACCESS DENIED</h1>
        
        <p className="text-slate-400 text-xs mt-3 leading-relaxed">
          Your current security clearance level (<strong className="text-white uppercase font-black">{user?.role || 'UNAUTHENTICATED'}</strong>) is insufficient to access this operational terminal.
        </p>

        {/* Help box */}
        <div className="mt-5 rounded-2xl bg-slate-950/60 border border-white/5 p-3.5 text-left text-[11px] leading-relaxed text-slate-400">
          <p className="font-bold text-slate-300">Operations Protocol:</p>
          <p className="mt-1">
            Access to this zone is monitored. Active duty staff or operations commanders must log in with authorized credentials.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-white/5">
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-xl bg-white hover:bg-slate-100 text-slate-950 py-2.5 text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Return to ArenaFlow Center
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
export default Unauthorized;
