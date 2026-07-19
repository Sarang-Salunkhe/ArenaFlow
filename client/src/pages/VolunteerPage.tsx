import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  MapPinned, 
  ShieldAlert, 
  AlertTriangle,
  Radio, 
  HelpCircle,
  Megaphone
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
  
  const { setSelectedZoneId: setGlobalZoneId, setStadiumState: setGlobalStadiumState } = useAssistant();

  useEffect(() => {
    setGlobalZoneId(assignedZoneId);
  }, [assignedZoneId, setGlobalZoneId]);

  useEffect(() => {
    setGlobalStadiumState(stadiumState);
  }, [stadiumState, setGlobalStadiumState]);

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

  // Interactive Volunteer States
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [equipmentStatus, setEquipmentStatus] = useState<Record<string, string>>({
    megaphone: 'OK (Charged)',
    radio: 'Active Link',
    firstaid: 'Inspected',
    keycard: 'Verified'
  });
  const [equipmentReportMsg, setEquipmentReportMsg] = useState<string | null>(null);

  // Live ticking shift countdown timer
  const [shiftSeconds, setShiftSeconds] = useState<number>(2 * 3600 + 44 * 60 + 18);
  useEffect(() => {
    const interval = setInterval(() => {
      setShiftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatShiftTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`;
  };

  const getCompassHeading = (zoneId: string) => {
    switch (zoneId) {
      case 'PLAZA_NORTH': return { heading: '350° N', desc: 'Gates A & C • Transit Hub North', rotation: 350 };
      case 'PLAZA_SOUTH': return { heading: '170° S', desc: 'Gates B & D • Transit Hub South', rotation: 170 };
      case 'CONCOURSE_LOWER': return { heading: '90° E', desc: 'Sections 101-140 • Food Court A', rotation: 90 };
      case 'CONCOURSE_UPPER': return { heading: '270° W', desc: 'Sections 201-240 • Food Court B', rotation: 270 };
      case 'STAND_NORTH': return { heading: '0° N', desc: 'Lower Bowls • Section A-F', rotation: 0 };
      case 'STAND_SOUTH': return { heading: '180° S', desc: 'Lower Bowls • Section G-M', rotation: 180 };
      case 'STAND_EAST': return { heading: '90° E', desc: 'ADA Access Corridor East', rotation: 90 };
      case 'STAND_WEST': return { heading: '270° W', desc: 'ADA Access Corridor West', rotation: 270 };
      default: return { heading: '45° NE', desc: 'Wayfinding routing active', rotation: 45 };
    }
  };

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
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 min-h-screen text-slate-100 bg-slate-950">
        {/* Back button */}
        <div className="mb-4">
          <BackLink label="Back to Launcher" />
        </div>

        {/* High-Fidelity World Cup Volunteer Console Header */}
        <header className="relative overflow-hidden rounded-3xl border border-amber-500/10 bg-slate-900/40 p-6 shadow-2xl mb-6 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                  🛡️ WORLD CUP 2026™ VOLUNTEER SQUAD
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Radio Uplink Channel 4 Active</span>
              </div>
              
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white font-sans">🇺🇸 USA</span>
                  <span className="text-xs text-slate-400 font-medium">vs</span>
                  <span className="text-sm font-black text-white font-sans">🇩🇪 GERMANY</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">• Group Stage Match 18</span>
              </div>

              <p className="text-xs text-slate-400 mt-1.5 max-w-xl">
                Execute playbooks and direct fan wayfinding based on sector dispatch feeds. Report blockages or safety events immediately.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-white/5 shrink-0 self-start sm:self-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sim Phase:</span>
              <StatusBadge label="Syncing..." tone="neutral" />
            </div>
          </div>
        </header>

        {/* KPI stats skeleton */}
        <section className="mb-6 responsive-kpi-grid gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </section>

        {/* Sector Control Panel placeholder */}
        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md opacity-50 pointer-events-none" aria-label="Zone Selection">
          <label htmlFor="assigned-zone-loading" className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Select Your Assigned Station:
          </label>
          <select
            id="assigned-zone-loading"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-500"
            disabled
          >
            <option>Loading assigned station telemetry...</option>
          </select>
        </section>

        {/* Main Console Grid */}
        <div className="responsive-dashboard-grid gap-6">
          
          {/* LEFT COLUMN: Mission & Tasks */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Mission Briefing Loading">
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded-full w-24 animate-pulse" />
                  <div className="h-4 bg-slate-700 rounded-lg w-40 animate-pulse" />
                </div>
                <div className="h-6 bg-slate-800 rounded-full w-28 animate-pulse" />
              </div>

              {/* AI Mission Briefing Box Skeleton */}
              <div className="mt-4 rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-3 animate-pulse">
                <div className="h-3 bg-slate-800 rounded-full w-32" />
                <div className="space-y-2">
                  <div className="h-2 bg-slate-800 rounded-full w-full" />
                  <div className="h-2 bg-slate-800 rounded-full w-5/6" />
                </div>
              </div>

              {/* Priority Tasks Skeleton */}
              <div className="mt-5 pt-4 border-t border-white/5 space-y-3 animate-pulse">
                <div className="h-3 bg-slate-800 rounded-full w-28" />
                <div className="h-16 bg-slate-950/20 border border-white/5 rounded-xl" />
              </div>
            </section>

            {/* Incident Reporting Form (Disabled/Pulsing) */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md opacity-50 pointer-events-none" aria-label="Incident Form">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Tactical Dispatch Portal</h2>
                </div>
              </div>
              <div className="h-32 bg-slate-950/30 rounded-2xl border border-slate-800 animate-pulse" />
            </section>
          </div>

          {/* RIGHT COLUMN: AI Copilot */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            <CopilotSkeleton />
          </div>
        </div>
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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <BackLink label="Back to Launcher" />
      </div>

      {/* High-Fidelity World Cup Volunteer Console Header */}
      <header className="relative overflow-hidden rounded-3xl border border-amber-500/10 bg-slate-900/40 p-6 shadow-2xl mb-6 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                🛡️ WORLD CUP 2026™ VOLUNTEER SQUAD
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Radio Uplink Channel 4 Active</span>
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
              Execute playbooks and direct fan wayfinding based on sector dispatch feeds. Report blockages or safety events immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-white/5 shrink-0 self-start sm:self-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sim Phase:</span>
            <StatusBadge label={`${stadiumState.matchPhase.replace(/_/g, ' ')}`} tone="warning" />
          </div>
        </div>
      </header>

      {/* KPI stats */}
      <section className="mb-6 responsive-kpi-grid gap-4">
        <KpiCard 
          label="Assigned Sector" 
          value={assignedZone?.name ?? assignedZoneId} 
          helper="Your active patrol station" 
          icon={MapPinned} 
        />
        <KpiCard 
          label="Dispatch Alerts" 
          value={String(activeIncidents.length)} 
          helper={activeIncidents.length > 0 ? "Dispatch teams deployed" : "No active emergencies"} 
          icon={ShieldAlert} 
          tone={activeIncidents.length > 0 ? 'danger' : 'success'} 
        />
        <KpiCard 
          label="Directives" 
          value={String(assignedTasks.length)} 
          helper={assignedTasks.length > 0 ? "Fulfill custom checklists" : "Standard patrol duties"} 
          icon={ClipboardList} 
          tone={assignedTasks.length > 0 ? 'warning' : 'default'} 
        />
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

      {/* Sector Control Panel */}
      <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Zone Selection">
        <label htmlFor="assigned-zone" className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Select Your Assigned Station:
        </label>
        <select
          id="assigned-zone"
          value={assignedZoneId}
          onChange={(e) => setAssignedZoneId(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
        >
          {SELECTABLE_ZONES.map(z => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </section>

      {/* Main Console Grid (No nested scroll zones) */}
      <div className="responsive-dashboard-grid gap-6">
        
        {/* LEFT COLUMN: Mission & Tasks (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Current Assignment details */}
          {assignedZone && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Mission Briefing">
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Station Assignment</span>
                  <h2 className="text-sm font-extrabold text-white mt-0.5">{assignedZone.name}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                  assignedZone.attentionLevel === 'CRITICAL' ? 'bg-red-500/20 border border-red-500/30 text-red-200' :
                  assignedZone.attentionLevel === 'HIGH' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-200' :
                  assignedZone.attentionLevel === 'WATCH' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-300'
                }`}>
                  Risk Score: {assignedZone.riskScore}
                </span>
              </div>

              {/* Dynamic Station Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
                {/* Left side: AI Mission brief (7 cols) */}
                <div className="md:col-span-7 rounded-2xl border border-white/5 bg-slate-950/60 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                        AI Mission Briefing
                      </h3>
                      {!briefAiPowered && (
                        <span className="text-[9px] font-bold text-amber-400 uppercase">Factual Backup</span>
                      )}
                    </div>
                    
                    <div className="text-xs leading-relaxed text-slate-200">
                      {briefLoading ? (
                        <LoadingSkeleton lines={3} />
                      ) : (
                        <AIResponseCard content={volunteerBrief} title="Sector Mission Directive" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Dynamic Seating & Transit Wayfinding Compass (5 cols) */}
                <div className="md:col-span-5 rounded-2xl border border-white/5 bg-slate-950/60 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">WAYFINDING COMPASS</span>
                    
                    <div className="flex items-center gap-4">
                      {/* Compass Circle graphic */}
                      <div className="relative h-16 w-16 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-900 overflow-hidden shrink-0">
                        {/* Dial marks */}
                        <div className="absolute inset-0 border border-dashed border-white/5 rounded-full" />
                        <span className="absolute top-1 text-[7px] font-bold text-slate-600 font-mono">N</span>
                        <span className="absolute bottom-1 text-[7px] font-bold text-slate-600 font-mono">S</span>
                        <span className="absolute right-1 text-[7px] font-bold text-slate-600 font-mono">E</span>
                        <span className="absolute left-1 text-[7px] font-bold text-slate-600 font-mono">W</span>

                        {/* Rotating indicator needle */}
                        <div 
                          className="h-full w-1 transition-all duration-1000 ease-out relative"
                          style={{ transform: `rotate(${getCompassHeading(assignedZoneId).rotation}deg)` }}
                        >
                          {/* Red needle tip */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-1 bg-amber-500 rounded-full" />
                        </div>
                      </div>

                      {/* Direction descriptions */}
                      <div className="text-xs">
                        <span className="block text-[13px] font-black text-amber-400 font-mono">{getCompassHeading(assignedZoneId).heading}</span>
                        <p className="text-slate-400 leading-snug mt-1 font-medium">{getCompassHeading(assignedZoneId).desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 font-semibold uppercase leading-normal">
                    Assisting sector spectator ingress/egress wayfinding.
                  </div>
                </div>
              </div>

              {/* Dynamic Sector Checklists & Progress Tracker */}
              <div className="mt-5 pt-4 border-t border-white/5">
                {(() => {
                  const ROUTINE_TASKS = [
                    { id: 'routine-1', title: 'Verify Accessible Pathways', desc: 'Ensure elevator hallways and step-free ramps are free of obstructions.' },
                    { id: 'routine-2', title: 'Megaphone Power Check', desc: 'Confirm hand-held safety megaphone is fully charged and in standby mode.' },
                    { id: 'routine-3', title: 'Egress Signage Sweep', desc: 'Inspect emergency exit doors and directional arrows in your sector.' }
                  ];

                  const combinedTasks = [
                    ...ROUTINE_TASKS,
                    ...assignedTasks.map(dec => ({
                      id: `assigned-${dec.id}`,
                      title: dec.title,
                      desc: dec.communicationRequired.volunteerInstruction
                    }))
                  ];

                  const completedCount = combinedTasks.filter(t => completedTasks[t.id]).length;
                  const totalCount = combinedTasks.length;
                  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4 text-amber-400" />
                          Sector Activity Checklists
                        </h3>
                        <span className="text-[10px] font-bold font-mono text-amber-400">
                          {completedCount} / {totalCount} Done ({progressPct}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <ul className="space-y-2.5">
                        {combinedTasks.map(item => (
                          <li 
                            key={item.id} 
                            className={`flex gap-3 rounded-2xl border p-3.5 transition-all duration-300 ${
                              completedTasks[item.id] 
                                ? 'bg-emerald-950/10 border-emerald-500/20 opacity-70' 
                                : 'bg-slate-950/30 border-white/5 hover:border-amber-500/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!completedTasks[item.id]}
                              onChange={(e) => {
                                setCompletedTasks(prev => ({
                                  ...prev,
                                  [item.id]: e.target.checked
                                }));
                              }}
                              className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 mt-0.5 cursor-pointer"
                              id={`task-${item.id}`}
                            />
                            <div className="text-xs">
                              <label htmlFor={`task-${item.id}`} className="font-extrabold text-white cursor-pointer select-none leading-snug block">
                                {item.title}
                              </label>
                              <p className="mt-1 leading-relaxed text-slate-400">{item.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </section>
          )}

          {/* Incident Reporting Form (TACTICAL DISPATCH CENTER) */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Incident Form">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Incident Dispatch Center</h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Live Field Report</span>
            </div>
            
            {incidentStatus && (
              <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-950/10 p-3.5 text-xs text-emerald-300 font-semibold" role="status">
                ✓ {incidentStatus}
              </div>
            )}

            {incidentError && (
              <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-950/10 p-3.5 text-xs text-rose-300 font-semibold" role="alert">
                ⚠️ {incidentError}
              </div>
            )}

            <form onSubmit={handleReportIncident} className="space-y-4">
              <div>
                <label htmlFor="report-zone" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">Incident Sector Location:</label>
                <select
                  id="report-zone"
                  value={reportZone}
                  onChange={(e) => setReportZone(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
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
                  <label htmlFor="incident-title" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">Brief Title:</label>
                  <input
                    id="incident-title"
                    type="text"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="e.g., Pedestrian backup"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label htmlFor="incident-severity" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">Severity Level:</label>
                  <select
                    id="incident-severity"
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="LOW">Low (Caution)</option>
                    <option value="MEDIUM">Medium (Crowding)</option>
                    <option value="HIGH">High (Obstructed)</option>
                    <option value="CRITICAL">Critical (Danger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="incident-desc" className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">Incident Details:</label>
                <textarea
                  id="incident-desc"
                  rows={3}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Provide precise details, crowd density estimate, and blockage info..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={reportingLoading}
                className="w-full rounded-xl bg-rose-500 hover:bg-rose-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-rose-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {reportingLoading ? 'Filing dispatch alert...' : 'Dispatch Field Alert to Command Center'}
              </button>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: Broadcasts, Handover Logs & Chat (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Volunteer Shift Tracker Console */}
          <section className="rounded-3xl border border-amber-500/10 bg-gradient-to-br from-slate-900 to-amber-950/20 p-5 shadow-xl backdrop-blur-md relative overflow-hidden" aria-label="Volunteer Shift Console">
            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Shift Console Active
              </span>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black text-amber-400 font-mono tracking-wider">
                VOL-2026-N90
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Active Roster Duty:</span>
                <span className="text-white font-black">Plaza & Concourse Safety Shift 1B</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Shift Countdown:</span>
                <span className="text-amber-400 font-extrabold font-mono animate-pulse">{formatShiftTime(shiftSeconds)}</span>
              </div>
              
              {/* Shift progress tracker */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Shift Timeline</span>
                  <span>65% Elapsed</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full w-[65%] bg-amber-500 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Broadcast announcements feed */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Field Emergency Broadcasts">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Megaphone className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Dispatch Broadcasts</h2>
            </div>
            
            <div className="space-y-3">
              {activeIncidents.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-slate-950/20 p-4 text-center text-xs text-slate-500 font-medium">
                  No active broadcasts. Standing by on radio channels.
                </div>
              ) : (
                activeIncidents.map(inc => (
                  <div key={inc.id} className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 text-xs leading-normal">
                    <span className="font-extrabold text-white block mb-1">📢 {inc.title}</span>
                    <span className="text-slate-300">{inc.description}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Equipment Handover Logs & Supply Checklist */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md" aria-label="Equipment Logs">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Equipment Handover Logs</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">Inspected Gear</span>
            </div>

            {equipmentReportMsg && (
              <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] text-amber-300 font-semibold relative">
                <button onClick={() => setEquipmentReportMsg(null)} className="absolute top-1.5 right-2 text-amber-400 font-extrabold text-[10px] cursor-pointer">✕</button>
                {equipmentReportMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Safety Megaphone", key: "megaphone", desc: "UHF Siren Loudspeaker" },
                { label: "Radio Set #12", key: "radio", desc: "Tactical Dispatch Link" },
                { label: "First Aid Pack B", key: "firstaid", desc: "Trauma Dressing Kit" },
                { label: "Zone Gate Keycard", key: "keycard", desc: "All-Sector Pass" }
              ].map(item => (
                <div key={item.key} className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-black text-white block">{item.label}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Status: <strong className="text-amber-400 font-mono">{equipmentStatus[item.key]}</strong></span>
                    <select
                      value={equipmentStatus[item.key]}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setEquipmentStatus(prev => ({ ...prev, [item.key]: nextVal }));
                        if (nextVal === 'Report Issue') {
                          setEquipmentReportMsg(`⚠️ Maintenance Alert logged for ${item.label}. Stadium operations has been dispatched to deliver a spare unit to your sector.`);
                        } else {
                          setEquipmentReportMsg(null);
                        }
                      }}
                      className="w-full rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 py-1 px-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Functional">Functional</option>
                      <option value="Standby">Standby</option>
                      <option value="Report Issue">Report Issue</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Volunteer Q&A Assistant Chat */}
          <section className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Volunteer Copilot">
            <div className="mb-3.5 flex items-center gap-2 border-b border-white/5 pb-2.5">
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Volunteer Copilot</h2>
            </div>
            
            {/* Expanded naturally so no nested scroll traps */}
            <div className="space-y-3.5 p-1 text-xs">
              {chatHistory.length === 0 && (
                <p className="text-slate-500 text-center py-6 leading-relaxed font-sans">Ask Copilot for evacuation protocols, helper checklists, or incident logs.</p>
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
                <p className="text-slate-400 text-[10px] animate-pulse">Copilot is verifying protocols...</p>
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-1.5 pt-3 border-t border-white/5">
              <input
                type="text"
                placeholder="Ask sector coordinator..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                aria-label="Type your message to the volunteer coordinator"
              />
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all shadow"
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
