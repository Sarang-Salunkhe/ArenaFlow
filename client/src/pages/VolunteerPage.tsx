import React, { useEffect, useState } from 'react';
import { ClipboardList, MapPinned, ShieldAlert } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { FloatingAssistant } from '@/components/ui/FloatingAssistant';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { LoadingState } from '@/components/ui/LoadingState';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
      <div className="flex flex-1 items-center justify-center bg-slate-950 p-8 text-white">
        <LoadingState label="Syncing with Match Dispatch Network..." />
      </div>
    );
  }

  const assignedZone = stadiumState.zones.find(z => z.id === assignedZoneId);
  const activeIncidents = Array.from(
    new Map(stadiumState.incidents.filter(i => i.active).map(incident => [incident.id, incident])).values(),
  );

  // Dynamic tasks filtered by the assigned zone
  const assignedTasks = decisions.filter(dec => dec.affectedLocations.includes(assignedZoneId));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      <header className="mb-6">
        <SectionHeader
          eyebrow="Volunteer Support Portal"
          title="Volunteer Mission Console"
          description="Assigned-zone mission brief, priority tasks, dispatch broadcasts, and incident reporting."
          action={<StatusBadge label={`${stadiumState.matchPhase.replace(/_/g, ' ')}`} tone="warning" />}
        />
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard label="Assigned zone" value={assignedZone?.name ?? assignedZoneId} helper="Live sector posture" icon={MapPinned} />
        <KpiCard label="Dispatch alerts" value={String(activeIncidents.length)} helper="Field incidents requiring attention" icon={ShieldAlert} tone={activeIncidents.length > 0 ? 'danger' : 'success'} />
        <KpiCard label="Directives" value={String(assignedTasks.length)} helper="Volunteer actions linked to active decisions" icon={ClipboardList} tone="default" />
      </section>

      {activeIncidents.length > 0 && (
        <section className="mb-6">
          <AlertBanner
            title="Dispatch Broadcast Alerts"
            message={activeIncidents.map(inc => `${inc.title}: ${inc.description}`).join(' • ')}
            tone="warning"
          />
        </section>
      )}

      {/* Zone assignment control */}
      <section className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Zone Assignment">
        <label htmlFor="assigned-zone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
          Your Assigned Sector:
        </label>
        <select
          id="assigned-zone"
          value={assignedZoneId}
          onChange={(e) => setAssignedZoneId(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
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
        <section className="mb-6 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Sector Telemetry">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white">Current Mission: {assignedZone.name}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              assignedZone.attentionLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-100' :
              assignedZone.attentionLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-100' :
              assignedZone.attentionLevel === 'WATCH' ? 'bg-amber-500/20 text-amber-100' : 'bg-slate-800 text-slate-200'
            }`}>
              Risk: {assignedZone.riskScore}
            </span>
          </div>

          {/* AI Task Brief */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-100">AI Volunteer Assistant</h3>
              {!briefAiPowered && (
                <span className="text-[9px] font-sans font-medium text-amber-300">Offline Fallback</span>
              )}
            </div>
            <div className="min-h-[60px]">
              {briefLoading ? (
                <LoadingSkeleton lines={3} />
              ) : (
                <AIResponseCard content={volunteerBrief} title="Volunteer Mission Brief" />
              )}
            </div>
          </div>

          {/* Task checklist derived from engines */}
          {assignedTasks.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">Priority Tasks</h3>
              <ul className="space-y-2">
                {assignedTasks.map(dec => (
                  <li key={dec.id} className="flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                    <span className="mt-0.5" aria-hidden="true">Task</span>
                    <div>
                      <p className="font-bold text-white">{dec.title}</p>
                      <p className="mt-1 leading-normal text-slate-200">{dec.communicationRequired.volunteerInstruction}</p>
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
        <section className="mb-6 rounded-[28px] border border-red-400/30 bg-red-500/10 p-4" aria-label="Field Emergency Broadcasts">
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-100">Recent Broadcasts</h2>
          <ul className="mt-2 space-y-1.5 text-xs leading-normal text-red-100">
            {activeIncidents.map(inc => (
              <li key={inc.id}>
                <span className="font-semibold">{inc.title}</span>: {inc.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Incident Reporting Form */}
      <section className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Report Field Incident">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-100">Incident Reporting</h2>
        
        {incidentStatus && (
          <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-100" role="status">
            {incidentStatus}
          </div>
        )}

        {incidentError && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-xs text-red-100" role="alert">
            {incidentError}
          </div>
        )}

        <form onSubmit={handleReportIncident} className="space-y-4">
          <div>
            <label htmlFor="report-zone" className="mb-1 block text-xs font-semibold text-slate-300">Incident Location:</label>
            <select
              id="report-zone"
              value={reportZone}
              onChange={(e) => setReportZone(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:outline-none"
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
              <label htmlFor="incident-title" className="mb-1 block text-xs font-semibold text-slate-300">Issue / Title:</label>
              <input
                id="incident-title"
                type="text"
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                placeholder="e.g. Crowd block"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="incident-severity" className="mb-1 block text-xs font-semibold text-slate-300">Severity Rating:</label>
              <select
                id="incident-severity"
                value={incidentSeverity}
                onChange={(e) => setIncidentSeverity(e.target.value as any)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="LOW">Low (Hazard)</option>
                <option value="MEDIUM">Medium (Crowding)</option>
                <option value="HIGH">High (Obstruction)</option>
                <option value="CRITICAL">Critical (Medical/Safety)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-desc" className="mb-1 block text-xs font-semibold text-slate-300">Description:</label>
            <textarea
              id="incident-desc"
              rows={3}
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              placeholder="Provide exact details to operations center..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={reportingLoading}
            className="w-full rounded-2xl bg-arena-warning py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:bg-amber-300"
          >
            {reportingLoading ? 'Filing incident report...' : 'Submit Incident to Dispatch'}
          </button>
        </form>
      </section>

      <FloatingAssistant role="VOLUNTEER" selectedZoneId={assignedZoneId} stadiumState={stadiumState} />

      {/* Volunteer Copilot chat */}
      <section className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/25 backdrop-blur" aria-label="Volunteer Copilot">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-100">Communication Panel</h2>
        
        <div className="max-h-[180px] flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 text-xs">
          {chatHistory.length === 0 && (
            <p className="text-slate-400 text-center py-6">Need helper checklists or evacuation guides? Ask Copilot.</p>
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
            <p className="text-slate-400 text-[10px] animate-pulse">Copilot is thinking...</p>
          )}
        </div>

        <form onSubmit={handleSendChat} className="mt-3 flex gap-1">
          <input
            type="text"
            placeholder="Ask sector coordinator..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            aria-label="Type your message to the volunteer coordinator"
          />
          <button
            type="submit"
            className="rounded-2xl bg-arena-warning px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
