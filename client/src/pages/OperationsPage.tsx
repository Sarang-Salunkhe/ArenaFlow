import React, { useEffect, useState, useRef } from 'react';
import { BackLink } from '@/components/BackLink';
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
  const handleGenerateBroadcast = async (decisionId: string) => {
    // Open modal with loading
    setBroadcastLoading(true);
    setBroadcastText('');
    
    // Disable body scroll safely while modal is open
    document.body.style.overflow = 'hidden';

    try {
      const res = await fetch('/api/ai/broadcast', {
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
    // Restore body scroll safely
    document.body.style.overflow = '';
  };

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-900 p-8 text-white">
        <p className="text-lg animate-pulse" role="status">Loading ArenaFlow Command Center...</p>
      </div>
    );
  }

  const selectedZone = state.zones.find(z => z.id === selectedZoneId);
  const selectedInsight = insights.find(i => i.zoneId === selectedZoneId);
  const activeIncidents = state.incidents.filter(i => i.active);

  // Helper colors for risk levels
  const getRiskColorClass = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-500 fill-red-500 border-red-600';
    if (riskScore >= 60) return 'text-orange-500 fill-orange-500 border-orange-400';
    if (riskScore >= 35) return 'text-amber-500 fill-amber-500 border-amber-400';
    return 'text-emerald-500 fill-emerald-500 border-emerald-500';
  };

  const getRiskBgClass = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-950 border-red-800 text-red-200';
    if (riskScore >= 60) return 'bg-orange-950 border-orange-800 text-orange-200';
    if (riskScore >= 35) return 'bg-amber-950 border-amber-800 text-amber-200';
    return 'bg-emerald-950 border-emerald-800 text-emerald-200';
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-slate-100">
      {/* Top Banner Control Bar */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackLink label="Back to Platform Launcher" />
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              ArenaFlow Command Operations
            </h1>
          </div>

          {/* Simulation Controllers */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sim Tick: <span className="text-white font-mono">{state.tickCount}</span>
            </div>

            <button
              onClick={handleAdvanceTick}
              className="rounded bg-arena-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label="Advance simulation one tick"
            >
              Advance Tick
            </button>

            <button
              onClick={handleReset}
              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              aria-label="Reset simulation"
            >
              Reset Sim
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <label htmlFor="match-phase" className="sr-only">Set Match Phase</label>
            <select
              id="match-phase"
              value={state.matchPhase}
              onChange={(e) => handlePhaseChange(e.target.value)}
              className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white focus-visible:ring-2 focus-visible:ring-arena-accent focus-visible:outline-none"
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
      </header>

      {/* Scenario Quick Buttons */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3" aria-label="Simulation Scenarios">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trigger Scenario:</span>
          <button
            onClick={() => handleTriggerScenario('GATE_CONGESTION')}
            className="rounded-full bg-slate-800 hover:bg-red-950 hover:text-red-300 border border-slate-700 hover:border-red-800 px-3 py-1 text-xs font-medium transition-colors"
          >
            🚨 Gate Congestion
          </button>
          <button
            onClick={() => handleTriggerScenario('MEDICAL_INCIDENT')}
            className="rounded-full bg-slate-800 hover:bg-amber-950 hover:text-amber-300 border border-slate-700 hover:border-amber-800 px-3 py-1 text-xs font-medium transition-colors"
          >
            🩺 Medical Incident
          </button>
          <button
            onClick={() => handleTriggerScenario('ROUTE_CLOSURE')}
            className="rounded-full bg-slate-800 hover:bg-slate-950 hover:text-slate-300 border border-slate-700 hover:border-slate-800 px-3 py-1 text-xs font-medium transition-colors"
          >
            🚧 Route Closure
          </button>
          <button
            onClick={() => handleTriggerScenario('EXIT_SURGE')}
            className="rounded-full bg-slate-800 hover:bg-purple-950 hover:text-purple-300 border border-slate-700 hover:border-purple-800 px-3 py-1 text-xs font-medium transition-colors"
          >
            🚇 Exit Surge
          </button>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 p-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Map & Selected Zone Panel (Col 5) */}
        <section className="flex flex-col gap-6 lg:col-span-5" aria-label="Interactive Stadium Map">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-white">Interactive Stadium Topology</h2>
            <p className="mt-1 text-xs text-slate-400">Select any zone on the map to review telemetry details.</p>
            
            {/* SVG Stadium Map representation */}
            <div className="mt-6 flex justify-center bg-slate-950 rounded-lg p-2 border border-slate-800/60">
              <svg viewBox="0 0 420 300" className="w-full max-w-md h-auto" aria-label="Stadium map layout map">
                {/* Outer Plaza and Transport Connections */}
                <rect x="10" y="10" width="100" height="40" rx="4"
                  onClick={() => setSelectedZoneId('METRO_STATION')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'METRO_STATION' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'METRO_STATION')?.riskScore || 0)}`} />
                <text x="25" y="34" className="fill-white text-[9px] pointer-events-none font-medium">🚇 Metro Plaza</text>

                <rect x="310" y="10" width="100" height="40" rx="4"
                  onClick={() => setSelectedZoneId('BUS_STATION')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'BUS_STATION' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'BUS_STATION')?.riskScore || 0)}`} />
                <text x="325" y="34" className="fill-white text-[9px] pointer-events-none font-medium">🚌 Bus Terminal</text>

                {/* Entry Plazas */}
                <ellipse cx="100" cy="90" rx="40" ry="25"
                  onClick={() => setSelectedZoneId('PLAZA_NORTH')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'PLAZA_NORTH' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'PLAZA_NORTH')?.riskScore || 0)}`} />
                <text x="75" y="93" className="fill-white text-[9px] pointer-events-none font-medium">Plaza North</text>

                <ellipse cx="320" cy="90" rx="40" ry="25"
                  onClick={() => setSelectedZoneId('PLAZA_SOUTH')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'PLAZA_SOUTH' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'PLAZA_SOUTH')?.riskScore || 0)}`} />
                <text x="295" y="93" className="fill-white text-[9px] pointer-events-none font-medium">Plaza South</text>

                {/* Entry Gates (Inner Rectangles) */}
                <rect x="75" y="130" width="50" height="20" rx="3"
                  onClick={() => setSelectedZoneId('CONCOURSE_LOWER')} // mapped to Lower Concourse access
                  className={`cursor-pointer fill-slate-800 stroke-slate-600 transition-colors ${selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : ''}`} />
                <text x="83" y="143" className="fill-slate-300 text-[8px] pointer-events-none">Gates A/C</text>

                <rect x="295" y="130" width="50" height="20" rx="3"
                  onClick={() => setSelectedZoneId('CONCOURSE_LOWER')}
                  className={`cursor-pointer fill-slate-800 stroke-slate-600 transition-colors ${selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : ''}`} />
                <text x="303" y="143" className="fill-slate-300 text-[8px] pointer-events-none">Gates B/D</text>

                {/* Main Stadium Outer Ring (Lower Concourse) */}
                <rect x="120" y="160" width="180" height="80" rx="40"
                  onClick={() => setSelectedZoneId('CONCOURSE_LOWER')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'CONCOURSE_LOWER' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'CONCOURSE_LOWER')?.riskScore || 0)}`} />
                <text x="175" y="172" className="fill-white text-[9px] pointer-events-none font-medium">Lower Concourse Ring</text>

                {/* Upper Concourse (Inside) */}
                <rect x="150" y="185" width="120" height="40" rx="20"
                  onClick={() => setSelectedZoneId('CONCOURSE_UPPER')}
                  className={`cursor-pointer stroke-2 stroke-slate-800 transition-colors ${selectedZoneId === 'CONCOURSE_UPPER' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'CONCOURSE_UPPER')?.riskScore || 0)}`} />
                <text x="180" y="197" className="fill-white text-[8px] pointer-events-none font-medium">Upper Concourse</text>

                {/* Lifts & Food court labels */}
                <circle cx="140" cy="180" r="10"
                  onClick={() => setSelectedZoneId('LIFT_NORTH')}
                  className={`cursor-pointer stroke-1 stroke-slate-700 transition-colors ${selectedZoneId === 'LIFT_NORTH' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'LIFT_NORTH')?.riskScore || 0)}`} />
                <text x="137" y="183" className="fill-white text-[8px] pointer-events-none">🛗</text>

                <rect x="185" y="210" width="50" height="12" rx="2"
                  onClick={() => setSelectedZoneId('FOOD_COURT_A')}
                  className={`cursor-pointer stroke-1 stroke-slate-800 transition-colors ${selectedZoneId === 'FOOD_COURT_A' ? 'stroke-blue-400' : ''} ${getRiskColorClass(state.zones.find(z => z.id === 'FOOD_COURT_A')?.riskScore || 0)}`} />
                <text x="195" y="219" className="fill-white text-[7px] pointer-events-none">🍔 Food A</text>

                {/* Emergency Corridor (Bottom Left link) */}
                <line x1="100" y1="115" x2="150" y2="240" strokeWidth="4"
                  onClick={() => setSelectedZoneId('EMERGENCY_CORRIDOR')}
                  className={`cursor-pointer stroke-slate-700 transition-colors ${selectedZoneId === 'EMERGENCY_CORRIDOR' ? 'stroke-blue-400' : ''} ${state.incidents.some(i => i.zoneId === 'EMERGENCY_CORRIDOR' && i.active) ? 'stroke-red-600' : ''}`} />
                <text x="80" y="235" className="fill-slate-400 text-[8px] pointer-events-none">Emergency Way</text>
              </svg>
            </div>
          </div>

          {/* Selected Zone Telemetry */}
          {selectedZone && selectedInsight && (
            <div className={`rounded-xl border p-5 shadow-sm transition-all ${getRiskBgClass(selectedZone.riskScore)}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{selectedZone.name}</h3>
                <span className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase ${
                  selectedZone.attentionLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                  selectedZone.attentionLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                  selectedZone.attentionLevel === 'WATCH' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                }`}>
                  {selectedZone.attentionLevel} Priority
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Risk Score</p>
                  <p className="mt-0.5 text-xl font-bold font-mono">{selectedZone.riskScore} <span className="text-xs text-slate-400">/ 100</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Occupancy</p>
                  <p className="mt-0.5 text-xl font-bold font-mono">
                    {selectedZone.occupancy.toLocaleString()} 
                    <span className="text-xs text-slate-400"> / {selectedZone.capacity.toLocaleString()} ({selectedInsight.occupancyPct}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Density Level</p>
                  <p className="mt-0.5 text-sm font-semibold">{selectedZone.crowdLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Trend</p>
                  <p className="mt-0.5 text-sm font-semibold text-blue-400">📈 {selectedZone.trend}</p>
                </div>
              </div>

              {selectedInsight.reasons.length > 0 && (
                <div className="mt-4 border-t border-slate-800/80 pt-3">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Metrics and Anomalies:</h4>
                  <ul className="mt-1 list-disc pl-4 text-xs text-slate-300 space-y-1">
                    {selectedInsight.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* MIDDLE COLUMN: Alerts & Operational Decisions (Col 4) */}
        <section className="flex flex-col gap-6 lg:col-span-4" aria-label="Command Alerts & Decisions">
          {/* Active Incidents */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-white flex items-center justify-between">
              Active Field Incidents
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{activeIncidents.length}</span>
            </h2>
            
            <div className="mt-4 max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {activeIncidents.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active safety or crowd incidents reported.</p>
              ) : (
                activeIncidents.map(inc => (
                  <div key={inc.id} className="rounded border border-red-950 bg-red-950/40 p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-red-400">{inc.title}</span>
                      <span className="rounded bg-red-900/60 px-1.5 py-0.2 text-[9px] uppercase">{inc.severity}</span>
                    </div>
                    <p className="mt-1 text-slate-300">{inc.description}</p>
                    <p className="mt-2 text-[10px] text-slate-500 font-mono">Location: {inc.zoneId}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational Decisions */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm flex flex-col">
            <h2 className="text-base font-semibold text-white flex items-center justify-between">
              Operational Recommendations
              <span className="rounded bg-blue-900/50 px-2.5 py-0.5 text-xs text-blue-300">{decisions.length}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">Rules evaluated automatically based on simulated metrics.</p>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-1">
              {decisions.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Stadium operating normally. No actions required.</p>
              ) : (
                decisions.map(dec => (
                  <div key={dec.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-white leading-tight">{dec.title}</h3>
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                        dec.priority === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {dec.priority}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-400">Facts Evaluated:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {dec.rationaleFacts.map((fact, idx) => <li key={idx}>{fact}</li>)}
                      </ul>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                      <p className="font-semibold text-slate-400">Recommended Steps:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {dec.recommendedActions.map((act, idx) => <li key={idx}>{act}</li>)}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleGenerateBroadcast(dec.id)}
                      className="mt-3 w-full rounded bg-blue-950 border border-blue-800 text-blue-200 py-1 text-xs font-medium hover:bg-blue-900 transition-colors"
                      aria-label={`Generate PA Broadcast for ${dec.title}`}
                    >
                      🗣️ Generate PA Broadcast Text
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AI Copilot Sidebar Panel (Col 3) */}
        <section className="flex flex-col gap-6 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm max-h-[700px]" aria-label="AI Command Copilot">
          <h2 className="text-base font-semibold text-white flex items-center justify-between">
            AI Operations Copilot
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </h2>

          {/* Situation Brief Box */}
          <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 flex flex-col max-h-[220px]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Briefing</h3>
              {!briefAiPowered && (
                <span className="rounded bg-amber-950 border border-amber-800 text-amber-300 px-1.5 py-0.2 text-[8px] font-medium font-sans">
                  Fallback Mode
                </span>
              )}
            </div>
            
            <div className="mt-2 text-xs text-slate-300 overflow-y-auto leading-relaxed flex-1 whitespace-pre-line pr-1">
              {briefingLoading ? 'Analyzing stadium telemetry and generating brief...' : briefText}
            </div>

            <button
              onClick={handleGenerateBrief}
              disabled={briefingLoading}
              className="mt-3 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            >
              🔄 Generate Briefing
            </button>
          </div>

          {/* Q&A Chat window */}
          <div className="flex-1 flex flex-col bg-slate-950 rounded-lg border border-slate-800 p-3 max-h-[300px]">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">Q&A Terminal</h3>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[200px] text-xs">
              {chatHistory.length === 0 && (
                <p className="text-slate-500 text-center py-8">Ask Copilot questions about incidents, metro congestion, or safety steps.</p>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded px-3 py-2 max-w-[90%] whitespace-pre-line ${
                    msg.sender === 'user' 
                      ? 'bg-blue-900 text-white' 
                      : 'bg-slate-800 text-slate-100'
                  }`}>
                    {msg.text}
                  </div>
                  {!msg.aiPowered && msg.sender === 'copilot' && (
                    <span className="text-[8px] text-amber-500 mt-0.5">⚠️ Offline Deterministic Guide</span>
                  )}
                </div>
              ))}
              {chatLoading && (
                <p className="text-slate-400 text-[10px] animate-pulse">Copilot is thinking...</p>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex gap-1 pt-2 border-t border-slate-850">
              <input
                type="text"
                placeholder="Ask Copilot..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-arena-accent focus-visible:outline-none"
                aria-label="Ask Copilot a question"
              />
              <button
                type="submit"
                className="rounded bg-arena-blue hover:bg-blue-700 text-white px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Broadcast Announcement Modal Popup Overlay */}
      {broadcastText !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-title"
        >
          <div className="w-full max-w-xl rounded-xl border border-slate-850 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 id="broadcast-title" className="text-base font-bold text-white flex items-center gap-2">
                📢 Generated Public Address Text
              </h3>
              {!broadcastAiPowered && (
                <span className="rounded bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 text-[9px] font-sans font-medium">
                  Deterministic Fallback
                </span>
              )}
            </div>

            <div className="mt-4 bg-slate-950 rounded-lg border border-slate-850 p-4 text-sm text-slate-200 leading-relaxed font-sans min-h-[140px] flex items-center justify-center whitespace-pre-wrap">
              {broadcastLoading ? (
                <p className="text-slate-400 animate-pulse">Drafting emergency communication text with AI...</p>
              ) : (
                broadcastText
              )}
            </div>

            {!broadcastAiPowered && !broadcastLoading && (
              <p className="mt-3 text-xs text-amber-400">
                ⚠️ AI services are unavailable. Deterministic template response provided.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                ref={modalCloseBtnRef}
                onClick={closeBroadcastModal}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
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
