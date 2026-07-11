import React, { useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
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
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
      {/* Mobile back navigation */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      {/* Header and Brand */}
      <header className="mb-6 text-center">
        <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          Match-Day Fan Guide
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">ArenaFlow Wayfinding</h1>
        <p className="mt-1 text-xs text-slate-500">Fictional Match Operations & Navigation Assistant</p>
      </header>

      {/* Active Safety Bulletins */}
      {activeIncidents.length > 0 && (
        <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4" aria-label="Safety Alerts">
          <h2 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
            ⚠️ Active Safety Alerts
          </h2>
          <div className="mt-2 space-y-1.5 text-xs text-red-700 leading-relaxed">
            {activeIncidents.map(inc => (
              <div key={inc.id} className="border-b border-red-100 pb-1.5 last:border-0 last:pb-0">
                <span className="font-semibold">{inc.title}</span>: {inc.description}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Path Search Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6" aria-label="Route Search">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Calculate Direct Route</h2>
        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div>
            <label htmlFor="start-node" className="block text-xs font-semibold text-slate-600 mb-1">
              Your Current Location:
            </label>
            <select
              id="start-node"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              {SELECTABLE_NODES.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dest-node" className="block text-xs font-semibold text-slate-600 mb-1">
              Where do you want to go?
            </label>
            <select
              id="dest-node"
              value={destNode}
              onChange={(e) => setDestNode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
            <label htmlFor="access-req" className="text-xs font-medium text-slate-700">
              ♿ Accessibility Routing (Exclude stairs, use lifts)
            </label>
          </div>

          <button
            type="submit"
            disabled={routeLoading}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:bg-emerald-400"
          >
            {routeLoading ? 'Computing Safety Path...' : 'Find Route & Estimate Walk'}
          </button>
        </form>
      </section>

      {/* Path Results Panel */}
      {routeError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 mb-6" role="alert">
          <p className="font-bold">Detour / Route Obstruction:</p>
          <p className="mt-1 leading-relaxed">{routeError}</p>
        </div>
      )}

      {routeResult && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 mb-6" aria-label="Route Results">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Estimated walking time</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{routeResult.estimatedWalkingTimeMinutes} mins</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total distance</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{routeResult.totalDistance} meters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded p-2.5 border border-slate-100">
              <span className="text-slate-500 block uppercase tracking-wider">Path Safety:</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{routeResult.congestionSummary}</span>
            </div>
            <div className="bg-slate-50 rounded p-2.5 border border-slate-100">
              <span className="text-slate-500 block uppercase tracking-wider">Accessibility:</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {routeResult.accessibilityStatus}
              </span>
            </div>
          </div>

          {/* Step-by-Step path */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detour Guidance / Steps</h3>
            <ol className="relative border-l border-slate-200 ml-2 space-y-3.5 text-xs text-slate-700">
              {routeResult.nodeNames.map((name, idx) => (
                <li key={idx} className="mb-4 ml-4 last:mb-0">
                  <span className={`absolute -left-1.5 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    idx === 0 ? 'bg-emerald-500' :
                    idx === routeResult.nodeNames.length - 1 ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span className="font-bold text-slate-900 block">{name}</span>
                  <span className="text-[10px] text-slate-500">
                    {idx === 0 ? 'Start here' : idx === routeResult.nodeNames.length - 1 ? 'Your destination' : `Pass through sector`}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI explainer box */}
          <div className="rounded-lg border border-slate-150 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Route Brief</h3>
              <div className="flex items-center gap-1">
                <label htmlFor="lang-select" className="sr-only">Choose Language</label>
                <select
                  id="lang-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded bg-white border border-slate-300 text-[10px] py-0.5 px-1 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-700 leading-relaxed font-sans min-h-[60px]">
              {aiLoading ? (
                <p className="text-slate-400 animate-pulse">Translating path details with AI...</p>
              ) : (
                aiExplanation
              )}
            </div>

            {!aiPowered && !aiLoading && (
              <span className="text-[10px] text-amber-600 block mt-2">
                ⚠️ offline navigation service active — showing direct route facts.
              </span>
            )}
          </div>
        </section>
      )}

      {/* Fan Copilot Chat Box */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col" aria-label="Copilot Assistant">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Ask ArenaFlow Copilot</h2>
        
        <div className="flex-1 overflow-y-auto p-2.5 max-h-[160px] border border-slate-100 rounded-lg space-y-3 bg-slate-50 text-xs">
          {chatHistory.length === 0 && (
            <p className="text-slate-400 text-center py-6">Ask me anything about lifts, food points, or incident updates.</p>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded px-3 py-1.5 max-w-[85%] ${
                msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                {msg.text}
              </div>
              {!msg.aiPowered && msg.sender === 'assistant' && (
                <span className="text-[9px] text-amber-600 mt-0.5">⚠️ Offline Response</span>
              )}
            </div>
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
            className="flex-1 rounded-lg border border-slate-350 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            aria-label="Type your message to the copilot"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
