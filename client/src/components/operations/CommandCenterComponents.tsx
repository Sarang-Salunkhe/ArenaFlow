import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Clock, 
  Bot, 
  Sparkles, 
  Shield, 
  Heart, 
  Flame, 
  Cloud, 
  Wrench, 
  CheckCircle, 
  Compass,
  Check,
  X,
  Edit2,
  Settings,
  Truck
} from 'lucide-react';
import { StadiumState, OperationalDecision, Incident } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

// Helper to determine risk colors
export const getRiskColorClass = (riskScore: number) => {
  if (riskScore >= 80) return 'text-red-500 fill-red-500/10 stroke-red-500';
  if (riskScore >= 60) return 'text-orange-500 fill-orange-500/10 stroke-orange-500';
  if (riskScore >= 35) return 'text-amber-500 fill-amber-500/10 stroke-amber-500';
  return 'text-emerald-500 fill-emerald-500/10 stroke-emerald-500';
};

export const getRiskBgClass = (riskScore: number) => {
  if (riskScore >= 80) return 'bg-red-950/20 border-red-900/40 text-red-100';
  if (riskScore >= 60) return 'bg-orange-950/20 border-orange-900/40 text-orange-100';
  if (riskScore >= 35) return 'bg-amber-950/20 border-amber-900/40 text-amber-100';
  return 'bg-emerald-950/10 border-emerald-900/30 text-emerald-100';
};

// ==========================================
// 1. TOP COMMAND BAR Component
// ==========================================
interface TopCommandBarProps {
  state: StadiumState;
  activeIncidentsCount: number;
  avgOccupancyPct: number;
  timeString: string;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  state,
  activeIncidentsCount,
  avgOccupancyPct,
  timeString
}) => {
  const totalOccupancy = state.zones.reduce((sum, z) => sum + z.occupancy, 0);
  const totalCapacity = state.zones.reduce((sum, z) => sum + z.capacity, 0);

  // Derive dynamic minute clock
  const getMatchTimeDisplay = () => {
    switch (state.matchPhase) {
      case 'PRE_MATCH': return 'T-90:00 (Gates Open)';
      case 'ENTRY_SURGE': return 'T-30:00 (Anthems)';
      case 'MATCH_ACTIVE': return `LIVE • ${15 + (state.tickCount * 4) % 75}'`;
      case 'HALF_TIME': return 'HT • INTERMISSION';
      case 'MATCH_END': return 'FT • 90:00';
      case 'EXIT_SURGE': return 'T+45:00 (Egress)';
      default: return 'LIVE STREAM';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-4 md:p-6 shadow-2xl backdrop-blur-xl">
      {/* Top glowing indicators */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
              FIFA World Cup 2026™ Matchday Operations
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Secure Operations Link Live</span>
          </div>
          
          <h1 className="mt-2 text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">MetLife Stadium Command Hub</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">ID: SEC-2026</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Match Operations Control Desk • United States vs Germany (Group Stage)
          </p>
        </div>

        {/* Tactical Feed Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 bg-slate-950/80 border border-white/5 p-3 rounded-2xl">
          {/* Live UTC Clock */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Local/UTC Clock</span>
            <span className="text-xs font-black text-white font-mono mt-1 tracking-wider">{timeString}</span>
          </div>

          {/* Match Progress */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Match Phase</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-black text-blue-300 tracking-wide font-sans">{getMatchTimeDisplay()}</span>
            </div>
          </div>

          {/* Scanned Attendance */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Stadium Capacity</span>
            <span className="text-xs font-black text-white font-mono mt-1">
              {totalOccupancy.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ {totalCapacity.toLocaleString()}</span>
            </span>
          </div>

          {/* Occupancy % */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Occupancy</span>
            <span className="text-xs font-black text-emerald-400 font-mono mt-1 flex items-center gap-1">
              {avgOccupancyPct}%
              <span className="text-[9px] text-slate-500 font-normal">cap</span>
            </span>
          </div>

          {/* Pipeline Sync */}
          <div className="flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Satellite Link</span>
            {activeIncidentsCount > 0 ? (
              <span className="text-[10px] font-black text-rose-400 mt-1 flex items-center gap-1 uppercase animate-pulse">
                🚨 {activeIncidentsCount} ALERTS
              </span>
            ) : (
              <span className="text-[10px] font-black text-indigo-400 mt-1 flex items-center gap-1 uppercase">
                🛰️ LINK-SECURE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PRIMARY KPI Component
// ==========================================
interface KpiSectionProps {
  state: StadiumState;
  avgOccupancyPct: number;
  avgRiskScore: number;
  riskStatus: string;
  activeIncidentsCount: number;
  avgGateQueueSec: number;
  maxGateQueueSec: number;
  activeVolunteersCount: number;
}

export const KpiSection: React.FC<KpiSectionProps> = ({
  state,
  avgOccupancyPct,
  avgRiskScore,
  riskStatus,
  activeIncidentsCount,
  avgGateQueueSec,
  maxGateQueueSec,
  activeVolunteersCount
}) => {
  const metroMin = Math.round(state.transport.metroQueueSeconds / 60);
  const busMin = Math.round(state.transport.busQueueSeconds / 60);
  const taxiMin = Math.round(state.transport.taxiQueueSeconds / 60);

  // Dynamic calculations based on simulator ticks for higher fidelity
  const systemHealth = activeIncidentsCount > 0 ? (activeIncidentsCount > 1 ? '94.2% (DEGRADED)' : '98.5% (STABLE)') : '99.98% (OPTIMAL)';
  const responseTime = activeIncidentsCount > 0 ? `${(2.4 + (state.tickCount % 3) * 0.3).toFixed(1)} min` : '1.8 min';
  const aiConfidence = `${(98.6 - activeIncidentsCount * 2.1).toFixed(1)}%`;
  
  const gateOpenCount = state.gates.filter(g => g.status === 'OPEN').length;
  const gateBusyCount = state.gates.filter(g => g.status === 'BUSY').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Crowd Density */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Crowd Density</span>
          <Users className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{avgOccupancyPct}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Average Bowl Loading</p>
        </div>
      </div>

      {/* 2. Active Incidents */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Incident Board</span>
          <AlertTriangle className={`h-4 w-4 ${activeIncidentsCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="mt-2.5">
          <p className={`text-lg font-black font-mono flex items-center gap-1.5 ${activeIncidentsCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {activeIncidentsCount}
            {activeIncidentsCount > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{activeIncidentsCount > 0 ? 'Active Dispatch Teams' : 'All Sectors Normal'}</p>
        </div>
      </div>

      {/* 3. Medical Teams */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medical Teams</span>
          <Heart className="h-4 w-4 text-red-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">12 <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">4 Dispatched | 8 Standby</p>
        </div>
      </div>

      {/* 4. Security Units */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Units</span>
          <Shield className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">24 <span className="text-xs font-normal text-slate-500">Squads</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Fully Deployed on Patrol</p>
        </div>
      </div>

      {/* 5. Volunteer Availability */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Volunteers</span>
          <Users className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{activeVolunteersCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sectors Wayfinding Covered</p>
        </div>
      </div>

      {/* 6. Gate Status */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gate Posture</span>
          <Compass className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{gateOpenCount} <span className="text-xs font-normal text-slate-500">Open</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">{gateBusyCount} Busy turnstiles reporting</p>
        </div>
      </div>

      {/* 7. Queue Time */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queue Times</span>
          <Clock className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{Math.round(avgGateQueueSec / 60)}m <span className="text-xs font-normal text-slate-500">avg</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Max {Math.round(maxGateQueueSec / 60)}m | Metro {metroMin}m | Bus {busMin}m | Taxi {taxiMin}m</p>
        </div>
      </div>

      {/* 8. Avg Response Time */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Response Speed</span>
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{responseTime}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Playbook Response Target</p>
        </div>
      </div>

      {/* 9. AI Confidence */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Co-Driver</span>
          <Bot className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-black text-white font-mono">{aiConfidence}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Prediction Confidence Rate</p>
        </div>
      </div>

      {/* 10. System Health */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Health</span>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2.5">
          <p className="text-xs font-black text-emerald-400 font-mono tracking-wide">{systemHealth}</p>
          <p className="text-[10px] text-slate-400 mt-1">Risk: {avgRiskScore}/100 ({riskStatus})</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. LIVE INCIDENT CENTER Component
// ==========================================
interface IncidentCenterProps {
  activeIncidents: Incident[];
  onGenerateBroadcast: (id: string) => void;
}

export const IncidentCenter: React.FC<IncidentCenterProps> = ({
  activeIncidents,
  onGenerateBroadcast
}) => {
  // Map appropriate icons and severities
  const getIncidentIcon = (title: string, _severity?: string) => {
    const t = title.toLowerCase();
    if (t.includes('medical') || t.includes('heat') || t.includes('injur')) return <Heart className="h-4.5 w-4.5 text-red-400" />;
    if (t.includes('fire') || t.includes('smoke')) return <Flame className="h-4.5 w-4.5 text-orange-400" />;
    if (t.includes('weather') || t.includes('rain') || t.includes('lightn')) return <Cloud className="h-4.5 w-4.5 text-sky-400" />;
    if (t.includes('lost') || t.includes('child')) return <Users className="h-4.5 w-4.5 text-blue-400" />;
    if (t.includes('crowd') || t.includes('surge') || t.includes('bottleneck') || t.includes('congest')) return <Activity className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
    return <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" />;
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/15 border-red-500/35 text-red-400';
      case 'HIGH': return 'bg-orange-500/15 border-orange-500/35 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/15 border-amber-500/35 text-amber-300';
      default: return 'bg-blue-500/15 border-blue-500/35 text-blue-300';
    }
  };

  const getAssignedTeam = (zoneId: string, title: string) => {
    const t = title.toLowerCase();
    if (t.includes('medical')) return `Medical Dispatch Post ${zoneId.slice(0, 2)}-1`;
    if (t.includes('fire')) return `Fire & Life Safety Unit ${zoneId.slice(0, 2)}`;
    return `Security Tactical Squad ${zoneId.slice(0, 3)}-Beta`;
  };

  const getPlaybookRecommendation = (title: string, zoneId: string) => {
    const t = title.toLowerCase();
    if (t.includes('gate') || t.includes('congestion') || t.includes('bottleneck')) {
      return `Deploy wayfinding volunteers to bypass corridor. Open auxiliary turnstiles and adjust routing signage in ${zoneId}.`;
    }
    if (t.includes('medical')) {
      return `Dispatch immediate medical responders to coordinates in ${zoneId}. Coordinate with stadium control for emergency vehicle clearing.`;
    }
    return `Establish perimeter control, adjust sector exit gates, and deploy secondary support teams immediately.`;
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md flex flex-col" aria-label="Incident Management Deck">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Live Incident &amp; Dispatch Desk</h2>
        </div>
        <StatusBadge label={String(activeIncidents.length)} tone={activeIncidents.length > 0 ? 'danger' : 'success'} />
      </div>

      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {activeIncidents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center text-xs text-slate-400">
            <span className="block text-emerald-400 font-extrabold text-sm mb-1.5">✓ No active safety alerts</span>
            All stadium sectors normal. Crowd flow and security patrols report 100% nominal.
          </div>
        ) : (
          activeIncidents.map(inc => (
            <div key={inc.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4.5 space-y-3 transition duration-200 hover:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-rose-500/[0.02] to-transparent pointer-events-none" />
              
              <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
                    {getIncidentIcon(inc.title, inc.severity)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white leading-tight">{inc.title}</h3>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">REF_ID: {inc.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 text-[8px] font-bold font-mono tracking-wider border ${getSeverityBadgeClass(inc.severity)}`}>
                  {inc.severity}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{inc.description}</p>

              {/* Dynamic Dispatch details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/30 border border-white/[0.02] p-2.5 rounded-xl text-[10px]">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Sector Assigned</span>
                  <span className="text-slate-300 font-mono font-bold mt-0.5">{inc.zoneId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Assigned Unit</span>
                  <span className="text-indigo-400 font-semibold mt-0.5">{getAssignedTeam(inc.zoneId, inc.title)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Dispatch Posture</span>
                  <span className="text-rose-400 font-semibold mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    LIVE_RESPONSE
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Report Timestamp</span>
                  <span className="text-slate-400 font-mono mt-0.5">{inc.timestamp || '20:12:04 UTC'}</span>
                </div>
              </div>

              {/* Playbook Recommendation */}
              <div className="text-[11px] bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI Recommended Playbook
                </span>
                <p className="text-slate-300 leading-relaxed text-left">{getPlaybookRecommendation(inc.title, inc.zoneId)}</p>
              </div>

              <button
                onClick={() => onGenerateBroadcast(inc.id)}
                className="w-full rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-200 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                aria-label="Generate broadcast layout"
              >
                <span>🗣️</span>
                Generate Public Announcement Layout
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// ==========================================
// 4. TACTICAL PANEL Component
// ==========================================
interface TacticalPanelProps {
  decisions: OperationalDecision[];
  avgRiskScore: number;
  onGenerateBroadcast: (id: string) => void;
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  decisions,
  avgRiskScore,
  onGenerateBroadcast
}) => {
  const [decisionStates, setDecisionStates] = React.useState<Record<string, {
    status: 'PENDING' | 'APPROVED' | 'DISMISSED' | 'MODIFIED';
    actions: string[];
    resources: {
      medicalTeam?: string;
      securityUnit?: string;
      volunteerGroup?: string;
      equipment?: string;
      emergencyVehicle?: string;
    };
  }>>({});

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempActions, setTempActions] = React.useState<string[]>([]);
  const [tempResources, setTempResources] = React.useState<any>({});

  const handleApprove = (id: string) => {
    setDecisionStates(prev => {
      const dec = decisions.find(d => d.id === id);
      const current = prev[id] || {
        status: 'PENDING',
        actions: dec?.recommendedActions || [],
        resources: dec?.resourcesSuggested || {}
      };
      return {
        ...prev,
        [id]: {
          ...current,
          status: 'APPROVED'
        }
      };
    });
  };

  const handleDismiss = (id: string) => {
    setDecisionStates(prev => {
      const dec = decisions.find(d => d.id === id);
      const current = prev[id] || {
        status: 'PENDING',
        actions: dec?.recommendedActions || [],
        resources: dec?.resourcesSuggested || {}
      };
      return {
        ...prev,
        [id]: {
          ...current,
          status: 'DISMISSED'
        }
      };
    });
  };

  const startModify = (dec: OperationalDecision) => {
    const currentState = decisionStates[dec.id] || {
      status: 'PENDING',
      actions: dec.recommendedActions,
      resources: dec.resourcesSuggested || {}
    };
    setEditingId(dec.id);
    setTempActions([...currentState.actions]);
    setTempResources({ ...currentState.resources });
  };

  const saveModify = (id: string) => {
    setDecisionStates(prev => ({
      ...prev,
      [id]: {
        status: 'APPROVED',
        actions: tempActions,
        resources: tempResources
      }
    }));
    setEditingId(null);
  };

  const cancelModify = () => {
    setEditingId(null);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md flex flex-col" aria-label="Tactical Operations Deck">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">AI Decision Support Engine</h2>
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Mean Risk Score: {avgRiskScore}/100</p>
          </div>
        </div>
        <StatusBadge label={`${decisions.length} ACTIVE`} tone={decisions.length > 0 ? "warning" : "success"} />
      </div>

      <div className="space-y-5 flex-1">
        {decisions.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center text-xs text-slate-400">
            No active tactical decisions. System running in fully synchronized nominal state.
          </div>
        ) : (
          decisions.map(dec => {
            const stateRecord = decisionStates[dec.id];
            const currentStatus = stateRecord?.status || 'PENDING';
            const displayActions = stateRecord?.actions || dec.recommendedActions;
            const displayResources = stateRecord?.resources || dec.resourcesSuggested || {};

            const severityClass = 
              dec.priority === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' :
              dec.priority === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
              dec.priority === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-blue-500/10 border-blue-500/20 text-blue-300';

            const riskMeterColor = 
              (dec.riskScore || 50) >= 80 ? 'bg-red-500' :
              (dec.riskScore || 50) >= 60 ? 'bg-orange-500' :
              (dec.riskScore || 50) >= 35 ? 'bg-amber-500' :
              'bg-emerald-500';

            return (
              <div key={dec.id} className="rounded-2xl border border-slate-800 bg-slate-950/85 p-5 space-y-4 transition duration-200 hover:border-slate-700/80 relative overflow-hidden">
                {/* Visual glow element */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-500/[0.02] to-transparent pointer-events-none" />

                {/* Card Title & Badges Header */}
                <div className="space-y-2 border-b border-white/5 pb-3 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-500/30 text-[8px] font-mono font-bold tracking-widest text-indigo-300 animate-pulse">
                      🔮 AI DIRECTIVE SUITE
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        CONFIDENCE:
                      </span>
                      <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-950/60 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                        {dec.confidenceScore || 94}%
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xs font-black text-white leading-tight mt-1">{dec.title}</h3>
                </div>

                {/* Situation Summary Statement */}
                {dec.situationSummary && (
                  <div className="text-left">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[8px] block">Situation Summary</span>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed italic mt-0.5">"{dec.situationSummary}"</p>
                  </div>
                )}

                {/* Analytical Parameters Row */}
                <div className="grid grid-cols-3 gap-2 text-left bg-slate-900/25 border border-white/[0.03] p-3 rounded-2xl">
                  <div>
                    <span className="block text-[8px] uppercase font-extrabold text-slate-500">Risk Severity</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${severityClass}`}>
                        {dec.priority}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-extrabold text-slate-500">Resolution Est.</span>
                    <span className="text-xs text-white font-mono font-bold mt-0.5 block">{dec.estimatedResolutionTime || "15 mins"}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-extrabold text-slate-500">Affected Sectors</span>
                    <span className="text-xs text-indigo-300 font-black font-mono truncate block mt-0.5" title={dec.affectedLocations.join(', ')}>
                      {dec.affectedLocations.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Risk score range slider display */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-extrabold text-slate-500 uppercase tracking-widest">
                    <span>AI Risk Assessment Score</span>
                    <span className="font-mono text-slate-300 text-[10px]">{dec.riskScore || 50}/100</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${riskMeterColor} rounded-full`} style={{ width: `${dec.riskScore || 50}%` }} />
                  </div>
                </div>

                {/* Smart recommendations dispatcher flow */}
                <div className="space-y-2.5 pt-1.5 text-left">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[8px] block">
                    AI Smart Recommendation Playbook:
                  </span>
                  <div className="relative pl-4 border-l-2 border-indigo-500/20 space-y-3 py-1">
                    {displayActions.map((act, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-slate-950 shadow-sm transition group-hover:scale-125" />
                        <p className="text-xs text-slate-200 leading-normal font-medium">{act}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Suggestions Box */}
                <div className="bg-indigo-950/15 border border-indigo-500/10 p-3 rounded-2xl space-y-2 text-left">
                  <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[8px] block">
                    🛡️ AI Recommended Resource Assignments:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {displayResources.medicalTeam && (
                      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                        <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Medical Team</span>
                          <span className="text-white font-mono font-bold truncate block">{displayResources.medicalTeam}</span>
                        </div>
                      </div>
                    )}
                    {displayResources.securityUnit && (
                      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                        <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Security Unit</span>
                          <span className="text-white font-mono font-bold truncate block">{displayResources.securityUnit}</span>
                        </div>
                      </div>
                    )}
                    {displayResources.volunteerGroup && (
                      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                        <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Volunteer Group</span>
                          <span className="text-white font-mono font-bold truncate block">{displayResources.volunteerGroup}</span>
                        </div>
                      </div>
                    )}
                    {displayResources.emergencyVehicle && (
                      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                        <Truck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Vehicle Assigned</span>
                          <span className="text-white font-mono font-bold truncate block">{displayResources.emergencyVehicle}</span>
                        </div>
                      </div>
                    )}
                    {displayResources.equipment && (
                      <div className="col-span-2 flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                        <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <div className="truncate w-full">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Required Equipment</span>
                          <span className="text-white font-semibold truncate block">{displayResources.equipment}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Justification (the "WHY") */}
                {dec.explanation && (
                  <div className="bg-slate-900/50 border border-slate-850 p-3.5 rounded-2xl text-[11px] text-left leading-relaxed">
                    <span className="font-extrabold text-amber-400 uppercase tracking-widest text-[8px] block mb-1">
                      💡 AI Logic Explanation:
                    </span>
                    <span className="text-slate-300 font-sans">{dec.explanation}</span>
                  </div>
                )}

                {/* Interactive Inline Modify Editor */}
                {editingId === dec.id && (
                  <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4.5 space-y-4 text-left animate-fade-in-up">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <Settings className="h-4 w-4 animate-spin" /> Customizing Playbook Directive
                      </span>
                      <button onClick={cancelModify} className="text-[10px] text-slate-400 hover:text-white">Cancel</button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Edit Playbook Recommendations</span>
                      {tempActions.map((action, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={action}
                            onChange={(e) => {
                              const updated = [...tempActions];
                              updated[idx] = e.target.value;
                              setTempActions(updated);
                            }}
                            className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setTempActions(tempActions.filter((_, i) => i !== idx));
                            }}
                            className="text-red-400 hover:text-red-300 p-1 bg-red-950/20 border border-red-900/20 rounded-lg cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setTempActions([...tempActions, "New playbook action step..."])}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                      >
                        + Add Custom Playbook Step
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/5 pt-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-500">Medical Team</span>
                        <input
                          type="text"
                          value={tempResources.medicalTeam || ""}
                          onChange={(e) => setTempResources({ ...tempResources, medicalTeam: e.target.value })}
                          placeholder="e.g. Medical Team 2"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-500">Security Unit</span>
                        <input
                          type="text"
                          value={tempResources.securityUnit || ""}
                          onChange={(e) => setTempResources({ ...tempResources, securityUnit: e.target.value })}
                          placeholder="e.g. Security Unit Alpha"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2">
                        <span className="text-[9px] font-extrabold uppercase text-slate-500">Equipment</span>
                        <input
                          type="text"
                          value={tempResources.equipment || ""}
                          onChange={(e) => setTempResources({ ...tempResources, equipment: e.target.value })}
                          placeholder="e.g. Trauma kit, barriers"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveModify(dec.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow cursor-pointer text-center"
                      >
                        ✓ Save &amp; Dispatch Directive
                      </button>
                      <button
                        onClick={cancelModify}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Controls Footer */}
                {currentStatus === 'PENDING' && !editingId && (
                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleApprove(dec.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-xl text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-950/20"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3px]" /> Approve
                    </button>
                    <button
                      onClick={() => startModify(dec)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-amber-300 font-bold py-2 rounded-xl text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Modify
                    </button>
                    <button
                      onClick={() => handleDismiss(dec.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 py-2 rounded-xl text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5px]" /> Dismiss
                    </button>
                  </div>
                )}

                {/* State Confirmation Ribbons */}
                {currentStatus === 'APPROVED' && (
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-3 text-emerald-400 text-xs font-black text-left animate-fade-in-up">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-extrabold text-[11px] uppercase tracking-wide">✓ Directive Dispatched &amp; Active</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Assigned responders and volunteers have received secure radio/push instructions.</p>
                    </div>
                  </div>
                )}

                {currentStatus === 'DISMISSED' && (
                  <div className="flex items-center gap-2 bg-slate-950/30 border border-white/5 rounded-2xl p-3 text-slate-500 text-xs font-medium text-left">
                    <X className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <div>
                      <p className="font-bold text-[11px] uppercase tracking-wide">✖ Directive Dismissed by Operator</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">Removed from primary queue. No resources deployed.</p>
                    </div>
                  </div>
                )}

                {/* Announcement Button Integration (Always kept) */}
                <button
                  onClick={() => onGenerateBroadcast(dec.id)}
                  className="w-full rounded-xl bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/30 hover:border-blue-800/60 text-blue-300 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  aria-label={`Draft Announcement for ${dec.title}`}
                >
                  <span>🗣️</span>
                  Draft Public Announcement Layout
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

// ==========================================
// 5. RESOURCE DEPLOYMENT Component
// ==========================================
interface ResourceDeploymentProps {
  state: StadiumState;
}

export const ResourceDeployment: React.FC<ResourceDeploymentProps> = ({ state }) => {
  // Derive robust locations and allocations dynamically based on state zones and tickCount
  const getResourceStatus = (idx: number, _type?: string) => {
    const isIncidentZone = state.incidents.some(i => i.active && i.zoneId === state.zones[idx % state.zones.length]?.id);
    if (isIncidentZone) {
      return { status: 'DISPATCHED', color: 'bg-red-500/10 border-red-500/30 text-red-400', desc: `Assigned: Active safety incident response` };
    }
    const availStates = ['AVAILABLE', 'ON PATROL', 'STANDBY', 'EN ROUTE'];
    const currentAvail = availStates[(idx + state.tickCount) % availStates.length];
    
    switch (currentAvail) {
      case 'AVAILABLE': return { status: 'AVAILABLE', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', desc: 'Ready for dynamic incident dispatch' };
      case 'ON PATROL': return { status: 'ON PATROL', color: 'bg-blue-500/15 border-blue-500/30 text-blue-300', desc: 'Conducting routine physical sweep' };
      case 'STANDBY': return { status: 'STANDBY', color: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300', desc: 'At local transit assembly post' };
      default: return { status: 'EN ROUTE', color: 'bg-amber-500/15 border-amber-500/30 text-amber-300', desc: 'Rerouting to cover inflow gateway' };
    }
  };

  const resourceCategories = [
    { name: 'Medical Dispatch Team Alpha', type: 'MEDICAL', icon: Heart, zone: 'PLAZA_NORTH' },
    { name: 'Medical Dispatch Team Beta', type: 'MEDICAL', icon: Heart, zone: 'CONCOURSE_LOWER' },
    { name: 'Security Tactical Unit Echo', type: 'SECURITY', icon: Shield, zone: 'METRO_STATION' },
    { name: 'Security Tactical Unit Foxtrot', type: 'SECURITY', icon: Shield, zone: 'EMERGENCY_CORRIDOR' },
    { name: 'Wayfinding Volunteers Squad 1', type: 'VOLUNTEER', icon: Users, zone: 'PLAZA_SOUTH' },
    { name: 'Wayfinding Volunteers Squad 2', type: 'VOLUNTEER', icon: Users, zone: 'BUS_STATION' },
    { name: 'Metropolitan Police Detail 12', type: 'POLICE', icon: Compass, zone: 'PLAZA_NORTH' },
    { name: 'Stadium Maintenance Crew Charlie', type: 'MAINTENANCE', icon: Wrench, zone: 'FOOD_COURT_A' },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Field Resource Allocation Board">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4.5 w-4.5 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Field Resource deployment center</h2>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Telemetry Tracked</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resourceCategories.map((res, idx) => {
          const detail = getResourceStatus(idx, res.type);
          const zoneDetails = state.zones.find(z => z.id === res.zone);
          
          return (
            <div key={idx} className="rounded-2xl border border-white/5 bg-slate-950/75 p-4 flex flex-col justify-between hover:border-slate-800 transition duration-200">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-white/[0.02] pb-2">
                  <div className="flex items-center gap-1.5">
                    <res.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-[11px] font-black text-white truncate max-w-[130px]">{res.name}</span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${detail.color}`}>
                    {detail.status}
                  </span>
                </div>

                <div className="space-y-2 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Assigned Sector:</span>
                    <span className="text-slate-200 font-mono font-semibold">{zoneDetails?.name || res.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sect. Risk Score:</span>
                    <span className={`font-mono font-bold ${
                      (zoneDetails?.riskScore || 0) >= 60 ? 'text-rose-400' : 'text-slate-300'
                    }`}>{zoneDetails?.riskScore || 12}/100</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.02] text-[10px] text-slate-300 italic">
                {detail.desc}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ==========================================
// 6. LIVE ACTIVITY TIMELINE Component
// ==========================================
interface LiveActivityTimelineProps {
  state: StadiumState;
}

export const LiveActivityTimeline: React.FC<LiveActivityTimelineProps> = ({ state }) => {
  // Derive elegant operational log milestones from active incidents & states
  const getTimelineMilestones = () => {
    const match = state.match;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // Pre-seed some default historic milestones that match the current match phase
    const milestones = [
      {
        id: "m_kickoff",
        minute: "00'",
        time: "20:00:00",
        event: "⚽ Match Kickoff",
        location: "Pitch Central",
        severity: "LOW",
        status: "RESOLVED",
        desc: "Match started successfully. Ball in play."
      },
      {
        id: "m_gates_closed",
        minute: "Pre-Match",
        time: "19:45:00",
        event: "🎫 Gates Closed / Lock-in",
        location: "Plaza Entrances",
        severity: "LOW",
        status: "RESOLVED",
        desc: "Security turnstiles locked in for kickoff phase."
      },
      {
        id: "m_scanners",
        minute: "Pre-Match",
        time: "19:30:00",
        event: "📶 Gate Scanners Handshake",
        location: "All Gates",
        severity: "LOW",
        status: "RESOLVED",
        desc: "Turnstile readers fully synchronized with centralized MetLife cloud."
      }
    ];

    // 1. Add active/historical incidents from stadiumState
    state.incidents.forEach((inc, idx) => {
      // Determine minute
      let minDisplay = "";
      if (state.matchPhase === 'PRE_MATCH') {
        minDisplay = "Pre-Match";
      } else if (state.matchPhase === 'EXIT_SURGE') {
        minDisplay = "Egress";
      } else {
        // Estimate minute based on index and current minute
        const estMin = Math.max(1, Math.min(match.minute, 8 + idx * 7));
        minDisplay = `${estMin}'`;
      }

      // Find zone name
      const zoneName = state.zones.find(z => z.id === inc.zoneId)?.name || inc.zoneId;

      milestones.unshift({
        id: inc.id || `inc_${idx}`,
        minute: minDisplay,
        time: inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : nowStr,
        event: inc.title,
        location: zoneName,
        severity: inc.severity,
        status: inc.active ? "ACTIVE" : "RESOLVED",
        desc: inc.description
      });
    });

    // Sort by time/minute descending (newest first)
    return milestones.slice(0, 7);
  };

  const timeline = getTimelineMilestones();

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 animate-pulse';
    }
    return 'bg-slate-800 text-slate-400 border border-white/5';
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Real-time Operations log">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Live Match &amp; Operations Command Timeline</h2>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          TELEMETRY SYNCED
        </span>
      </div>

      {/* Grid-based tabular layout representing professional stadium operations */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
              <th className="py-2.5 px-3">Minute / Time</th>
              <th className="py-2.5 px-3">Stadium Event</th>
              <th className="py-2.5 px-3">Location Sector</th>
              <th className="py-2.5 px-3 text-center">Severity</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {timeline.map((item) => (
              <tr key={item.id} className="text-xs hover:bg-white/[0.01] transition duration-150">
                {/* Minute / Time */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono font-black text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded text-center shrink-0 min-w-[50px]">
                      {item.minute}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 text-center">{item.time}</span>
                  </div>
                </td>

                {/* Event Name & Description */}
                <td className="py-3 px-3 min-w-[200px]">
                  <div>
                    <span className="font-extrabold text-white text-xs block">{item.event}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal max-w-sm">{item.desc}</span>
                  </div>
                </td>

                {/* Location */}
                <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-300">
                  {item.location}
                </td>

                {/* Severity Badge */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className={`text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-md ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] text-slate-500 italic text-center">
        Showing last 7 sequential match developments • Time-correlated automatically via central AI Hub.
      </p>
    </section>
  );
};
