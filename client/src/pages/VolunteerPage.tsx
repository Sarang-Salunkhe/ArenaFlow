import React, { useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
import { StadiumState, OperationalDecision, CopilotResponse } from '../types';

const SELECTABLE_ZONES = [
  { id: 'PLAZA_NORTH', name: 'North Entrance Plaza' },
  { id: 'PLAZA_SOUTH', name: 'South Entrance Plaza' },
  { id: 'CONCOURSE_LOWER', name: 'Lower Concourse' },
  { id: 'CONCOURSE_UPPER', name: 'Upper Concourse' },
  { id: 'STAND_NORTH', name: 'North Stand (Stairs)' },
  { id: 'STAND_SOUTH', name: 'South Stand (Stairs)' },
  { id: 'STAND_EAST', name: 'East Stand (Accessible)' },
  { id: 'STAND_WEST', name: 'West Stand (Accessible)' },
  { id: 'FOOD_COURT_A', name: 'Food Court A (Lower)' },
  { id: 'FOOD_COURT_B', name: 'Food Court B (Upper)' },
  { id: 'MEDICAL_POST_1', name: 'Medical Station 1' },
  { id: 'MEDICAL_POST_2', name: 'Medical Station 2' },
  { id: 'EMERGENCY_CORRIDOR', name: 'Emergency Corridor' },
];

export function VolunteerPage() {
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  const [decisions, setDecisions] = useState<OperationalDecision[]>([]);
  const [assignedZoneId, setAssignedZoneId] = useState<string>('PLAZA_NORTH');

  // Incident form state
  const [reportZone, setReportZone] = useState<string>('PLAZA_NORTH');
  const [incidentTitle, setIncidentTitle] = useState<string>('');
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [incidentDesc, setIncidentDesc] = useState<string>('');
  const [incidentStatus, setIncidentStatus] = useState<string | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [reportingLoading, setReportingLoading] = useState<boolean>(false);

  // Copilot State
  const [volunteerBrief, setVolunteerBrief] = useState<string>('Select your assigned zone above to view live briefs.');
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [briefAiPowered, setBriefAiPowered] = useState<boolean>(true);

  // Chat Q&A State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'assistant'; text: string; aiPowered: boolean }[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const fetchVolunteerData = async () => {
    try {
      const stateRes = await fetch('/api/stadium/state');
      const stateData = await stateRes.json();
      setStadiumState(stateData);

      const decisionsRes = await fetch('/api/operations/decisions');
      const decisionsData = await decisionsRes.json();
      setDecisions(decisionsData);
    } catch (err) {
      console.error('Error fetching volunteer data:', err);
    }
  };

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  // Fetch AI brief when assigned zone changes or stadium state updates
  useEffect(() => {
    if (stadiumState) {
      handleFetchBrief();
    }
  }, [assignedZoneId, stadiumState?.tickCount]);

  const handleFetchBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'VOLUNTEER', selectedZoneId: assignedZoneId }),
      });
      const data: CopilotResponse = await res.json();
      setVolunteerBrief(data.text);
      setBriefAiPowered(data.aiPowered);
    } catch (err) {
      console.error(err);
      setVolunteerBrief('Failed to retrieve active volunteer tasks brief.');
      setBriefAiPowered(false);
    } finally {
      setBriefLoading(false);
    }
  };

  // Submit field incident report
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle.trim() || !incidentDesc.trim()) {
      setIncidentError('All fields must be completed.');
      return;
    }
    setReportingLoading(true);
    setIncidentStatus(null);
    setIncidentError(null);

    try {
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: reportZone,
          title: incidentTitle.trim(),
          severity: incidentSeverity,
          description: incidentDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit incident');
      }

      setIncidentStatus('Incident reported successfully. Dispatch notified.');
      setIncidentTitle('');
      setIncidentDesc('');
      await fetchVolunteerData();
    } catch (err: any) {
      console.error(err);
      setIncidentError(err.message || 'Error sending report.');
    } finally {
      setReportingLoading(false);
    }
  };

  // Volunteer Q&A assistant chat
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
          role: 'VOLUNTEER',
          userPrompt: userMsg,
          selectedZoneId: assignedZoneId,
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
        { sender: 'assistant', text: 'Error contacting assistant.', aiPowered: false },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!stadiumState) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-900 p-8 text-white">
        <p className="text-lg animate-pulse" role="status">Syncing with Match Dispatch Network...</p>
      </div>
    );
  }

  const assignedZone = stadiumState.zones.find(z => z.id === assignedZoneId);
  const activeIncidents = stadiumState.incidents.filter(i => i.active);

  // Dynamic tasks filtered by the assigned zone
  const assignedTasks = decisions.filter(dec => dec.affectedLocations.includes(assignedZoneId));

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
      {/* Back button */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      {/* Title block */}
      <header className="mb-6 text-center">
        <span className="inline-block rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          Volunteer Support Portal
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">ArenaFlow Staff Assist</h1>
        <p className="mt-1 text-xs text-slate-500">Sector Instructions & Live Incident reporting</p>
      </header>

      {/* Zone assignment control */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6" aria-label="Zone Assignment">
        <label htmlFor="assigned-zone" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Your Assigned Sector:
        </label>
        <select
          id="assigned-zone"
          value={assignedZoneId}
          onChange={(e) => setAssignedZoneId(e.target.value)}
          className="w-full rounded-lg border border-slate-350 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
        >
          {SELECTABLE_ZONES.map(z => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </section>

      {/* Sector Live Briefing */}
      {assignedZone && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 mb-6" aria-label="Sector Telemetry">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">Sector telemetry: {assignedZone.name}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              assignedZone.attentionLevel === 'CRITICAL' ? 'bg-red-150 text-red-700' :
              assignedZone.attentionLevel === 'HIGH' ? 'bg-orange-150 text-orange-700' :
              assignedZone.attentionLevel === 'WATCH' ? 'bg-amber-150 text-amber-700' : 'bg-slate-100 text-slate-700'
            }`}>
              Risk: {assignedZone.riskScore}
            </span>
          </div>

          {/* AI Task Brief */}
          <div className="rounded-lg border border-slate-150 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamic Task Briefing</h3>
              {!briefAiPowered && (
                <span className="text-[9px] font-sans font-medium text-amber-600">Offline Fallback</span>
              )}
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-sans min-h-[60px] whitespace-pre-line">
              {briefLoading ? 'Syncing latest task directives...' : volunteerBrief}
            </div>
          </div>

          {/* Task checklist derived from engines */}
          {assignedTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operational Directives</h3>
              <ul className="space-y-2">
                {assignedTasks.map(dec => (
                  <li key={dec.id} className="flex items-start gap-2 bg-amber-50/50 rounded border border-amber-200 p-3 text-xs text-amber-800">
                    <span className="mt-0.5" aria-hidden="true">📋</span>
                    <div>
                      <p className="font-bold text-slate-900">{dec.title}</p>
                      <p className="mt-1 leading-normal text-slate-700">{dec.communicationRequired.volunteerInstruction}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Live Stadium Announcements */}
      {activeIncidents.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6" aria-label="Field Emergency Broadcasts">
          <h2 className="text-xs font-bold text-red-800 uppercase tracking-wider">⚠️ Dispatch Broadcast Alerts</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-red-700 leading-normal">
            {activeIncidents.map(inc => (
              <li key={inc.id}>
                • <span className="font-semibold">{inc.title}</span>: {inc.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Incident Reporting Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6" aria-label="Report Field Incident">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Report Field Incident</h2>
        
        {incidentStatus && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 p-3.5 mb-4" role="status">
            {incidentStatus}
          </div>
        )}

        {incidentError && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 p-3.5 mb-4" role="alert">
            {incidentError}
          </div>
        )}

        <form onSubmit={handleReportIncident} className="space-y-4">
          <div>
            <label htmlFor="report-zone" className="block text-xs font-semibold text-slate-600 mb-1">Incident Location:</label>
            <select
              id="report-zone"
              value={reportZone}
              onChange={(e) => setReportZone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none"
            >
              {SELECTABLE_ZONES.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="incident-title" className="block text-xs font-semibold text-slate-600 mb-1">Issue / Title:</label>
              <input
                id="incident-title"
                type="text"
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                placeholder="e.g. Crowd block"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="incident-severity" className="block text-xs font-semibold text-slate-600 mb-1">Severity Rating:</label>
              <select
                id="incident-severity"
                value={incidentSeverity}
                onChange={(e) => setIncidentSeverity(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="LOW">Low (Hazard)</option>
                <option value="MEDIUM">Medium (Crowding)</option>
                <option value="HIGH">High (Obstruction)</option>
                <option value="CRITICAL">Critical (Medical/Safety)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-desc" className="block text-xs font-semibold text-slate-600 mb-1">Description:</label>
            <textarea
              id="incident-desc"
              rows={3}
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              placeholder="Provide exact details to operations center..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={reportingLoading}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:bg-amber-300"
          >
            {reportingLoading ? 'Filing incident report...' : 'Submit Incident to Dispatch'}
          </button>
        </form>
      </section>

      {/* Volunteer Copilot chat */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col" aria-label="Volunteer Copilot">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Volunteer Support Copilot</h2>
        
        <div className="flex-1 overflow-y-auto p-2.5 max-h-[140px] border border-slate-100 rounded-lg space-y-3 bg-slate-50 text-xs">
          {chatHistory.length === 0 && (
            <p className="text-slate-400 text-center py-6">Need helper checklists or evacuation guides? Ask Copilot.</p>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded px-3 py-1.5 max-w-[85%] ${
                msg.sender === 'user' ? 'bg-amber-500 text-slate-950 font-medium' : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                {msg.text}
              </div>
              {!msg.aiPowered && msg.sender === 'assistant' && (
                <span className="text-[9px] text-amber-600 mt-0.5">⚠️ Offline Response</span>
              )}
            </div>
          ))}
          {chatLoading && (
            <p className="text-slate-400 text-[10px] animate-pulse">Copilot is thinking...</p>
          )}
        </div>

        <form onSubmit={handleSendChat} className="mt-3 flex gap-1">
          <input
            type="text"
            placeholder="Ask sector coordinator..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-350 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
            aria-label="Type your message to the volunteer coordinator"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 text-xs transition-colors"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
