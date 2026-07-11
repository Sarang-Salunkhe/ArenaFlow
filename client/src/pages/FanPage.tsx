import React, { useEffect, useState } from 'react';
import { Accessibility, Route, ShieldAlert } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { FloatingAssistant } from '@/components/ui/FloatingAssistant';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
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

export function FanPage() {
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  
  // Navigation form state
  const [startNode, setStartNode] = useState<string>('METRO_STATION');
  const [destNode, setDestNode] = useState<string>('STAND_EAST');
  const [accessibilityRequired, setAccessibilityRequired] = useState<boolean>(false);
  
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
      // Automatically request AI explanation after a successful path calculation
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Mobile back navigation */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      <header className="mb-6">
        <SectionHeader
          eyebrow="Match-Day Fan Guide"
          title="Match-Day Companion"
          description="Live route guidance, alerts, services, and AI explanations for a premium stadium journey."
          action={<StatusBadge label={stadiumState ? stadiumState.matchPhase.replace(/_/g, ' ') : 'Live'} tone="success" />}
        />
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard label="Safety alerts" value={String(activeIncidents.length)} helper="Current stadium issues affecting fan movement" icon={ShieldAlert} tone={activeIncidents.length > 0 ? 'danger' : 'success'} />
        <KpiCard label="Accessibility" value={accessibilityRequired ? 'Enabled' : 'Standard'} helper="Preferred routing behaviour" icon={Accessibility} tone="default" />
        <KpiCard label="Route state" value={routeResult ? `${routeResult.estimatedWalkingTimeMinutes} min` : 'Idle'} helper="Fastest live path estimate" icon={Route} tone={routeResult ? 'success' : 'default'} />
      </section>

      {activeIncidents.length > 0 && (
        <section className="mb-6" aria-label="Safety Alerts">
          <AlertBanner
            title="Active Safety Alerts"
            message={activeIncidents.map(inc => `${inc.title}: ${inc.description}`).join(' • ')}
            tone="danger"
          />
        </section>
      )}

      {/* Main Path Search Form */}
      <section className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Route Search">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Navigation Card</h2>
        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div>
            <label htmlFor="start-node" className="mb-1 block text-xs font-semibold text-slate-300">
              Your Current Location:
            </label>
            <select
              id="start-node"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
            >
              {SELECTABLE_NODES.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dest-node" className="mb-1 block text-xs font-semibold text-slate-300">
              Where do you want to go?
            </label>
            <select
              id="dest-node"
              value={destNode}
              onChange={(e) => setDestNode(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
            >
              {SELECTABLE_NODES.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          {/* Accessibility Option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="access-req"
              checked={accessibilityRequired}
              onChange={(e) => setAccessibilityRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:outline-none"
            />
            <label htmlFor="access-req" className="text-xs font-medium text-slate-300">
              Accessibility Routing (Exclude stairs, use lifts)
            </label>
          </div>

          <button
            type="submit"
            disabled={routeLoading}
            className="w-full rounded-2xl bg-arena-success py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:bg-emerald-400"
          >
            {routeLoading ? 'Computing Safety Path...' : 'Find Route & Estimate Walk'}
          </button>
        </form>
      </section>

      {/* Path Results Panel */}
      {routeError && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-100" role="alert">
          <p className="font-bold">Detour / Route Obstruction:</p>
          <p className="mt-1 leading-relaxed">{routeError}</p>
        </div>
      )}

      {routeResult && (
        <section className="mb-6 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Route Results">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Walking Time</p>
              <p className="mt-0.5 text-3xl font-black text-white">{routeResult.estimatedWalkingTimeMinutes} mins</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400">Total distance</p>
              <p className="mt-0.5 text-base font-bold text-blue-100">{routeResult.totalDistance} meters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Selected Route:</span>
              <span className="mt-0.5 block font-semibold text-slate-100">{routeResult.congestionSummary}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Accessibility Status:</span>
              <span className="mt-0.5 block font-semibold text-slate-100">
                {routeResult.accessibilityStatus}
              </span>
            </div>
          </div>

          {/* Step-by-Step path */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Interactive Route Summary</h3>
            <ol className="relative ml-2 space-y-3.5 border-l border-slate-700 text-xs text-slate-300">
              {routeResult.nodeNames.map((name, idx) => (
                <li key={idx} className="mb-4 ml-4 last:mb-0">
                  <span className={`absolute -left-1.5 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    idx === 0 ? 'bg-emerald-500' :
                    idx === routeResult.nodeNames.length - 1 ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span className="block font-bold text-white">{name}</span>
                  <span className="text-[10px] text-slate-400">
                    {idx === 0 ? 'Start here' : idx === routeResult.nodeNames.length - 1 ? 'Your destination' : `Pass through sector`}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI explainer box */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-100">AI Route Explanation</h3>
              <div className="flex items-center gap-1">
                <label htmlFor="lang-select" className="sr-only">Choose Language</label>
                <select
                  id="lang-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-medium text-white focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div className="mt-2 min-h-[60px]">
              {aiLoading ? (
                <LoadingSkeleton lines={3} />
              ) : (
                <AIResponseCard content={aiExplanation || 'Wayfinding guidance is currently available from the live route engine.'} title="AI Route Brief" />
              )}
            </div>

            {!aiPowered && !aiLoading && (
              <span className="text-[10px] text-amber-600 block mt-2">
                Offline navigation service active. Showing direct route facts.
              </span>
            )}
          </div>
        </section>
      )}

      <FloatingAssistant role="FAN" selectedZoneId={destNode} stadiumState={stadiumState} />

      {/* Fan Copilot Chat Box */}
      <section className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Copilot Assistant">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-100">Ask ArenaFlow Copilot</h2>
        
        <div className="max-h-[180px] flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 text-xs">
          {chatHistory.length === 0 && (
            <p className="py-6 text-center text-slate-400">Ask me anything about lifts, food points, or incident updates.</p>
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
            <p className="text-slate-400 text-[10px] animate-pulse">Assistant is processing...</p>
          )}
        </div>

        <form onSubmit={handleSendChat} className="mt-3 flex gap-1">
          <input
            type="text"
            placeholder="Type your question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
            aria-label="Type your message to the copilot"
          />
          <button
            type="submit"
            className="rounded-2xl bg-arena-success px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
