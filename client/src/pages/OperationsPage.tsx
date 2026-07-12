import React, { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../config';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Play, 
  RotateCcw, 
  Radio, 
  Clock, 
  Terminal,
  Send,
  Bot,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSkeleton, KpiCardSkeleton, CopilotSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAssistant } from '../context/AssistantContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  StadiumState,
  OperationalDecision,
  CrowdInsight,
  CopilotResponse,
} from '../types';

export function OperationsPage() {
  const [state, setState] = useState<StadiumState | null>(null);
  const [insights, setInsights] = useState<CrowdInsight[]>([]);
  const [decisions, setDecisions] = useState<OperationalDecision[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('PLAZA_NORTH');
  
  // Copilot State
  const [briefText, setBriefText] = useState<string>('Click "Generate Briefing" to analyze stadium operations.');
  const [briefingLoading, setBriefingLoading] = useState<boolean>(false);
  const [briefAiPowered, setBriefAiPowered] = useState<boolean>(true);
  
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'copilot'; text: string; aiPowered: boolean }[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Broadcast Modal State
  const [broadcastText, setBroadcastText] = useState<string | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState<boolean>(false);
  const [broadcastAiPowered, setBroadcastAiPowered] = useState<boolean>(true);
  const modalCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Live Ticking Clock State
  const [timeString, setTimeString] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const { setSelectedZoneId: setGlobalZoneId, setStadiumState: setGlobalStadiumState } = useAssistant();

  useEffect(() => {
    setGlobalZoneId(selectedZoneId);
  }, [selectedZoneId, setGlobalZoneId]);

  useEffect(() => {
    setGlobalStadiumState(state);
  }, [state, setGlobalStadiumState]);

  // Fetch all live data
  const fetchData = async () => {
    try {
      const stateRes = await fetch(`${API_BASE}/api/stadium/state}`);
      const stateData = await stateRes.json();
      setState(stateData);

      const insightsRes = await fetch(`${API_BASE}/api/operations/insights`);
      const insightsData = await insightsRes.json();
      setInsights(insightsData);

      const decisionsRes = await fetch(`${API_BASE}/api/operations/decisions`);
      const decisionsData = await decisionsRes.json();
      setDecisions(decisionsData);
    } catch (err) {
      console.error('Error fetching operations data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Simulation handlers
  const handleAdvanceTick = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/advance`, { method: 'POST' });
      const data = await res.json();
      setState(data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
      const data = await res.json();
      setState(data);
      setChatHistory([]);
      setBriefText('Click "Generate Briefing" to analyze stadium operations.');
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhaseChange = async (phase: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      });
      const data = await res.json();
      setState(data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScenario = async (scenario: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      setState(data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // AI Brief handler
  const handleGenerateBrief = async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'OPERATIONS', selectedZoneId }),
      });
      const data: CopilotResponse = await res.json();
      setBriefText(data.text);
      setBriefAiPowered(data.aiPowered);
    } catch (err) {
      console.error(err);
      setBriefText('Failed to generate operational brief.');
    } finally {
      setBriefingLoading(false);
    }
  };

  // AI Chat assist handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, aiPowered: true }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'OPERATIONS', userPrompt: userMsg, selectedZoneId }),
      });
      const data: CopilotResponse = await res.json();
      setChatHistory(prev => [
        ...prev,
        { sender: 'copilot', text: data.text, aiPowered: data.aiPowered },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'copilot', text: 'Error contacting operations assistant.', aiPowered: false },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // AI Broadcast handler
  const handleGenerateBroadcast = async (decisionId: string) => {
    setBroadcastLoading(true);
    setBroadcastText('');

    try {
      const res = await fetch(`${API_BASE}/api/ai/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });
      const data: CopilotResponse = await res.json();
      setBroadcastText(data.text);
      setBroadcastAiPowered(data.aiPowered);
      setTimeout(() => modalCloseBtnRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      setBroadcastText('Failed to generate PA announcement.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const closeBroadcastModal = () => {
    setBroadcastText(null);
  };

  if (!state) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8 flex flex-col gap-6">
        <div className="flex items-center">
          <BackLink label="Back to Platform Launcher" />
        </div>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 animate-pulse">
          <div>
            <h1 className="fluid-h1 font-black tracking-tight text-white font-sans">
              Command Operations
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Synchronizing stadium operational data...
            </p>
          </div>
        </header>

        {/* KPI Overview Skeleton */}
        <section className="responsive-kpi-grid gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </section>

        {/* Main Grid Content */}
        <div className="responsive-dashboard-grid gap-6">
          <section className="flex flex-col gap-6 lg:col-span-9">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md">
              <div className="h-6 w-48 rounded bg-slate-800 mb-4 animate-pulse" />
              <div className="h-96 rounded-2xl bg-slate-950 animate-pulse flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-6 lg:col-span-3">
            <CopilotSkeleton />
          </section>
        </div>
      </div>
    );
  }

  const selectedZone = state.zones.find(z => z.id === selectedZoneId);
  const selectedInsight = insights.find(i => i.zoneId === selectedZoneId);
  const activeIncidents = Array.from(
    new Map(state.incidents.filter(i => i.active).map(incident => [incident.id, incident])).values(),
  );
  const avgOccupancyPct = Math.round(
    state.zones.reduce((total, zone) => total + Math.round((zone.occupancy / zone.capacity) * 100), 0) /
      state.zones.length,
  );

  const getRiskColorClass = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-500 fill-red-500/10 stroke-red-500';
    if (riskScore >= 60) return 'text-orange-500 fill-orange-500/10 stroke-orange-500';
    if (riskScore >= 35) return 'text-amber-500 fill-amber-500/10 stroke-amber-500';
    return 'text-emerald-500 fill-emerald-500/10 stroke-emerald-500';
  };

  const getRiskBgClass = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-950/25 border-red-900/40 text-red-100';
    if (riskScore >= 60) return 'bg-orange-950/25 border-orange-900/40 text-orange-100';
    if (riskScore >= 35) return 'bg-amber-950/25 border-amber-900/40 text-amber-100';
    return 'bg-emerald-950/15 border-emerald-900/30 text-emerald-100';
  };

  // Telemetry and analytical calculations for the 6 KPIs
  const totalOccupancy = state.zones.reduce((sum, z) => sum + z.occupancy, 0);
  const totalCapacity = state.zones.reduce((sum, z) => sum + z.capacity, 0);
  const occupancyStr = `${totalOccupancy.toLocaleString()} / ${totalCapacity.toLocaleString()}`;

  const avgRiskScore = state.zones.length > 0
    ? Math.round(state.zones.reduce((sum, z) => sum + z.riskScore, 0) / state.zones.length)
    : 0;
  const riskStatus = avgRiskScore >= 65 ? 'Critical' : avgRiskScore >= 40 ? 'Elevated' : 'Nominal';

  const metroMin = Math.round(state.transport.metroQueueSeconds / 60);
  const busMin = Math.round(state.transport.busQueueSeconds / 60);
  const taxiMin = Math.round(state.transport.taxiQueueSeconds / 60);

  const avgGateQueueSec = state.gates.length > 0
    ? Math.round(state.gates.reduce((total, g) => total + g.avgQueueSeconds, 0) / state.gates.length)
    : 0;
  const maxGateQueueSec = state.gates.length > 0 ? Math.max(...state.gates.map(g => g.avgQueueSeconds)) : 0;

  const activeVolunteersCount = 142 + (state.tickCount * 4) % 30;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8 flex flex-col gap-6">
      {/* Back Link */}
      <div className="flex items-center">
        <BackLink label="Back to Platform Launcher" />
      </div>

      {/* Premium Command Header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                STADIUM OPERATIONS
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Live</span>
            </div>
            
            <h1 className="mt-2.5 fluid-h1 font-black tracking-tight text-white font-sans">
              ArenaFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Command Center</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
              Enterprise-grade intelligence for tournament operations, stadium transit networks, and volunteer dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            {/* Live Clock */}
            <div className="flex flex-col pr-4 border-r border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Clock</span>
              <span className="text-base font-black font-mono text-white tracking-wider mt-0.5">{timeString}</span>
            </div>

            {/* Match Status */}
            <div className="flex flex-col pr-4 border-r border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match Phase</span>
              <div className="flex items-center gap-1.5 mt-1">
                <StatusBadge label={state.matchPhase.replace(/_/g, ' ')} tone={state.matchPhase === 'MATCH_ACTIVE' ? 'warning' : 'neutral'} />
                <span className="text-xs font-bold font-mono text-slate-400">T+{state.tickCount}</span>
              </div>
            </div>

            {/* Stadium Status */}
            <div className="flex flex-col pr-4 border-r border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stadium Posture</span>
              <span className={`text-xs font-black mt-1.5 flex items-center gap-1.5 ${
                activeIncidents.length > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  activeIncidents.length > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                }`} />
                {activeIncidents.length > 0 ? `${activeIncidents.length} INCIDENTS` : 'NOMINAL'}
              </span>
            </div>

            {/* AI Status */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">GenAI Copilot</span>
              <span className="text-xs font-black text-indigo-400 mt-1.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Simulator Controls & Scenario Injections Card */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Simulator and Match State Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Clock className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Simulator Controls</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAdvanceTick}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                aria-label="Advance simulation one tick"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Advance Tick
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                aria-label="Reset simulation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Sim
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                <label htmlFor="match-phase" className="text-xs font-semibold text-slate-400 whitespace-nowrap">Phase:</label>
                <select
                  id="match-phase"
                  value={state.matchPhase}
                  onChange={(e) => handlePhaseChange(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="PRE_MATCH">Pre-Match</option>
                  <option value="ENTRY_SURGE">Entry Surge</option>
                  <option value="MATCH_ACTIVE">Match Active</option>
                  <option value="HALF_TIME">Half Time</option>
                  <option value="MATCH_END">Match End</option>
                  <option value="EXIT_SURGE">Exit Surge</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scenario Injections */}
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Radio className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Inject Scenarios</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'GATE_CONGESTION', label: 'Gate Congestion', style: 'bg-rose-950/10 border-rose-900/40 text-rose-300 hover:bg-rose-950/30 hover:border-rose-850' },
                { key: 'MEDICAL_INCIDENT', label: 'Medical Incident', style: 'bg-amber-950/10 border-amber-900/40 text-amber-300 hover:bg-amber-950/30 hover:border-amber-850' },
                { key: 'ROUTE_CLOSURE', label: 'Route Closure', style: 'bg-slate-950/30 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700' },
                { key: 'EXIT_SURGE', label: 'Exit Surge', style: 'bg-indigo-950/10 border-indigo-900/40 text-indigo-300 hover:bg-indigo-950/30 hover:border-indigo-850' }
              ].map(sc => (
                <button
                  key={sc.key}
                  onClick={() => handleTriggerScenario(sc.key)}
                  className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-all text-center cursor-pointer ${sc.style}`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Match Operations Timeline */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Operations Timeline">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Match Operations Timeline</h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Current: <strong className="text-blue-400">{state.matchPhase.replace(/_/g, ' ')}</strong>
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'PRE_MATCH', name: 'Pre-Match', detail: 'Plazas Open', icon: Users },
            { id: 'ENTRY_SURGE', name: 'Entry Surge', detail: 'Peak Inflow', icon: ShieldAlert },
            { id: 'MATCH_ACTIVE', name: 'Match Active', detail: 'In-Bowl Focus', icon: Activity },
            { id: 'HALF_TIME', name: 'Half Time', detail: 'F&B Concourse', icon: Users },
            { id: 'MATCH_END', name: 'Match End', detail: 'Egress Preps', icon: AlertTriangle },
            { id: 'EXIT_SURGE', name: 'Exit Surge', detail: 'Plazas Egress', icon: ShieldAlert },
          ].map((p) => {
            const isCurrent = state.matchPhase === p.id;
            const phaseOrder = ['PRE_MATCH', 'ENTRY_SURGE', 'MATCH_ACTIVE', 'HALF_TIME', 'MATCH_END', 'EXIT_SURGE'];
            const currentIdx = phaseOrder.indexOf(state.matchPhase);
            const isCompleted = phaseOrder.indexOf(p.id) < currentIdx;

            return (
              <button
                key={p.id}
                onClick={() => handlePhaseChange(p.id)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group focus:outline-none cursor-pointer ${
                  isCurrent ? 'bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)] scale-[1.02]' :
                  isCompleted ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400' :
                  'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/20'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border mb-1.5 transition-all duration-300 ${
                  isCurrent ? 'bg-blue-600 border-white text-white' :
                  isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  'bg-slate-950 border-slate-800 text-slate-500 group-hover:border-slate-700'
                }`}>
                  <p.icon className="h-3.5 w-3.5" />
                </div>

                <div className="text-center min-w-0">
                  <span className={`block text-xs font-bold tracking-tight transition-colors ${
                    isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'
                  }`}>
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{p.detail}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* KPI Overview Grid with exactly 6 required responsive cards */}
      <section aria-label="Operations Overview Grid">
        <div className="responsive-kpi-grid gap-4">
          <KpiCard
            label="Occupancy"
            value={`${avgOccupancyPct}%`}
            helper={occupancyStr}
            icon={Users}
            tone="default"
          />
          <KpiCard
            label="Risk Score"
            value={`${avgRiskScore}/100`}
            helper={`Status: ${riskStatus}`}
            icon={ShieldAlert}
            tone={avgRiskScore >= 65 ? 'danger' : avgRiskScore >= 35 ? 'warning' : 'success'}
          />
          <KpiCard
            label="Active Incidents"
            value={String(activeIncidents.length)}
            helper={activeIncidents.length > 0 ? 'Urgent dispatch team active' : 'All sectors normal'}
            icon={AlertTriangle}
            tone={activeIncidents.length > 0 ? 'danger' : 'success'}
          />
          <KpiCard
            label="Transport"
            value={`Metro: ${metroMin}m`}
            helper={`Bus: ${busMin}m | Taxi: ${taxiMin}m`}
            icon={Activity}
            tone="default"
          />
          <KpiCard
            label="Queue Times"
            value={`${Math.round(avgGateQueueSec / 60)}m avg`}
            helper={`Max wait: ${Math.round(maxGateQueueSec / 60)}m`}
            icon={Clock}
            tone={avgGateQueueSec > 180 ? 'warning' : 'default'}
          />
          <KpiCard
            label="Volunteers"
            value={String(activeVolunteersCount)}
            helper={`Covering ${state.zones.length} active sectors`}
            icon={Users}
            tone="success"
          />
        </div>
      </section>

      {activeIncidents.length > 0 ? (
        <AlertBanner
          title="Active Emergency Posture"
          message={`${activeIncidents.length} active incidents require direct dispatch attention. Check recommendations below.`}
          tone="danger"
        />
      ) : null}

      {/* Main Grid Content - Multi Column, One-Page Scroll */}
      <div className="responsive-dashboard-grid gap-6">
        
        {/* LEFT COLUMN: AI Command Brief & Operational Insights (Col 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* PRIMARY CARD: AI Command Brief */}
          <section className="relative overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-slate-900/50 to-indigo-950/20 p-6 shadow-xl backdrop-blur-md" aria-label="AI Command Briefing">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide">AI Command Brief</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time dynamic stadium telemetry briefing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!briefAiPowered && (
                  <span className="rounded-md bg-amber-950/40 border border-amber-900/40 text-amber-300 px-2.5 py-1 text-[9px] font-bold tracking-wide">
                    ⚠️ Offline Fallback
                  </span>
                )}
                <button
                  onClick={handleGenerateBrief}
                  disabled={briefingLoading}
                  className="rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 disabled:opacity-50 px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  aria-label="Refresh AI Briefing"
                >
                  <RotateCcw className="h-3 w-3" />
                  Refresh Briefing
                </button>
              </div>
            </div>

            {briefingLoading ? (
              <LoadingSkeleton lines={5} />
            ) : (
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-xs">
                  <AIResponseCard content={briefText} title="Operations AI Brief" />
                </div>

                {/* Dynamic Suggestions & Quick Actions */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-2.5">Dynamic Briefing Suggestions</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { text: "Check Metro Station risk factors", q: "What is the current risk and congestion status of the Metro Station?" },
                      { text: "Analyze active gate queue rates", q: "Show me a detailed breakdown of gate queue times and average wait rates." },
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatInput(s.q);
                        }}
                        className="flex items-center justify-between text-left rounded-xl bg-slate-950/40 hover:bg-indigo-950/20 border border-white/5 hover:border-indigo-500/30 p-3 text-[11px] text-slate-300 font-medium transition-all group cursor-pointer animate-fade-in"
                      >
                        <span className="truncate mr-2">{s.text}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Operational Insights Section (Map + Selected Sector Detail) */}
          <section className="flex flex-col gap-6" aria-label="Operational Insights">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4.5 w-4.5 text-blue-400" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Operational Insights Map</h2>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Sector Status Overlay
                </span>
              </div>
              
              {/* SVG Stadium Map */}
              <div className="mt-2 rounded-2xl border border-slate-800/80 bg-slate-950 p-4 shadow-inner flex flex-col items-center">
                <svg viewBox="0 0 420 300" className="h-auto w-full max-w-sm md:max-w-md" role="img" aria-labelledby="stadium-map-title">
                  <title id="stadium-map-title">Interactive Control Grid</title>
                  <defs>
                    <filter id="selectedGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path d="M105 55 C145 82 148 108 128 137" className="fill-none stroke-blue-500/20" strokeWidth="2" strokeDasharray="5 5" />
                  <path d="M315 55 C275 82 272 108 292 137" className="fill-none stroke-blue-500/20" strokeWidth="2" strokeDasharray="5 5" />
                  <path d="M122 250 C176 282 244 282 298 250" className="fill-none stroke-emerald-400/20" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Metro Plaza */}
                  <rect x="10" y="10" width="100" height="40" rx="6"
                    onClick={() => setSelectedZoneId('METRO_STATION')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'METRO_STATION' ? 'stroke-blue-400 ring-2' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'METRO_STATION')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'METRO_STATION' ? 'url(#selectedGlow)' : undefined} />
                  <text x="25" y="34" className="fill-white text-[9px] pointer-events-none font-bold font-sans">Metro Plaza</text>

                  {/* Bus Station */}
                  <rect x="310" y="10" width="100" height="40" rx="6"
                    onClick={() => setSelectedZoneId('BUS_STATION')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'BUS_STATION' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'BUS_STATION')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'BUS_STATION' ? 'url(#selectedGlow)' : undefined} />
                  <text x="325" y="34" className="fill-white text-[9px] pointer-events-none font-bold font-sans">Bus Terminal</text>

                  {/* Plaza North */}
                  <ellipse cx="100" cy="90" rx="40" ry="25"
                    onClick={() => setSelectedZoneId('PLAZA_NORTH')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'PLAZA_NORTH' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'PLAZA_NORTH')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'PLAZA_NORTH' ? 'url(#selectedGlow)' : undefined} />
                  <text x="75" y="93" className="fill-white text-[9px] pointer-events-none font-bold font-sans">Plaza North</text>

                  {/* Plaza South */}
                  <ellipse cx="320" cy="90" rx="40" ry="25"
                    onClick={() => setSelectedZoneId('PLAZA_SOUTH')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'PLAZA_SOUTH' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'PLAZA_SOUTH')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'PLAZA_SOUTH' ? 'url(#selectedGlow)' : undefined} />
                  <text x="295" y="93" className="fill-white text-[9px] pointer-events-none font-bold font-sans">Plaza South</text>

                  {/* Concourse Lower - Gates A/C */}
                  <rect x="75" y="130" width="50" height="20" rx="4"
                    onClick={() => setSelectedZoneId('CONCOURSE_LOWER')}
                    className={`cursor-pointer fill-slate-900 stroke-2 transition-all duration-200 hover:fill-slate-850 ${
                      selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : 'stroke-slate-800'
                    }`} />
                  <text x="82" y="142" className="fill-slate-300 text-[8px] pointer-events-none font-sans font-medium">Gates A/C</text>

                  {/* Concourse Lower - Gates B/D */}
                  <rect x="295" y="130" width="50" height="20" rx="4"
                    onClick={() => setSelectedZoneId('CONCOURSE_LOWER')}
                    className={`cursor-pointer fill-slate-900 stroke-2 transition-all duration-200 hover:fill-slate-850 ${
                      selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : 'stroke-slate-800'
                    }`} />
                  <text x="302" y="142" className="fill-slate-300 text-[8px] pointer-events-none font-sans font-medium">Gates B/D</text>

                  {/* Lower Concourse Ring */}
                  <rect x="120" y="160" width="180" height="80" rx="40"
                    onClick={() => setSelectedZoneId('CONCOURSE_LOWER')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'CONCOURSE_LOWER')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'CONCOURSE_LOWER' ? 'url(#selectedGlow)' : undefined} />
                  <text x="175" y="172" className="fill-white text-[9px] pointer-events-none font-bold font-sans">Lower Concourse Ring</text>

                  {/* Upper Concourse inside ring */}
                  <rect x="150" y="185" width="120" height="40" rx="20"
                    onClick={() => setSelectedZoneId('CONCOURSE_UPPER')}
                    className={`cursor-pointer stroke-2 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'CONCOURSE_UPPER' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'CONCOURSE_UPPER')?.riskScore || 0)}`}
                    filter={selectedZoneId === 'CONCOURSE_UPPER' ? 'url(#selectedGlow)' : undefined} />
                  <text x="178" y="197" className="fill-white text-[8px] pointer-events-none font-bold font-sans">Upper Concourse</text>

                  {/* north Lift */}
                  <circle cx="140" cy="180" r="10"
                    onClick={() => setSelectedZoneId('LIFT_NORTH')}
                    className={`cursor-pointer stroke-1 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'LIFT_NORTH' ? 'stroke-blue-400' : 'stroke-slate-700'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'LIFT_NORTH')?.riskScore || 0)}`} />
                  <text x="134" y="183" className="fill-white text-[7px] pointer-events-none font-mono">LFT</text>

                  {/* Food Court */}
                  <rect x="185" y="210" width="50" height="12" rx="3"
                    onClick={() => setSelectedZoneId('FOOD_COURT_A')}
                    className={`cursor-pointer stroke-1 transition-all duration-200 hover:opacity-90 ${
                      selectedZoneId === 'FOOD_COURT_A' ? 'stroke-blue-400' : 'stroke-slate-800'
                    } ${getRiskColorClass(state.zones.find(z => z.id === 'FOOD_COURT_A')?.riskScore || 0)}`} />
                  <text x="195" y="219" className="fill-white text-[7px] pointer-events-none font-sans font-medium">Food A</text>

                  {/* Indicators */}
                  <circle cx="282" cy="195" r="8" className="fill-blue-600/80 stroke-blue-300" />
                  <text x="275" y="198" className="fill-white text-[6px] pointer-events-none font-sans font-bold">MED</text>
                  <circle cx="164" cy="214" r="7" className="fill-amber-600/80 stroke-amber-200" />
                  <text x="158" y="217" className="fill-white text-[6px] pointer-events-none font-sans font-bold">WC</text>

                  {/* Emergency Route link */}
                  <line x1="100" y1="115" x2="150" y2="240" strokeWidth="4"
                    onClick={() => setSelectedZoneId('EMERGENCY_CORRIDOR')}
                    className={`cursor-pointer stroke-slate-700 transition-all duration-200 hover:stroke-blue-400 ${
                      selectedZoneId === 'EMERGENCY_CORRIDOR' ? 'stroke-blue-400' : ''
                    } ${state.incidents.some(i => i.zoneId === 'EMERGENCY_CORRIDOR' && i.active) ? 'stroke-rose-600' : ''}`} />
                  <text x="80" y="235" className="fill-slate-500 text-[8px] pointer-events-none font-sans font-bold">Emergency Route</text>
                </svg>
                
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3.5 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Stable</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Watch</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" /> High</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" /> Critical</span>
                </div>
              </div>
            </div>

            {/* Selected Zone Telemetry Panel */}
            {selectedZone && selectedInsight && (
              <div className={`rounded-3xl border p-5 shadow-xl transition-all duration-300 backdrop-blur-md ${getRiskBgClass(selectedZone.riskScore)}`} id="zone-details">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{selectedZone.name}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Sector ID: {selectedZoneId}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest shadow-md ${
                    selectedZone.attentionLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                    selectedZone.attentionLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                    selectedZone.attentionLevel === 'WATCH' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                  }`}>
                    {selectedZone.attentionLevel} Focus
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Score</p>
                    <p className="mt-1 text-base font-black font-mono text-white">{selectedZone.riskScore}<span className="text-xs font-normal text-slate-500">/100</span></p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy</p>
                    <div className="mt-1 text-xs font-black font-mono text-white">
                      {selectedZone.occupancy.toLocaleString()} 
                      <span className="text-[10px] font-medium text-slate-400 block mt-0.5">/ {selectedZone.capacity.toLocaleString()} ({selectedInsight.occupancyPct}%)</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Density Posture</p>
                    <p className="mt-1 text-xs font-extrabold text-blue-300">{selectedZone.crowdLevel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flow Trend</p>
                    <p className="mt-1 text-xs font-extrabold text-emerald-400">📈 {selectedZone.trend}</p>
                  </div>
                </div>

                {selectedInsight.reasons.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-3.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Anomaly Factors & Telemetry
                    </h4>
                    <ul className="mt-2 list-none text-xs text-slate-300 space-y-1.5 pl-0">
                      {selectedInsight.reasons.map((r, idx) => (
                        <li key={idx} className="flex gap-2 rounded-xl bg-slate-950/30 border border-white/5 px-2.5 py-2 leading-relaxed">
                          <span className="text-blue-400">▶</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Decisions, Active Alerts & Copilot Chat (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Tactical Decisions Panel (Directives) */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md flex flex-col" aria-label="Tactical Decisions and Directives">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Tactical Directives</h2>
              </div>
              <StatusBadge label={String(decisions.length)} tone="neutral" />
            </div>

            <div className="space-y-4 flex-1">
              {decisions.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-8 text-center text-xs text-slate-400">
                  All systems nominal. No active directives.
                </div>
              ) : (
                decisions.map(dec => (
                  <div key={dec.id} className="rounded-2xl border border-slate-800 bg-slate-950/85 p-4 space-y-3 transition duration-200 hover:border-slate-700">
                    <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                      <h3 className="text-xs font-black text-white leading-tight">{dec.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                        dec.priority === 'CRITICAL' ? 'bg-red-500/20 border border-red-500/30 text-red-200' : 'bg-orange-500/20 border border-orange-500/30 text-orange-200'
                      }`}>
                        {dec.priority}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5">
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Rule Trigger Facts:</p>
                      <ul className="list-none pl-0 space-y-1">
                        {dec.rationaleFacts.map((fact, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-300 leading-relaxed">
                            <span className="text-slate-500">·</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Playbook Directives:</p>
                      <ul className="list-none pl-0 space-y-1">
                        {dec.recommendedActions.map((act, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-200 font-medium leading-relaxed bg-slate-900/40 border border-white/5 rounded-xl px-2 py-1.5">
                            <span className="text-blue-400">✓</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleGenerateBroadcast(dec.id)}
                      className="mt-3.5 w-full rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-200 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/20 cursor-pointer"
                      aria-label={`Generate PA Broadcast for ${dec.title}`}
                    >
                      <span>🗣️</span>
                      Generate PA Broadcast Draft
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Active Field Alerts Segment */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Active Field Incident Alerts">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Active Field Alerts</h2>
              </div>
              <StatusBadge label={String(activeIncidents.length)} tone={activeIncidents.length > 0 ? 'danger' : 'success'} />
            </div>
            
            <div className="space-y-3">
              {activeIncidents.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6 text-center text-xs text-slate-400">
                  <span className="block text-emerald-400 font-bold mb-1">✓ No incidents active</span>
                  Stadium flow and safety telemetry are normal.
                </div>
              ) : (
                activeIncidents.map(inc => (
                  <div key={inc.id} className="rounded-2xl border border-rose-500/15 bg-rose-950/10 p-4 text-xs transition duration-200 hover:border-rose-500/30">
                    <div className="flex items-center justify-between font-extrabold border-b border-rose-500/5 pb-2">
                      <span className="text-rose-400 text-[13px]">{inc.title}</span>
                      <span className="rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 px-2.5 py-0.5 uppercase text-[9px] font-mono font-bold tracking-wider">{inc.severity}</span>
                    </div>
                    <p className="mt-2 text-slate-300 leading-relaxed">{inc.description}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Sector: <strong className="text-slate-400">{inc.zoneId}</strong></span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                        Live dispatch
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Operations Copilot & Q&A Chat terminal */}
          <section className="flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md min-h-[380px]" aria-label="Operations Copilot Chat Terminal">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Operations Copilot</h2>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            </div>

            <div className="flex-1 flex flex-col bg-slate-950/80 rounded-2xl border border-white/5 p-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-blue-400" />
                Q&A Terminal
              </h3>
              
              <div className="flex-1 space-y-3.5 py-3 text-xs overflow-y-auto max-h-[300px]">
                {chatHistory.length === 0 && (
                  <p className="text-slate-500 text-center py-6 leading-relaxed font-sans">Ask Copilot questions about active gates, dispatch, or response workflows.</p>
                )}
                {chatHistory.map((msg, idx) => (
                  <ChatBubble key={`${msg.sender}-${idx}-${msg.text.slice(0, 12)}`} role={msg.sender === 'user' ? 'user' : 'copilot'} fallback={!msg.aiPowered}>
                    {msg.sender === 'copilot' ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      <span className="whitespace-pre-line">{msg.text}</span>
                    )}
                  </ChatBubble>
                ))}
                {chatLoading && (
                  <p className="text-slate-400 text-[10px] animate-pulse">Copilot is researching...</p>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="mt-auto flex gap-1.5 pt-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Ask Copilot..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                  aria-label="Ask Copilot a question"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-3 py-2.5 text-xs font-semibold transition-all shadow flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </section>

        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {broadcastText !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 transition-opacity backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-title"
        >
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <h3 id="broadcast-title" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                📢 Public Address Draft
              </h3>
              {!broadcastAiPowered && (
                <span className="rounded bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 text-[8px] font-sans font-bold">
                  Deterministic
                </span>
              )}
            </div>

            <div className="mt-4 bg-slate-950 rounded-2xl border border-white/5 p-4 text-xs text-slate-200 leading-relaxed font-sans">
              {broadcastLoading ? (
                <LoadingSkeleton lines={3} />
              ) : broadcastText ? (
                <AIResponseCard content={broadcastText} title="Draft Announcement text" />
              ) : null}
            </div>

            {!broadcastAiPowered && !broadcastLoading && (
              <p className="mt-3 text-[10px] text-amber-400">
                ⚠️ Copilot services fallback. Direct factual template returned.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                ref={modalCloseBtnRef}
                onClick={closeBroadcastModal}
                className="rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all"
              >
                Dismiss Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
