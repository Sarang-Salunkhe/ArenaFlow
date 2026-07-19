import React, { useEffect, useState } from 'react';
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
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // Load stadium state for alert banners
  const fetchStadiumState = async () => {
    try {
      const res = await fetch('/api/stadium/state');
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
      const res = await fetch('/api/routes/calculate', {
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
      const res = await fetch('/api/ai/assist', {
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
      const res = await fetch('/api/ai/assist', {
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
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      {/* High-Fidelity World Cup Fan Matchday Portal Header */}
      <header className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-slate-900/40 p-6 shadow-2xl mb-6 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                🏆 WORLD CUP 2026™ FAN COMPANION
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Section Gateways</span>
            </div>
            
            {/* Team Header Display */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-sans">🇺🇸 USA</span>
                <span className="text-xs text-slate-400 font-medium">vs</span>
                <span className="text-sm font-black text-white font-sans">🇩🇪 GERMANY</span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">• Group Stage Match 18</span>
            </div>

            <p className="text-xs text-slate-400 mt-1.5 max-w-xl">
              Wayfinding navigation optimized dynamically from crowd posture sensors. Avoid crowded stairs or lift queues.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-white/5 shrink-0 self-start sm:self-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sim Phase:</span>
            <StatusBadge label={stadiumState ? stadiumState.matchPhase.replace(/_/g, ' ') : 'PRE MATCH'} tone="success" />
          </div>
        </div>
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
              label="Active Safety Alerts" 
              value={String(activeIncidents.length)} 
              helper={activeIncidents.length > 0 ? `${activeIncidents.length} hazard reports` : "Concourse routes clear"} 
              icon={ShieldAlert} 
              tone={activeIncidents.length > 0 ? 'danger' : 'success'} 
            />
            <KpiCard 
              label="Path Mode" 
              value={accessibilityRequired ? 'Step-Free Active' : 'Standard Paths'} 
              helper={accessibilityRequired ? "Ramps & lifts prioritized" : "Stairs and plazas included"} 
              icon={Accessibility} 
              tone={accessibilityRequired ? 'success' : 'default'} 
            />
            <KpiCard 
              label="Walking Estimate" 
              value={routeResult ? `${routeResult.estimatedWalkingTimeMinutes} mins` : 'Select Destination'} 
              helper={routeResult ? `Physical distance: ${routeResult.totalDistance}m` : "Select points to calculate"} 
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

              {/* Wayfinding and Accessibility Quick Presets */}
              <div className="pt-1.5 pb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">♿ Accessibility & Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStartNode('METRO_STATION');
                      setDestNode('STAND_EAST');
                      setAccessibilityRequired(true);
                    }}
                    className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-2 py-1 text-[10px] font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    ♿ Step-Free East Stand
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartNode('PLAZA_NORTH');
                      setDestNode('MEDICAL_POST_1');
                      setAccessibilityRequired(false);
                    }}
                    className="rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 px-2 py-1 text-[10px] font-medium hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    🩺 Medical Station 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartNode('METRO_STATION');
                      setDestNode('FOOD_COURT_A');
                      setAccessibilityRequired(false);
                    }}
                    className="rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 px-2 py-1 text-[10px] font-medium hover:bg-blue-500/20 transition-all cursor-pointer"
                  >
                    🍔 Food Court A
                  </button>
                </div>
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
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {routeLoading ? 'Calculating optimal safe path...' : 'Calculate Wayfinding & Travel Time'}
              </button>
            </form>
          </section>

          {/* Nearby Stadium Services & Interactive Ordering */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Concessions & Souvenirs</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Live preorder active</span>
            </div>

            {orderStatus && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 font-bold leading-relaxed relative animate-in fade-in zoom-in-95 duration-150">
                <button 
                  onClick={() => setOrderStatus(null)} 
                  className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-200 font-extrabold text-xs cursor-pointer"
                  aria-label="Close message"
                >
                  ✕
                </button>
                <div className="flex items-start gap-2">
                  <span className="text-base">🎉</span>
                  <div>
                    <p className="font-extrabold">Matchday Lock-in Confirmed!</p>
                    <p className="mt-1 text-[11px] text-slate-300 font-normal">{orderStatus}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {[
                { name: "Official USA vs GER Match Scarf", price: "$28.00", icon: "🧣", desc: "Premium knit commemorative match souvenir", id: " scarf" },
                { name: "Classic Arena Double Burger Meal", price: "$15.50", icon: "🍔", desc: "Flame-grilled beef, cheese, crispy fries & soda", id: "burger" },
                { name: "FIFA 2026 Souvenir Matchday Program", price: "$10.00", icon: "📖", desc: "Collector's edition team lineups & roster review", id: "program" },
                { name: "Chilled Premium Lager Can (16oz)", price: "$9.50", icon: "🍺", desc: "Served cold, must verify age at priority counter", id: "lager" }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3.5 hover:border-white/10 transition-colors gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg p-2 rounded-xl bg-slate-900 border border-white/5 mt-0.5 shrink-0">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <span className="text-xs font-black text-emerald-400 font-mono">{item.price}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = 'WC26-' + Math.random().toString(36).substr(2, 4).toUpperCase();
                        setOrderStatus(`Reservation Code: ${randomCode}. Your item is locked for pickup at Food Court A (Lower Concourse). Show this receipt stub at the fast-track counter to complete purchase!`);
                      }}
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 text-[10px] font-black tracking-wide transition-all shadow cursor-pointer"
                    >
                      Pre-order
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Default location list backup */}
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 leading-normal">
              <span className="font-bold text-white block mb-1">📍 Nearest Concourse Points of Interest:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {nearbyServices.map((srv, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-300">{srv.name}</strong> - {srv.distance} away ({srv.detail})
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Results & AI explanation (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Official Matchday Pass Ticket */}
          <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-5 shadow-2xl relative overflow-hidden" aria-label="Digital Match Ticket">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
            
            {/* Top Ticket Header */}
            <div className="flex items-center justify-between border-b border-dashed border-slate-700/60 pb-3 mb-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Official Entry Pass</span>
              <span className="rounded bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[8px] font-black text-yellow-400 uppercase tracking-widest">
                FIFA VIP ACCESS
              </span>
            </div>

            {/* Stadium / Match Info */}
            <div className="flex justify-between items-center gap-4 mb-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Event Location</p>
                <p className="text-xs font-black text-white">MetLife Stadium, NJ</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-slate-500">Date & Kickoff</p>
                <p className="text-xs font-black text-white font-mono">June 18, 2026 • 20:00</p>
              </div>
            </div>

            {/* Seat & Row Coordinates */}
            <div className="grid grid-cols-4 gap-2 bg-slate-900/60 rounded-xl border border-white/5 p-2.5 mb-4 text-center">
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Gate</span>
                <span className="text-xs font-black text-blue-400 font-mono">B-East</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Sector</span>
                <span className="text-xs font-black text-white font-mono">East</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Row</span>
                <span className="text-xs font-black text-white font-mono">14</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Seat</span>
                <span className="text-xs font-black text-emerald-400 font-mono">12</span>
              </div>
            </div>

            {/* Simulated Barcode / QR Code */}
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-inner border border-slate-300">
              {/* QR Code Grid Box */}
              <div className="h-28 w-28 bg-slate-100 flex items-center justify-center relative p-1.5 border border-slate-200 rounded-lg">
                <svg viewBox="0 0 100 100" className="h-full w-full fill-slate-900">
                  <rect x="0" y="0" width="25" height="25" />
                  <rect x="5" y="5" width="15" height="15" className="fill-white" />
                  <rect x="10" y="10" width="5" height="5" />
                  
                  <rect x="75" y="0" width="25" height="25" />
                  <rect x="80" y="5" width="15" height="15" className="fill-white" />
                  <rect x="85" y="10" width="5" height="5" />
                  
                  <rect x="0" y="75" width="25" height="25" />
                  <rect x="5" y="80" width="15" height="15" className="fill-white" />
                  <rect x="10" y="85" width="5" height="5" />
                  
                  {/* Random QR bits */}
                  <rect x="35" y="10" width="10" height="5" />
                  <rect x="50" y="5" width="5" height="15" />
                  <rect x="60" y="20" width="10" height="10" />
                  <rect x="15" y="35" width="20" height="5" />
                  <rect x="40" y="40" width="15" height="15" />
                  <rect x="10" y="55" width="5" height="10" />
                  <rect x="65" y="50" width="15" height="5" />
                  <rect x="80" y="40" width="10" height="20" />
                  <rect x="30" y="65" width="25" height="10" />
                  <rect x="65" y="75" width="15" height="15" />
                  <rect x="35" y="85" width="10" height="5" />
                  <rect x="50" y="80" width="5" height="15" />
                </svg>
              </div>
              <span className="text-[8px] font-mono font-bold tracking-[0.3em] text-slate-500 mt-2">MEMBER_48920_VIP</span>
            </div>

            {/* Micro warning */}
            <p className="text-[9px] text-center text-slate-500 mt-3 leading-normal">
              Keep this QR pass active. Dynamic gates will authenticate and record entry telemetry at Plaza East.
            </p>
          </section>
          
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
