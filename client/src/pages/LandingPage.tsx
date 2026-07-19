import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Compass, 
  Activity, 
  ClipboardList
} from 'lucide-react';
import { getMatchStats } from '../utils/gameSimulator';
import { MatchPhase } from '../types';

interface CountdownCardProps {
  value: number;
  label: string;
}

// High-fidelity countdown digit card with horizontal split divider & slide-up digit animations
function CountdownCard({ value, label }: CountdownCardProps) {
  const paddedValue = value.toString().padStart(2, '0');
  const tensDigit = paddedValue[0];
  const onesDigit = paddedValue[1];

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1">
        {/* Tens digit card */}
        <div className="relative w-10 h-14 sm:w-13 sm:h-18 rounded-xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
          {/* Subtle overlay split line */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-950/70 z-10" />
          
          <span 
            key={`${label}-tens-${tensDigit}`} 
            className="text-xl sm:text-3xl font-extrabold text-blue-400 font-mono tracking-tight animate-digit-transition inline-block"
          >
            {tensDigit}
          </span>
          
          {/* Subtle glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        </div>

        {/* Ones digit card */}
        <div className="relative w-10 h-14 sm:w-13 sm:h-18 rounded-xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
          {/* Subtle overlay split line */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-950/70 z-10" />
          
          <span 
            key={`${label}-ones-${onesDigit}`} 
            className="text-xl sm:text-3xl font-extrabold text-blue-400 font-mono tracking-tight animate-digit-transition inline-block"
          >
            {onesDigit}
          </span>
          
          {/* Subtle glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        </div>
      </div>
      
      <span className="mt-1.5 text-[8px] sm:text-[10px] font-black tracking-widest text-slate-500 uppercase">{label}</span>
    </div>
  );
}

export function LandingPage() {
  const [ticketCount, setTicketCount] = useState(48920);
  const [timeString, setTimeString] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('PRE_MATCH');
  const [tickCount, setTickCount] = useState(0);

  // Target date: World Cup 2026 Grand Final at MetLife Stadium
  const TARGET_DATE = new Date('2026-07-19T20:00:00Z');

  // Fetch active stadium state to align scoreboard with the simulation dashboard
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/stadium/state');
        if (res.ok) {
          const data = await res.json();
          setMatchPhase(data.matchPhase || 'PRE_MATCH');
          setTickCount(data.tickCount || 0);
        }
      } catch (err) {
        console.warn('Failed to retrieve synchronized stadium state:', err);
      }
    };
    fetchState();
    const stateInterval = setInterval(fetchState, 5000);
    return () => clearInterval(stateInterval);
  }, []);

  // Live ticket scanner, clock, and countdown effects
  useEffect(() => {
    const ticketInterval = setInterval(() => {
      setTicketCount(prev => {
        if (prev >= 82500) return 48920;
        return prev + Math.floor(Math.random() * 8) + 1;
      });
    }, 3000);

    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC');
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Live high-fidelity countdown calculation
    const calculateTimeLeft = () => {
      const now = new Date();
      let diff = TARGET_DATE.getTime() - now.getTime();
      
      // Fallback: If target date has passed, roll forward to a major next matchday event
      if (diff <= 0) {
        const nextEvent = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000);
        diff = nextEvent.getTime() - now.getTime();
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };
    calculateTimeLeft();
    const countdownInterval = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(ticketInterval);
      clearInterval(clockInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12 animate-fade-in">
      
      {/* Tournament Operational Banner */}
      <section className="relative overflow-hidden rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/40 p-6 sm:p-8 md:p-10 shadow-2xl mb-10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
                <Trophy className="h-3.5 w-3.5 text-blue-400" />
                FIFA WORLD CUP 2026™ HOST PORTAL
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MetLife Stadium Operations Hub</span>
            </div>
            
            <h1 className="mt-4 fluid-h1 font-black tracking-tight text-white font-sans leading-tight" aria-label="ArenaFlow">
              ArenaFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Tournament Command</span>
            </h1>
            <p className="sr-only">GenAI-Powered Stadium Intelligence & Operations Platform</p>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Welcome to the centralized operations portal for the World Cup 2026. ArenaFlow connects 
              live crowd telemetry, wayfinding computations, and volunteer dispatch structures in real-time, 
              fortified by server-side GenAI decision-support diagnostics.
            </p>

            {/* Quick Context Chips */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2 bg-slate-950/50 border border-white/5 rounded-full px-4 py-2">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>New York / New Jersey (East Coast Hub)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/50 border border-white/5 rounded-full px-4 py-2">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>SysTime: <strong className="text-white font-mono">{timeString}</strong></span>
              </div>
            </div>

            {/* Countdown Banner / Bento Block */}
            <div className="mt-6 rounded-2xl border border-blue-500/10 bg-slate-950/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden countdown-active-glow">
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-blue-400">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grand Finale Countdown</span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-1">MetLife Championship Match</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Kickoff: July 19, 2026 • 20:00 UTC</p>
                </div>

                {/* The Timer Segment */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <CountdownCard value={timeLeft.days} label="Days" />
                  <span className="text-xl sm:text-2xl font-black text-slate-600 font-mono -mt-5">:</span>
                  <CountdownCard value={timeLeft.hours} label="Hours" />
                  <span className="text-xl sm:text-2xl font-black text-slate-600 font-mono -mt-5">:</span>
                  <CountdownCard value={timeLeft.minutes} label="Mins" />
                  <span className="text-xl sm:text-2xl font-black text-slate-600 font-mono -mt-5">:</span>
                  <CountdownCard value={timeLeft.seconds} label="Secs" />
                </div>
              </div>
            </div>
          </div>

          {/* Live Matchday Info Hub Widget - High Fidelity Dynamic Match Center */}
          <div className="w-full lg:max-w-md bg-slate-950/80 border border-white/5 rounded-3xl p-5 shadow-inner backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Matchday 18 Center</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                    {matchPhase === 'PRE_MATCH' && 'Pre-Match'}
                    {matchPhase === 'ENTRY_SURGE' && 'Anthem Ceremony'}
                    {matchPhase === 'MATCH_ACTIVE' && `Live • ${getMatchStats(matchPhase, tickCount).activeMinute}'`}
                    {matchPhase === 'HALF_TIME' && 'Halftime'}
                    {matchPhase === 'MATCH_END' && 'Fulltime'}
                    {matchPhase === 'EXIT_SURGE' && 'Match Egress'}
                  </span>
                </div>
              </div>

              {/* Scoreboard Block */}
              <div className="rounded-2xl bg-slate-900/40 border border-white/[0.02] p-4 mb-4 text-center relative overflow-hidden">
                <div className="flex justify-between items-center gap-4 relative z-10">
                  {/* Home Team */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-black text-white shadow-md">
                        USA
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-blue-500 text-slate-950 text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-slate-950">🇺🇸</span>
                    </div>
                    <span className="mt-2 block text-xs font-extrabold text-white">USA</span>
                  </div>

                  {/* Score digits */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-black text-white">
                      {getMatchStats(matchPhase, tickCount).homeScore}
                    </span>
                    <span className="text-slate-600 font-extrabold font-mono text-lg">:</span>
                    <span className="text-3xl font-mono font-black text-white">
                      {getMatchStats(matchPhase, tickCount).awayScore}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-sm font-black text-white shadow-md">
                        GER
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-red-600 text-slate-950 text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-slate-950">🇩🇪</span>
                    </div>
                    <span className="mt-2 block text-xs font-extrabold text-white">Germany</span>
                  </div>
                </div>

                {/* Match minutes subtitle or phase descriptor */}
                <div className="mt-2 text-[10px] text-slate-400 font-medium">
                  {matchPhase === 'MATCH_ACTIVE' && `FIFA World Cup Group B • Matchday 18`}
                  {matchPhase !== 'MATCH_ACTIVE' && `Championship Operations Stream`}
                </div>
              </div>

              {/* Live Match Statistics Visual Panel */}
              <div className="space-y-3 mb-4 rounded-2xl bg-slate-900/20 border border-white/5 p-3">
                {/* Possession slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Possession {getMatchStats(matchPhase, tickCount).possession[0]}%</span>
                    <span>{getMatchStats(matchPhase, tickCount).possession[1]}% Possession</span>
                  </div>
                  <div className="h-1.5 w-full bg-rose-600/30 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                      style={{ width: `${getMatchStats(matchPhase, tickCount).possession[0]}%` }}
                    />
                  </div>
                </div>

                {/* Shots, Corners, Fouls grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 rounded-lg bg-slate-950/40">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Shots</span>
                    <span className="text-xs font-extrabold text-white mt-0.5">
                      {getMatchStats(matchPhase, tickCount).shots[0]} <span className="text-slate-600 font-normal">-</span> {getMatchStats(matchPhase, tickCount).shots[1]}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/40">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Corners</span>
                    <span className="text-xs font-extrabold text-white mt-0.5">
                      {getMatchStats(matchPhase, tickCount).corners[0]} <span className="text-slate-600 font-normal">-</span> {getMatchStats(matchPhase, tickCount).corners[1]}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/40">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Fouls</span>
                    <span className="text-xs font-extrabold text-white mt-0.5">
                      {getMatchStats(matchPhase, tickCount).fouls[0]} <span className="text-slate-600 font-normal">-</span> {getMatchStats(matchPhase, tickCount).fouls[1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Match Commentary Feed */}
              <div className="border-t border-white/5 pt-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Live Match Events</span>
                <div className="max-h-24 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {getMatchStats(matchPhase, tickCount).commentary.slice(0, 3).map((event, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-[11px] leading-snug rounded-lg bg-slate-950/30 p-2 border border-white/[0.02]">
                      <span className={`shrink-0 text-[10px] font-black font-mono px-1 rounded ${
                        event.type === 'goal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        event.type === 'card' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        event.type === 'sub' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {event.minute > 0 ? `${event.minute}'` : 'Info'}
                      </span>
                      <p className="text-slate-300 text-left">{event.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance & Forecast Info */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5 text-center">
              <div className="rounded-2xl bg-slate-900/40 p-2 border border-white/[0.02]">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Stadium Scan</span>
                <span className="text-xs font-black text-white font-mono block mt-0.5">{ticketCount.toLocaleString()}</span>
                <span className="text-[8px] text-slate-500">Cap: 82,500</span>
              </div>
              <div className="rounded-2xl bg-slate-900/40 p-2 border border-white/[0.02]">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Weather Posture</span>
                <span className="text-xs font-black text-white block mt-0.5">21°C • Clear</span>
                <span className="text-[8px] text-slate-500">Pacing: Stable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Operations Bento Grid */}
      <section aria-labelledby="portals-title">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="portals-title" className="text-lg font-extrabold text-white tracking-wide">Command &amp; Support Portals</h2>
            <p className="text-xs text-slate-400 mt-1">Select your designated terminal role below to join the operational network.</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold font-mono">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            3 Terminals Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Operations Portal Card */}
          <article className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/80 p-6 shadow-xl transition hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-2xl">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow" aria-hidden="true">
                <Activity className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-black text-white">Operations Command</h3>
                <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold text-blue-400 uppercase tracking-widest">
                  STAFF ONLY
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Monitor live crowd densities, evaluate incident dispatches, inject simulation stress-tests, 
                and receive GenAI communication briefings for the entire stadium transit network.
              </p>

              {/* Teaser Metrics */}
              <div className="mt-6 space-y-2 rounded-2xl bg-slate-950/40 p-4 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Operational Status:</span>
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Nominal
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Risk Index Avg:</span>
                  <span className="text-white font-mono font-bold">18 / 100</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Active Directives:</span>
                  <span className="text-blue-300 font-bold font-mono">Rule Engine Live</span>
                </div>
              </div>
            </div>

            <Link
              to="/operations"
              aria-label="Enter as Operations Staff"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Access Operations Control</span>
              <Compass className="h-4 w-4 group-hover:rotate-45 transition-transform" />
            </Link>
          </article>

          {/* Fan Portal Card */}
          <article className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/80 p-6 shadow-xl transition hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-2xl">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow" aria-hidden="true">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-black text-white">Match Companion</h3>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                  FANS
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Plan optimal travel routes through the stadium concourse, find accessible pathways 
                avoiding stairs, locate nearest F&amp;B services, and chat directly with our multilingual AI helper.
              </p>

              {/* Teaser Metrics */}
              <div className="mt-6 space-y-2 rounded-2xl bg-slate-950/40 p-4 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Wayfinding Status:</span>
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Waypoints Monitored:</span>
                  <span className="text-white font-mono font-bold">12 Concourse Sectors</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">AI Translation:</span>
                  <span className="text-emerald-400 font-bold">EN, ES, DE, FR</span>
                </div>
              </div>
            </div>

            <Link
              to="/fan"
              aria-label="Enter as Fan"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Launch Fan Companion</span>
              <Compass className="h-4 w-4 group-hover:rotate-45 transition-transform" />
            </Link>
          </article>

          {/* Volunteer Portal Card */}
          <article className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/80 p-6 shadow-xl transition hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-2xl">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow" aria-hidden="true">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-black text-white">Volunteer Mission</h3>
                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-400 uppercase tracking-widest">
                  VOLUNTEERS
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Log into your assigned sector station, fulfill customized crowd briefings, follow tactical 
                safety checklists, and dispatch direct incident reports to the Command Center.
              </p>

              {/* Teaser Metrics */}
              <div className="mt-6 space-y-2 rounded-2xl bg-slate-950/40 p-4 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Radio Channel:</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Channel 4 Live
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Assigned Sectors:</span>
                  <span className="text-white font-mono font-bold">13 Service Stations</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Command Uplink:</span>
                  <span className="text-amber-400 font-bold">2-Way Dispatch Active</span>
                </div>
              </div>
            </div>

            <Link
              to="/volunteer"
              aria-label="Enter as Volunteer"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Enter Volunteer Terminal</span>
              <Compass className="h-4 w-4 group-hover:rotate-45 transition-transform" />
            </Link>
          </article>

        </div>
      </section>

      {/* Trust & Operations Policy Footer Card */}
      <section className="mt-12 rounded-[28px] border border-white/5 bg-slate-950/40 p-6 flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-400">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-bold text-white">Secure Command Uplink Active</h4>
          <p className="mt-1 text-slate-400">
            This platform runs behind a secure Cloud Operations framework. All simulation tickers, crowd calculations, and 
            safety briefings are strictly synchronized across all concurrent active client dashboards via internal state engines.
          </p>
        </div>
      </section>

    </div>
  );
}
