import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, LogIn, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export function TournamentAccess() {
  const { user, loading: authLoading, loginWithGoogle, loginAsSpectator } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatic RBAC Routing: Monitor auth state and auto-navigate users to their authorized dashboards
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'OPERATIONS') {
        navigate('/operations', { replace: true });
      } else if (user.role === 'VOLUNTEER') {
        navigate('/volunteer', { replace: true });
      } else {
        navigate('/fan', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      
      if (errCode === 'auth/configuration-not-found' || errMsg.includes('configuration-not-found')) {
        setError(
          'Google Sign-In is not yet configured on this environment.\n\n' +
          'For tournament guest users and evaluators, please select the "Continue as Spectator" portal to instantly bypass login and access the live matchday companion.'
        );
      } else {
        setError(errMsg || 'Failed to authenticate secure credentials with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpectatorLogin = async () => {
    setLoading(true);
    try {
      // Spectator path always maps to 'FAN' role and opens the Fan Dashboard
      await loginAsSpectator('FAN');
    } catch (err) {
      setError('Failed to issue spectator entry pass.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050B14] text-white min-h-[calc(100vh-140px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050B14] text-white relative py-12 px-4 overflow-hidden min-h-[calc(100vh-140px)]">
      {/* Structural ambient styling resembling official control room interfaces */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Brand/Event Indicator */}
        <div className="flex items-center gap-2.5 mb-4 bg-blue-950/40 border border-blue-500/20 rounded-full px-4 py-1.5 shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300 font-mono">
            FIFA WORLD CUP 2026 • GATEWAY ACCESS CONTROL
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-center tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent uppercase">
          TOURNAMENT PORTAL
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-3 text-center max-w-lg leading-relaxed font-medium">
          Central gateway authorization system for active duty officials, volunteers, and matchday spectators.
        </p>

        {error && (
          <div className="mt-8 w-full max-w-2xl rounded-2xl border border-red-500/25 bg-red-950/20 p-5 text-xs text-red-300 font-semibold text-left whitespace-pre-line animate-in fade-in duration-200 shadow-2xl leading-relaxed">
            <span className="font-bold text-red-400 flex items-center gap-1.5 mb-1.5 font-mono uppercase">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              SYSTEM DIAGNOSTICS:
            </span>
            {error}
          </div>
        )}

        {/* Two Entry Paths Only */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mt-12">
          
          {/* Path A: Spectator Entry */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-500/25 transition-all duration-300 shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-500/20" />
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white mt-6 tracking-tight">Spectator Entry</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                No credentials required. Grants instant access to the Live Fan Dashboard, allowing you to explore wayfinding calculations, match schedules, and local AI support assistants.
              </p>

              <ul className="mt-6 space-y-3 text-[11px] text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500/80 shrink-0" />
                  Live Matchday Companion View
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500/80 shrink-0" />
                  Concourse Wayfinding & Assistance
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button
                onClick={handleSpectatorLogin}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-4 text-xs font-black tracking-wide shadow-lg shadow-emerald-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                Continue as Spectator
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Path B: Google Auth */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 p-6 sm:p-8 flex flex-col justify-between hover:border-blue-500/25 transition-all duration-300 shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-blue-500/20" />
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white mt-6 tracking-tight">FIFA Official Portal</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                Authentication required. Secure sign-in for tournament directors, arena security staff, and volunteer rosters. The system automatically assigns roles based on secure credentials.
              </p>

              <ul className="mt-6 space-y-3 text-[11px] text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500/80 shrink-0" />
                  Automatic Duty Roster Evaluation
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500/80 shrink-0" />
                  Staff Operations Command Access
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full rounded-2xl bg-blue-500 hover:bg-blue-400 text-slate-950 py-3.5 px-4 text-xs font-black tracking-wide shadow-lg shadow-blue-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-blue-500 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Continue with Google
              </button>
            </div>
          </div>

        </div>

        {/* Footer info line */}
        <p className="text-[10px] text-slate-600 text-center mt-12 leading-relaxed font-mono">
          ArenaFlow Matchday Console v2026.1 • Secure telemetry standards conform to FIFA Matchday Ops Guidelines.
        </p>
      </div>
    </div>
  );
}
export default TournamentAccess;
