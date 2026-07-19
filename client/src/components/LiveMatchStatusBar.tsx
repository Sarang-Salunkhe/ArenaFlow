import { useAssistant } from '../context/AssistantContext';
import { 
  Users, 
  HeartPulse, 
  Shield, 
  Train, 
  Wifi, 
  CloudSun, 
  Cpu
} from 'lucide-react';

export function LiveMatchStatusBar() {
  const { stadiumState } = useAssistant();
  const match = stadiumState?.match;

  if (!stadiumState || !match) {
    return (
      <div className="bg-slate-900 border-b border-white/5 py-3 px-4 animate-pulse flex justify-between items-center text-xs text-slate-500">
        <div>Loading persistent match engine...</div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
          <span>Synchronizing Arena telemetry</span>
        </div>
      </div>
    );
  }

  // Set command status flags based on active incidents
  const incidents = stadiumState.incidents.filter(i => i.active);
  const hasMedicalIncident = incidents.some(i => i.title.toLowerCase().includes('med') || i.title.toLowerCase().includes('cardiac'));
  const hasSecurityIncident = incidents.some(i => i.title.toLowerCase().includes('security') || i.title.toLowerCase().includes('package') || i.title.toLowerCase().includes('unattended'));
  const hasTransportIncident = incidents.some(i => i.title.toLowerCase().includes('transport') || i.title.toLowerCase().includes('metro') || i.title.toLowerCase().includes('bus') || stadiumState.transport.metroQueueSeconds > 450);
  const hasWeatherIncident = incidents.some(i => i.title.toLowerCase().includes('rain') || i.title.toLowerCase().includes('weather'));
  const hasPowerIncident = incidents.some(i => i.title.toLowerCase().includes('power') || i.title.toLowerCase().includes('electricity') || i.title.toLowerCase().includes('blackout'));

  // Get status class/text
  const getStatus = (hasWarning: boolean, normalText: string, warningText: string) => {
    if (hasWarning) {
      return {
        text: warningText,
        colorClass: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
        dotClass: 'bg-amber-400 animate-pulse'
      };
    }
    return {
      text: normalText,
      colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
      dotClass: 'bg-emerald-400'
    };
  };

  const statusMedical = getStatus(hasMedicalIncident, "Medical Ready", "Medical Active");
  const statusSecurity = getStatus(hasSecurityIncident, "Security Ready", "Security Alert");
  const statusTransport = getStatus(hasTransportIncident, "Transport Normal", "Transport Delays");
  const statusComms = getStatus(hasPowerIncident, "Communications Online", "Aux Comms Active");
  const statusWeather = getStatus(hasWeatherIncident, "Weather Stable", "Weather Advisory");
  const statusAI = {
    text: "AI Copilot Online",
    colorClass: "text-blue-400 bg-blue-400/10 border-blue-500/20",
    dotClass: "bg-blue-400 animate-pulse"
  };

  // Importance Badge style
  const importanceStyle = match.importance === 'CRITICAL' 
    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
    : match.importance === 'HIGH' 
    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

  return (
    <div id="live-match-status-bar" className="bg-slate-950/70 border-b border-white/5 py-2.5 px-4 sm:px-6 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Match Engine: Live Score & Match Information */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          
          {/* Live Status Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/5 px-3 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${match.status === 'Finished' ? 'bg-slate-500' : 'bg-red-500'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${match.status === 'Finished' ? 'bg-slate-500' : 'bg-red-500'}`} />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-200">
              {match.status}
            </span>
            {match.minute > 0 && match.status !== 'Finished' && (
              <span className="text-xs font-mono font-bold text-red-500 pl-1.5 border-l border-white/10">
                {String(match.minute).padStart(2, '0')}&apos;
                {match.addedTime > 0 && <span className="text-red-400 font-sans text-[11px] font-semibold">+{match.addedTime}</span>}
              </span>
            )}
          </div>

          {/* Core Scoreline Board */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">{match.teamHome}</span>
              <span className="text-lg font-black font-mono text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5 min-w-[28px] text-center">{match.scoreHome}</span>
            </div>
            <span className="text-slate-600 font-extrabold font-mono text-xs">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black font-mono text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5 min-w-[28px] text-center">{match.scoreAway}</span>
              <span className="text-xs font-bold text-slate-100">{match.teamAway}</span>
            </div>
          </div>

          {/* Match Telemetry Badges */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-lg tracking-wider ${importanceStyle}`}>
              {match.importance}
            </span>
            <div className="flex items-center gap-1 bg-slate-900/40 border border-white/5 px-2.5 py-1 rounded-lg text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-bold font-mono text-slate-200">
                {match.attendance.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">In Arena</span>
            </div>
          </div>

        </div>

        {/* Command Status Lights Grid */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 lg:border-t-0 lg:pt-0">
          
          {/* Medical */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusMedical.colorClass}`}>
            <HeartPulse className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusMedical.dotClass}`} />
            <span>{statusMedical.text}</span>
          </div>

          {/* Security */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusSecurity.colorClass}`}>
            <Shield className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusSecurity.dotClass}`} />
            <span>{statusSecurity.text}</span>
          </div>

          {/* Transport */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusTransport.colorClass}`}>
            <Train className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusTransport.dotClass}`} />
            <span>{statusTransport.text}</span>
          </div>

          {/* Comms / Power */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusComms.colorClass}`}>
            <Wifi className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusComms.dotClass}`} />
            <span>{statusComms.text}</span>
          </div>

          {/* Weather */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusWeather.colorClass}`}>
            <CloudSun className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusWeather.dotClass}`} />
            <span>{statusWeather.text}</span>
          </div>

          {/* AI */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusAI.colorClass}`}>
            <Cpu className="h-3 w-3 shrink-0" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusAI.dotClass}`} />
            <span>{statusAI.text}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
