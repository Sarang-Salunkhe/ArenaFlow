import React, { useEffect, useState, useRef } from 'react';
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
  ArrowRight,
  Cpu
} from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { LoadingSkeleton, KpiCardSkeleton, CopilotSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAssistant } from '../context/AssistantContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import {
  StadiumState,
  OperationalDecision,
  CrowdInsight,
  CopilotResponse,
} from '../types';
import {
  TopCommandBar,
  KpiSection,
  IncidentCenter,
  TacticalPanel,
  ResourceDeployment,
  LiveActivityTimeline,
  getRiskColorClass,
  getRiskBgClass
} from '../components/operations/CommandCenterComponents';
import { DigitalTwinDashboard } from '../components/operations/DigitalTwinDashboard';
import { PlaybookDashboard } from '../components/operations/PlaybookDashboard';

export function OperationsPage() {
  const [state, setState] = useState<StadiumState | null>(null);
  const [insights, setInsights] = useState<CrowdInsight[]>([]);
  const [decisions, setDecisions] = useState<OperationalDecision[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('PLAZA_NORTH');
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'TWIN' | 'PLAYBOOK'>('OPERATIONS');
  
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
      const stateRes = await fetch('/api/stadium/state');
      const stateData = await stateRes.json();
      setState(stateData);

      const insightsRes = await fetch('/api/operations/insights');
      const insightsData = await insightsRes.json();
      setInsights(insightsData);

      const decisionsRes = await fetch('/api/operations/decisions');
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
      const res = await fetch('/api/simulation/advance', { method: 'POST' });
      const data = await res.json();
      setState(data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
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
      const res = await fetch('/api/simulation/phase', {
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
      const res = await fetch('/api/simulation/scenario', {
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
      const res = await fetch('/api/ai/brief', {
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
      const res = await fetch('/api/ai/assist', {
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
  const handleGenerateBroadcast = async (id: string) => {
    setBroadcastLoading(true);
    setBroadcastText('');

    try {
      const isDecision = decisions.some(d => d.id === id);
      const requestBody = isDecision 
        ? { decisionId: id } 
        : { customTopic: state?.incidents.find(i => i.id === id)?.description || `Incident ID: ${id}` };

      const res = await fetch('/api/ai/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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



  // Telemetry and analytical calculations for the 6 KPIs
  const avgRiskScore = state.zones.length > 0
    ? Math.round(state.zones.reduce((sum, z) => sum + z.riskScore, 0) / state.zones.length)
    : 0;
  const riskStatus = avgRiskScore >= 65 ? 'Critical' : avgRiskScore >= 40 ? 'Elevated' : 'Nominal';

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
      <TopCommandBar
        state={state}
        activeIncidentsCount={activeIncidents.length}
        avgOccupancyPct={avgOccupancyPct}
        timeString={timeString}
      />

      {/* Dashboard View Mode Selector Tab Group */}
      <div className="flex flex-wrap rounded-2xl bg-slate-900/60 p-1 border border-white/5 self-start font-sans text-xs font-bold gap-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => setActiveTab('OPERATIONS')}
          className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeTab === 'OPERATIONS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="h-4 w-4" />
          Live Operations Center
        </button>
        <button
          onClick={() => setActiveTab('TWIN')}
          className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'TWIN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="h-4 w-4 animate-spin-slow" />
          Digital Twin Intelligence
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('PLAYBOOK')}
          className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'PLAYBOOK'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="h-4 w-4 animate-pulse" />
          AI Playbook Engine
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
        </button>
      </div>

      {activeTab === 'OPERATIONS' ? (
        <>
          {/* Simulator Controls & Scenario Injections Card */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Simulator and Match State Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Clock className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Simulator Control Deck</h2>
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
          <div className="w-full">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Radio className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Inject Stadium Scenarios &amp; Match Events</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {[
                { key: 'GOAL', label: '⚽ Goal scored', style: 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-700' },
                { key: 'YELLOW_CARD', label: '🟨 Yellow Card', style: 'bg-yellow-950/20 border-yellow-900/50 text-yellow-300 hover:bg-yellow-950/40 hover:border-yellow-700' },
                { key: 'RED_CARD', label: '🟥 Red Card', style: 'bg-red-950/20 border-red-900/50 text-red-300 hover:bg-red-950/40 hover:border-red-700' },
                { key: 'MEDICAL_EMERGENCY', label: '❤️ Medical Case', style: 'bg-rose-950/20 border-rose-900/50 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700' },
                { key: 'CROWD_SURGE', label: '🌊 Crowd Surge', style: 'bg-indigo-950/20 border-indigo-900/50 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-700' },
                { key: 'GATE_CONGESTION', label: '🚪 Gate Queue', style: 'bg-pink-950/20 border-pink-900/50 text-pink-300 hover:bg-pink-950/40 hover:border-pink-700' },
                { key: 'HEAVY_RAIN', label: '🌧️ Heavy Rain', style: 'bg-blue-950/20 border-blue-900/50 text-blue-300 hover:bg-blue-950/40 hover:border-blue-700' },
                { key: 'VIP_ARRIVAL', label: '👑 VIP Arrival', style: 'bg-violet-950/20 border-violet-900/50 text-violet-300 hover:bg-violet-950/40 hover:border-violet-700' },
                { key: 'SECURITY_ALERT', label: '🚨 Sec. Alert', style: 'bg-red-950/30 border-red-800/60 text-red-400 hover:bg-red-950/50 hover:border-red-650' },
                { key: 'LOST_CHILD', label: '👧 Lost Child', style: 'bg-teal-950/20 border-teal-900/50 text-teal-300 hover:bg-teal-950/40 hover:border-teal-700' },
                { key: 'PUBLIC_TRANSPORT_DELAY', label: '🚊 Metro Delay', style: 'bg-cyan-950/20 border-cyan-900/50 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-700' },
                { key: 'POWER_FAILURE', label: '🔌 Power Cut', style: 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700' },
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

      {/* KPI Overview Grid with exactly 10 premium responsive cards */}
      <section aria-label="Operations Overview Grid">
        <KpiSection
          state={state}
          avgOccupancyPct={avgOccupancyPct}
          avgRiskScore={avgRiskScore}
          riskStatus={riskStatus}
          activeIncidentsCount={activeIncidents.length}
          avgGateQueueSec={avgGateQueueSec}
          maxGateQueueSec={maxGateQueueSec}
          activeVolunteersCount={activeVolunteersCount}
        />
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

          {/* NEW: Match & Crowd Telemetry Analytics Dashboard */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Match & Crowd Telemetry">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Transit &amp; Crowd stress telemetry</h2>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                ACTIVE PIPELINE
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SVG Line Chart (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-white/[0.02] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-white">Crowd Flow Index vs Match Minutes</span>
                    <span className="text-[10px] text-slate-400 font-medium">Real-time projection stream</span>
                  </div>
                  
                  {/* Dynamic Interactive SVG Chart */}
                  <div className="relative h-44 w-full">
                    {/* Y-axis guidelines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-mono text-slate-600">
                      <div className="w-full border-t border-red-500/10 flex justify-between pt-0.5"><span>90 (CRITICAL)</span></div>
                      <div className="w-full border-t border-amber-500/10 flex justify-between pt-0.5"><span>60 (WARNING)</span></div>
                      <div className="w-full border-t border-white/[0.03] flex justify-between pt-0.5"><span>30 (NOMINAL)</span></div>
                      <div className="w-full border-t border-white/[0.03] flex justify-between pt-0.5"><span>0</span></div>
                    </div>

                    <svg viewBox="0 0 400 150" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Crowd Pressure Index Chart">
                      {/* Trend path */}
                      <path 
                        d="M 10 110 Q 50 40 100 20 T 200 80 T 300 130 T 390 10" 
                        fill="none" 
                        stroke="url(#chartGradient)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                      />

                      {/* Line Gradients */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="30%" stopColor="#f59e0b" />
                          <stop offset="60%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>

                      {/* Key Marker points */}
                      <circle cx="10" cy="110" r="4.5" className="fill-blue-400 stroke-slate-950 stroke-2" />
                      <circle cx="100" cy="20" r="4.5" className="fill-amber-400 stroke-slate-950 stroke-2" />
                      <circle cx="200" cy="80" r="4.5" className="fill-emerald-400 stroke-slate-950 stroke-2" />
                      <circle cx="390" cy="10" r="4.5" className="fill-red-400 stroke-slate-950 stroke-2" />

                      {/* Current Matchday phase marker line that shifts based on phase */}
                      {(() => {
                        const phasePositions: Record<string, number> = {
                          'PRE_MATCH': 25,
                          'ENTRY_SURGE': 100,
                          'MATCH_ACTIVE': 200,
                          'HALF_TIME': 260,
                          'MATCH_END': 330,
                          'EXIT_SURGE': 380
                        };
                        const xPos = phasePositions[state.matchPhase] || 200;
                        return (
                          <g className="transition-transform duration-1000 ease-out" transform={`translate(${xPos}, 0)`}>
                            <line x1="0" y1="0" x2="0" y2="140" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
                            <circle cx="0" cy="70" r="6" className="fill-indigo-400 animate-pulse" />
                            <rect x="-30" y="-12" width="60" height="15" rx="3" className="fill-indigo-950 stroke-indigo-400 stroke-[0.5]" />
                            <text x="0" y="-2" className="fill-white text-[7px] font-bold font-mono text-center" textAnchor="middle">LIVE NOW</text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-2 border-t border-white/5 pt-2">
                  <span>PRE-MATCH (T-120)</span>
                  <span>KICKOFF (0')</span>
                  <span>HALFTIME (45')</span>
                  <span>FULLTIME (90')</span>
                  <span>EGRESS (T+120)</span>
                </div>
              </div>

              {/* USA vs GER Match Momentum (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-white/[0.02] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-white">Live Momentum Index</span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">USA vs GER</span>
                  </div>

                  {/* Momentum Progress bars */}
                  <div className="space-y-4">
                    {/* USA Momentum */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-blue-400">🇺🇸 USA Attack Rating</span>
                        <span className="text-white font-mono">{52 + (state.tickCount * 3) % 25}%</span>
                      </div>
                      <div className="h-2 w-full bg-blue-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000"
                          style={{ width: `${52 + (state.tickCount * 3) % 25}%` }}
                        />
                      </div>
                    </div>

                    {/* GER Momentum */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-rose-400">🇩🇪 Germany Attack Rating</span>
                        <span className="text-white font-mono">{48 + (state.tickCount * 2) % 20}%</span>
                      </div>
                      <div className="h-2 w-full bg-rose-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-1000"
                          style={{ width: `${48 + (state.tickCount * 2) % 20}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold mb-1">AI Match Prediction</span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed text-left">
                      Expected goal probability is <strong className="text-blue-400">USA {45 + (state.tickCount) % 10}%</strong> to <strong className="text-rose-400">GER {35 + (state.tickCount * 2) % 8}%</strong> with a high chance of transition surge at {state.matchPhase === 'MATCH_ACTIVE' ? "this phase" : "Match Active"}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                    } ${state.incidents.some(i => i.zoneId === 'EMERGENCY_CORRIDOR' && i.active) ? 'stroke-rose-600 animate-pulse' : ''}`} />
                  <text x="80" y="235" className="fill-slate-500 text-[8px] pointer-events-none font-sans font-bold">Emergency Route</text>

                  {/* Real-time incident live-map visual overlay */}
                  {activeIncidents.map(inc => {
                    let coords = { x: 210, y: 150 }; // default
                    if (inc.zoneId === 'METRO_STATION') coords = { x: 60, y: 30 };
                    else if (inc.zoneId === 'BUS_STATION') coords = { x: 360, y: 30 };
                    else if (inc.zoneId === 'PLAZA_NORTH') coords = { x: 100, y: 90 };
                    else if (inc.zoneId === 'PLAZA_SOUTH') coords = { x: 320, y: 90 };
                    else if (inc.zoneId === 'CONCOURSE_LOWER') coords = { x: 210, y: 165 };
                    else if (inc.zoneId === 'CONCOURSE_UPPER') coords = { x: 210, y: 200 };
                    else if (inc.zoneId === 'LIFT_NORTH') coords = { x: 140, y: 180 };
                    else if (inc.zoneId === 'FOOD_COURT_A') coords = { x: 210, y: 216 };
                    else if (inc.zoneId === 'EMERGENCY_CORRIDOR') coords = { x: 125, y: 177 };

                    return (
                      <g key={`ping-${inc.id}`} className="pointer-events-none">
                        <circle cx={coords.x} cy={coords.y} r="14" className="fill-red-500/10 stroke-red-500 stroke-[1.5] animate-ping" />
                        <circle cx={coords.x} cy={coords.y} r="5" className="fill-red-500 stroke-white stroke-1" />
                        <text x={coords.x + 8} y={coords.y + 3} className="fill-red-400 font-mono text-[7px] font-black tracking-wider">ALERT</text>
                      </g>
                    );
                  })}
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
                    selectedZone.attentionLevel === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' :
                    selectedZone.attentionLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                    selectedZone.attentionLevel === 'WATCH' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                  }`}>
                    {selectedZone.attentionLevel} Focus
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
                  {/* Left Column: Stats & Anomalies (7 cols) */}
                  <div className="md:col-span-7 flex flex-col justify-between gap-4">
                    <div className="grid grid-cols-2 gap-3">
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
                      <div className="border-t border-white/5 pt-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          Anomaly Factors & Telemetry
                        </h4>
                        <ul className="list-none text-[11px] text-slate-300 space-y-1 pl-0">
                          {selectedInsight.reasons.map((r, idx) => (
                            <li key={idx} className="flex gap-2 rounded-xl bg-slate-950/30 border border-white/5 px-2.5 py-1.5 leading-relaxed">
                              <span className="text-blue-400">▶</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Simulated CCTV monitor Feed (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between">
                    <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-3 select-none">
                      {/* Scanline pattern layer */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70" />
                      
                      {/* Sweep radar visual */}
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/[0.03] to-blue-500/[0.08] pointer-events-none animate-radar-sweep origin-top z-0" />
                      
                      {/* Top feed metadata */}
                      <div className="flex justify-between items-center z-10 relative text-[9px] font-mono font-bold text-emerald-400">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                          LIVE_CAM_0{selectedZoneId.charCodeAt(0) % 9 + 1}
                        </span>
                        <span>1080P // 30FPS</span>
                      </div>

                      {/* Center radar target target lines */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        {/* Target reticle */}
                        <div className="h-12 w-12 border border-emerald-500/20 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 border border-emerald-500/30 rounded-full" />
                        </div>
                        {/* Crosshairs */}
                        <div className="absolute h-16 w-[1px] bg-emerald-500/10" />
                        <div className="absolute w-16 h-[1px] bg-emerald-500/10" />
                      </div>

                      {/* Bottom Feed metadata */}
                      <div className="flex justify-between items-end z-10 relative text-[8px] font-mono text-slate-400 mt-6 md:mt-12">
                        <div className="flex flex-col gap-0.5">
                          <span>ZONE: {selectedZoneId}</span>
                          <span>RISK_FACTOR: {selectedZone.riskScore}%</span>
                        </div>
                        <span className="text-right text-emerald-400 font-bold">{timeString}</span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 italic mt-3 leading-normal text-left">
                      💡 Click other sectors on the map to switch active CCTV camera monitoring feeds.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Resource Deployment Posture */}
          <ResourceDeployment state={state} />

          {/* Live Activity Timeline */}
          <LiveActivityTimeline state={state} />
        </div>

        {/* RIGHT COLUMN: Decisions, Active Alerts & Copilot Chat (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Tactical Decisions Panel (Directives) */}
          <TacticalPanel
            decisions={decisions}
            avgRiskScore={avgRiskScore}
            onGenerateBroadcast={handleGenerateBroadcast}
          />

          {/* Active Field Alerts Segment */}
          <IncidentCenter
            activeIncidents={activeIncidents}
            onGenerateBroadcast={handleGenerateBroadcast}
          />

          {/* Tactical Dispatch & Radio Feeds */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Tactical Dispatch & Radio Logs">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">📡</span>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Operations Radio & Dispatch Logs</h2>
              </div>
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
            </div>

            <div className="space-y-3 font-mono text-[11px] leading-relaxed max-h-[220px] overflow-y-auto pr-1">
              {[
                { time: "20:04:12", sender: "DISPATCH_CH_4", text: "Crowd bottleneck at Plaza North gates fully resolved. Gate scanners operating at 100% capacity.", type: "info" },
                { time: "20:01:45", sender: "MEDICAL_POST_1", text: "First responder on scene at Lower Concourse Sector C. Heat exhaustion symptoms treated. Ref: MED_A4", type: "success" },
                { time: "19:58:30", sender: "W_ELEVATOR_LOBBY", text: "Elevator Priority Corridor cleared for wheelchair group access. Congestion index returned to Stable.", type: "success" },
                { time: "19:55:18", sender: "STADIUM_ENG_2", text: "Gate A electronic turnstile card readers rebooted. Fully operational and syncing with local server.", type: "warning" },
                { time: "19:52:04", sender: "HQ_CH_1", text: "Security escort dispatched to emergency corridor route link to inspect secondary lock gate.", type: "info" }
              ].map((log, idx) => (
                <div key={idx} className="rounded-xl border border-white/5 bg-slate-950/70 p-3 flex gap-2">
                  <span className="text-slate-500 shrink-0 font-bold">[{log.time}]</span>
                  <div>
                    <span className={`font-black uppercase tracking-wider text-[10px] block mb-0.5 ${
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {log.sender}
                    </span>
                    <span className="text-slate-300">{log.text}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="mt-3.5 text-[10px] text-slate-500 font-sans italic text-center leading-normal">
              Continuous stadium operations radio monitoring • USA vs GER matchday feed active.
            </p>
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
        </>
      ) : activeTab === 'TWIN' ? (
        <DigitalTwinDashboard state={state} />
      ) : (
        <PlaybookDashboard state={state} onAdvanceTick={handleAdvanceTick} />
      )}

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
