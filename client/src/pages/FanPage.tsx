import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { 
  Accessibility, 
  Route, 
  ShieldAlert, 
  Utensils, 
  HelpCircle,
  MapPin, 
  Languages, 
  ChevronRight
} from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSkeleton, KpiCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAssistant } from '../context/AssistantContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StadiumState, RouteResult, CopilotResponse } from '../types';

const SELECTABLE_NODES = [
  { id: 'METRO_STATION', name: 'Metro Plaza Entrance' },
  { id: 'BUS_STATION', name: 'Bus Terminal Plaza' },
  { id: 'PLAZA_NORTH', name: 'North Entry Plaza' },
  { id: 'PLAZA_SOUTH', name: 'South Entry Plaza' },
  { id: 'STAND_NORTH', name: 'North Stand (Stairs Only)' },
  { id: 'STAND_SOUTH', name: 'South Stand (Stairs Only)' },
  { id: 'STAND_EAST', name: 'East Stand (Accessible Seat)' },
  { id: 'STAND_WEST', name: 'West Stand (Accessible Seat)' },
  { id: 'FOOD_COURT_A', name: 'Food Court A (Lower)' },
  { id: 'FOOD_COURT_B', name: 'Food Court B (Upper)' },
  { id: 'MEDICAL_POST_1', name: 'Medical Station 1' },
  { id: 'MEDICAL_POST_2', name: 'Medical Station 2' },
];

const NEARBY_SERVICES_MAP: Record<string, Array<{ type: 'food' | 'medical' | 'wc' | 'lift'; name: string; distance: string; detail: string }>> = {
  STAND_EAST: [
    { type: 'food', name: 'Food Court A (Lower Concourse)', distance: '45m', detail: 'Drinks, hot snacks' },
    { type: 'lift', name: 'East Elevator Lobby', distance: '12m', detail: 'Priority lift access' },
    { type: 'wc', name: 'Comfort Station Sector East', distance: '28m', detail: 'Wheelchair accessible' },
  ],
  STAND_WEST: [
    { type: 'food', name: 'Food Court B (Upper Level)', distance: '30m', detail: 'Refreshments, pies' },
    { type: 'lift', name: 'West Elevator Lobby', distance: '15m', detail: 'Priority lift access' },
    { type: 'wc', name: 'Comfort Station Sector West', distance: '50m', detail: 'Wheelchair accessible' },
  ],
  STAND_NORTH: [
    { type: 'food', name: 'Food Court B (Upper Level)', distance: '60m', detail: 'Refreshments, pies' },
    { type: 'wc', name: 'Comfort Station Sector North', distance: '25m', detail: 'Standard restrooms' },
    { type: 'medical', name: 'First Aid Station 2', distance: '110m', detail: 'Adjacent Plaza North' },
  ],
  STAND_SOUTH: [
    { type: 'food', name: 'Food Court A (Lower Concourse)', distance: '70m', detail: 'Drinks, hot snacks' },
    { type: 'wc', name: 'Comfort Station Sector South', distance: '35m', detail: 'Standard restrooms' },
    { type: 'medical', name: 'First Aid Station 1', distance: '120m', detail: 'Concourse A entrance' },
  ],
};

const DEFAULT_SERVICES = [
  { type: 'food' as const, name: 'Food Court Express', distance: '80m', detail: 'Grab & go snacks' },
  { type: 'wc' as const, name: 'Main Concourse Restrooms', distance: '60m', detail: 'All facilities open' },
  { type: 'medical' as const, name: 'First Aid Post 1', distance: '140m', detail: 'Red cross professionals' },
];

export function FanPage() {
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  
  // Navigation form state
  const [startNode, setStartNode] = useState<string>('METRO_STATION');
  const [destNode, setDestNode] = useState<string>('STAND_EAST');
  const [accessibilityRequired, setAccessibilityRequired] = useState<boolean>(false);
  
  const { setSelectedZoneId: setGlobalZoneId, setStadiumState: setGlobalStadiumState } = useAssistant();

  useEffect(() => {
    setGlobalZoneId(destNode);
  }, [destNode, setGlobalZoneId]);

  useEffect(() => {
    setGlobalStadiumState(stadiumState);
  }, [stadiumState, setGlobalStadiumState]);
  
  // Routing result
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);

  // Copilot explanation state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiPowered, setAiPowered] = useState<boolean>(true);

  // Copilot Q&A
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'assistant'; text: string; aiPowered: boolean }[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Load stadium state for alert banners
  const fetchStadiumState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stadium/state`);
      const data = await res.json();
      setStadiumState(data);
    } catch (err) {
      console.error('Error fetching stadium state for fan:', err);
    }
  };

  useEffect(() => {
    fetchStadiumState();
  }, []);

  // Compute route
  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteLoading(true);
    setRouteResult(null);
    setRouteError(null);
    setAiExplanation('');

    try {
      const res = await fetch(`${API_BASE}/api/routes/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNodeId: startNode,
          destinationNodeId: destNode,
          accessibilityRequired,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compute path');
      }

      setRouteResult(data);
      await fetchAiExplanation(data, selectedLanguage);
    } catch (err: any) {
      console.error(err);
      setRouteError(err.message || 'Routing is blocked under current conditions.');
    } finally {
      setRouteLoading(false);
    }
  };

  // Get AI path summary explanation
  const fetchAiExplanation = async (route: RouteResult, lang: string) => {
    setAiLoading(true);
    let promptMsg = `Explain the path from ${route.nodeNames[0]} to ${route.nodeNames[route.nodeNames.length - 1]}. Path nodes are: ${route.nodeNames.join(' to ')}. Walking time is estimated at ${route.estimatedWalkingTimeMinutes} mins. Congestion status is: ${route.congestionSummary}.`;
    
    if (lang === 'es') {
      promptMsg += ' Provide the description in Spanish.';
    } else if (lang === 'de') {
      promptMsg += ' Provide the description in German.';
    } else if (lang === 'fr') {
      promptMsg += ' Provide the description in French.';
    }

    try {
      const res = await fetch(`${API_BASE}/api/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'FAN',
          userPrompt: promptMsg,
          routeContext: route,
        }),
      });
      const data: CopilotResponse = await res.json();
      setAiExplanation(data.text);
      setAiPowered(data.aiPowered);
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiExplanation('Wayfinding instructions are active, but the AI copilot is offline.');
      setAiPowered(false);
    } finally {
      setAiLoading(false);
    }
  };

  // Language switch handler
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (routeResult) {
      fetchAiExplanation(routeResult, lang);
    }
  };

  // Fan copilot custom chat
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
        body: JSON.stringify({
          role: 'FAN',
          userPrompt: userMsg,
          routeContext: routeResult || undefined,
        }),
      });
      const data: CopilotResponse = await res.json();
      setChatHistory(prev => [
        ...prev,
        { sender: 'assistant', text: data.text, aiPowered: data.aiPowered },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'assistant', text: 'Sorry, I am having trouble connecting right now.', aiPowered: false },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const activeIncidents = stadiumState?.incidents.filter(i => i.active) || [];
  const nearbyServices = NEARBY_SERVICES_MAP[destNode] || DEFAULT_SERVICES;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      <header className="mb-6">
        <SectionHeader
          eyebrow="Match-Day Digital Assistant"
          title="Match-Day Companion"
          description="Live wayfinding instructions, detour notifications, service maps, and instant AI guidance."
          action={<StatusBadge label={stadiumState ? stadiumState.matchPhase.replace(/_/g, ' ') : 'Live'} tone="success" />}
        />
      </header>

      {/* KPI Stats */}
      <section className="mb-6 responsive-kpi-grid gap-4">
        {!stadiumState ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard 
              label="Safety alerts" 
              value={String(activeIncidents.length)} 
              helper="Direct path blockages reported" 
              icon={ShieldAlert} 
              tone={activeIncidents.length > 0 ? 'danger' : 'success'} 
            />
            <KpiCard 
              label="Accessibility" 
              value={accessibilityRequired ? 'Step-Free' : 'Standard'} 
              helper="Preferred path configuration" 
              icon={Accessibility} 
              tone={accessibilityRequired ? 'success' : 'default'} 
            />
            <KpiCard 
              label="Estimated walk" 
              value={routeResult ? `${routeResult.estimatedWalkingTimeMinutes} mins` : 'Select Path'} 
              helper="Calculated from real-time queues" 
              icon={Route} 
              tone={routeResult ? 'success' : 'default'} 
            />
          </>
        )}
      </section>

      {activeIncidents.length > 0 && (
        <section className="mb-6" aria-label="Safety Alerts">
          <AlertBanner
            title="Active Path Blockages"
            message={activeIncidents.map(inc => `${inc.title}: ${inc.description}`).join(' • ')}
            tone="danger"
          />
        </section>
      )}

      {/* Dynamic Companion Grid Layout (No nested scroll zones) */}
      <div className="responsive-dashboard-grid gap-6">
        
        {/* LEFT COLUMN: Search & Nearby (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Navigation Input Card */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Find Destination">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Navigation Terminal</h2>
            </div>
            
            <form onSubmit={handleCalculateRoute} className="space-y-4">
              <div>
                <label htmlFor="start-node" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Starting Point:
                </label>
                <select
                  id="start-node"
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  {SELECTABLE_NODES.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dest-node" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Destination Section:
                </label>
                <select
                  id="dest-node"
                  value={destNode}
                  onChange={(e) => setDestNode(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  {SELECTABLE_NODES.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Accessibility */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="access-req"
                  checked={accessibilityRequired}
                  onChange={(e) => setAccessibilityRequired(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-lg border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="access-req" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  Accessible route (avoid stairs, use elevators)
                </label>
              </div>

              <button
                type="submit"
                disabled={routeLoading}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {routeLoading ? 'Calculating optimal safe path...' : 'Calculate Wayfinding & Travel Time'}
              </button>
            </form>
          </section>

          {/* Nearby Stadium Services Panel */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Nearby Services</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500">At Destination Sector</span>
            </div>

            <div className="grid gap-3">
              {nearbyServices.map((srv, idx) => (
                <div key={idx} className="flex items-start justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3.5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-base p-1.5 rounded-xl bg-slate-900 border border-white/5 mt-0.5">
                      {srv.type === 'food' ? '🍔' : srv.type === 'medical' ? '🩺' : srv.type === 'wc' ? '🚻' : '🛗'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{srv.detail}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
                    {srv.distance}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Results & AI explanation (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {routeError && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4 text-xs text-rose-200" role="alert">
              <p className="font-extrabold flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" /> Wayfinding Impediment:</p>
              <p className="mt-1.5 leading-relaxed text-slate-300">{routeError}</p>
            </div>
          )}

          {/* Path results */}
          {routeResult && (
            <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Route Guidance">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Estimated Walk</p>
                  <p className="text-3xl font-black text-white mt-0.5 font-mono">{routeResult.estimatedWalkingTimeMinutes} <span className="text-sm font-normal text-slate-400">mins</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Distance</p>
                  <p className="text-base font-extrabold text-blue-300 mt-1 font-mono">{routeResult.totalDistance} meters</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Plaza Congestion</span>
                  <span className="mt-1 block font-extrabold text-white">{routeResult.congestionSummary}</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Path Posture</span>
                  <span className="mt-1 block font-extrabold text-white">{routeResult.accessibilityStatus}</span>
                </div>
              </div>

              {/* Step list */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ChevronRight className="h-4 w-4 text-emerald-400" />
                  Tactical Route Nodes
                </h3>
                
                <ol className="relative ml-2.5 space-y-3.5 border-l border-slate-800 text-xs text-slate-300">
                  {routeResult.nodeNames.map((name, idx) => (
                    <li key={idx} className="mb-3 ml-4 last:mb-0">
                      <span className={`absolute -left-1.5 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                        idx === 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                        idx === routeResult.nodeNames.length - 1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse' : 'bg-slate-700'
                      }`} />
                      <span className="block font-bold text-white">{name}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {idx === 0 ? 'Departure sector' : idx === routeResult.nodeNames.length - 1 ? 'Destination gate' : 'Transit connector waypoint'}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* AI Explainer Box */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 mt-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <Languages className="h-4 w-4" />
                    AI Explainer
                  </h3>
                  <div>
                    <label htmlFor="lang-select" className="sr-only">Choose Language</label>
                    <select
                      id="lang-select"
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="en">EN</option>
                      <option value="es">ES</option>
                      <option value="de">DE</option>
                      <option value="fr">FR</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2.5">
                  {aiLoading ? (
                    <LoadingSkeleton lines={3} />
                  ) : (
                    <AIResponseCard content={aiExplanation || 'Wayfinding explanation will populate once a route is calculated.'} title="Route Assistant Brief" />
                  )}
                </div>

                {!aiPowered && !aiLoading && (
                  <span className="text-[10px] text-amber-500 block mt-2 font-semibold">
                    ⚠️ Offline navigation mode. Direct route telemetry active.
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Ask Copilot Assistant */}
          <section className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Copilot Terminal">
            <div className="mb-3.5 flex items-center gap-2 border-b border-white/5 pb-2.5">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Ask ArenaFlow Copilot</h2>
            </div>
            
            {/* Expanded naturally so no nested scroll traps */}
            <div className="space-y-3.5 p-1 text-xs">
              {chatHistory.length === 0 && (
                <p className="py-4 text-center text-slate-500 font-medium">Ask any questions about elevator locations, comfort rooms, or safety alerts.</p>
              )}
              {chatHistory.map((msg, idx) => (
                <ChatBubble key={`${msg.sender}-${idx}-${msg.text.slice(0, 12)}`} role={msg.sender === 'user' ? 'user' : 'copilot'} fallback={!msg.aiPowered}>
                  {msg.sender === 'assistant' ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <span className="whitespace-pre-line">{msg.text}</span>
                  )}
                </ChatBubble>
              ))}
              {chatLoading && (
                <p className="text-slate-400 text-[10px] animate-pulse">Copilot is checking records...</p>
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-1.5 pt-3 border-t border-white/5">
              <input
                type="text"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                aria-label="Type your message to the copilot"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all shadow"
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
