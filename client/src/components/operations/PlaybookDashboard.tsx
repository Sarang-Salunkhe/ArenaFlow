import { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Check,
  Clock,
  Radio,
  Sparkles,
  Users,
  BookOpen,
  FileText,
  RotateCcw,
  PlusCircle,
  UserCheck,
  Award,
  UserX,
  Plus
} from 'lucide-react';
import { StadiumState, Incident } from '../../types';

interface PlaybookDashboardProps {
  state: StadiumState;
  onAdvanceTick?: () => void;
}

interface ChecklistItem {
  id: string;
  step: string;
  assignedTeam: string;
  originalTeam: string;
  completed: boolean;
  skipped: boolean;
  notes: string;
  isEditingNotes?: boolean;
}

interface Playbook {
  id: string;
  title: string;
  incidentType: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  objectives: string[];
  checklist: ChecklistItem[];
  requiredResources: string[];
  successCriteria: string;
  estCompletionMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  historyLog: string[];
}

const DEFAULT_PLAYBOOKS: Record<string, Omit<Playbook, 'startedAt' | 'completedAt' | 'historyLog'>> = {
  CROWD_SURGE: {
    id: 'CROWD_SURGE',
    title: 'Crowd Surge Playbook',
    incidentType: 'Crowd Surge',
    summary: 'Manage and de-congest extreme crowd density build-ups in corridors and concourses.',
    riskLevel: 'HIGH',
    objectives: [
      'De-escalate concourse occupancy below 80%',
      'Deploy visual and physical pacing vectors',
      'Ensure clear paths for emergency response'
    ],
    checklist: [
      { id: 'cs_1', step: 'Deploy physical crowd-pacing barricades at affected sector entrances.', assignedTeam: 'Crowd Control Unit', originalTeam: 'Crowd Control Unit', completed: false, skipped: false, notes: '' },
      { id: 'cs_2', step: 'Update dynamic digital signage to direct fans to alternative, lower-density stands.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' },
      { id: 'cs_3', step: 'Dispatch Volunteers to key concourse junctions to direct fan traffic.', assignedTeam: 'Volunteers Team Beta', originalTeam: 'Volunteers Team Beta', completed: false, skipped: false, notes: '' },
      { id: 'cs_4', step: 'Configure main gate turnstiles to cycle at a 30% slower pacing interval.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Mobile crowd-pacing barriers', 'High-decibel megaphones', 'Dynamic direction LED signs'],
    successCriteria: 'Concourse crowd density drops to MODERATE; pedestrian velocity stabilizes.',
    estCompletionMinutes: 15
  },
  MEDICAL_EMERGENCY: {
    id: 'MEDICAL_EMERGENCY',
    title: 'Medical Emergency Playbook',
    incidentType: 'Medical Emergency',
    summary: 'Coordinate fast-response triage and safe transit corridor for critical field injuries.',
    riskLevel: 'CRITICAL',
    objectives: [
      'Discharge first responders within 120 seconds',
      'Isolate treatment area for patient privacy',
      'Secure ambulance transit corridor with transit liaison'
    ],
    checklist: [
      { id: 'med_1', step: 'Dispatch standby Medical Response Team to designated section coordinates.', assignedTeam: 'Medical Response Team 1', originalTeam: 'Medical Response Team 1', completed: false, skipped: false, notes: '' },
      { id: 'med_2', step: 'Establish a 10-meter protective cordon around the patient sector.', assignedTeam: 'Security Unit Alpha', originalTeam: 'Security Unit Alpha', completed: false, skipped: false, notes: '' },
      { id: 'med_3', step: 'Clear Emergency Corridor of all pedestrian and spectator traffic.', assignedTeam: 'Volunteers Team Alpha', originalTeam: 'Volunteers Team Alpha', completed: false, skipped: false, notes: '' },
      { id: 'med_4', step: 'Verify stadium vehicle gates are open for incoming ambulance priority ingress.', assignedTeam: 'Transit Liaison Team', originalTeam: 'Transit Liaison Team', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Automated Defibrillator (AED)', 'Triage kit', 'Wheeled stretcher', 'Priority access RFID keys'],
    successCriteria: 'Patient stabilized and safely transported; medical post reports triage complete.',
    estCompletionMinutes: 8
  },
  SECURITY_ALERT: {
    id: 'SECURITY_ALERT',
    title: 'Security Alert Playbook',
    incidentType: 'Security Alert',
    summary: 'Handle unattended packages or security threats safely with rapid cordon routines.',
    riskLevel: 'CRITICAL',
    objectives: [
      'Establish protective safety perimeter immediately',
      'Reroute fan intake channels away from hazard zone',
      'Coordinate threat assessment with explosive ordnance units'
    ],
    checklist: [
      { id: 'sec_1', step: 'Establish a 50-meter safety cordon tape around the flagged object coordinate.', assignedTeam: 'Security Unit Alpha', originalTeam: 'Security Unit Alpha', completed: false, skipped: false, notes: '' },
      { id: 'sec_2', step: 'Reroute incoming spectator traffic away from affected plaza gates.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' },
      { id: 'sec_3', step: 'Instruct CCTV team to maintain high-resolution pan-tilt monitoring of the area.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' },
      { id: 'sec_4', step: 'Deploy specialized K9 units to evaluate the threat profile.', assignedTeam: 'K9 Security Unit', originalTeam: 'K9 Security Unit', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Cordon tape', 'Handheld metal scanners', 'Live CCTV feeds', 'Thermal camera diagnostics'],
    successCriteria: 'Perimeter secured; threat verified safe or neutralized by expert specialists.',
    estCompletionMinutes: 20
  },
  LOST_CHILD: {
    id: 'LOST_CHILD',
    title: 'Lost Child Playbook',
    incidentType: 'Lost Child',
    summary: 'Mobilize staff and monitor gates to safely reunite lost children with guardians.',
    riskLevel: 'MEDIUM',
    objectives: [
      'Lock down and monitor outer perimeter exit channels',
      'Distribute child profile details to all roving personnel',
      'Establish safe shelter custody and alert public address desk'
    ],
    checklist: [
      { id: 'lost_1', step: 'Notify all turnstile and outer gates to restrict unaccompanied child egress.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' },
      { id: 'lost_2', step: 'Distribute description and photo (if available) to security mobile tablets.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' },
      { id: 'lost_3', step: 'Deploy designated sweep team to search play centers, F&B zones, and washrooms.', assignedTeam: 'Volunteers Team Beta', originalTeam: 'Volunteers Team Beta', completed: false, skipped: false, notes: '' },
      { id: 'lost_4', step: 'Perform discrete announcement broadcast on public address system.', assignedTeam: 'Public Address Desk', originalTeam: 'Public Address Desk', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Roving security tablets', 'Megaphones', 'PA Override Console'],
    successCriteria: 'Child located and reunited with verified legal guardians.',
    estCompletionMinutes: 10
  },
  WEATHER_WARNING: {
    id: 'WEATHER_WARNING',
    title: 'Weather Warning Playbook',
    incidentType: 'Weather Warning',
    summary: 'Mitigate extreme weather elements, secure loose equipment, and manage fan shelter zones.',
    riskLevel: 'MEDIUM',
    objectives: [
      'Minimize rain slip/fall emergency room incidents',
      'Ensure shelter density remains within safe operational capacity',
      'Secure temporary plaza structures and electrical assets'
    ],
    checklist: [
      { id: 'weather_1', step: 'Deploy slip-resistant safety mats and warning signs at concourse entries.', assignedTeam: 'Facilities Management', originalTeam: 'Facilities Management', completed: false, skipped: false, notes: '' },
      { id: 'weather_2', step: 'Broadcast advisories for fans in open areas to move to covered decks.', assignedTeam: 'Public Address Desk', originalTeam: 'Public Address Desk', completed: false, skipped: false, notes: '' },
      { id: 'weather_3', step: 'Secure loose promotional banners and plaza vendor umbrellas.', assignedTeam: 'Volunteers Team Alpha', originalTeam: 'Volunteers Team Alpha', completed: false, skipped: false, notes: '' },
      { id: 'weather_4', step: 'Trigger auxiliary generator warm-up loops for lightning storm safety.', assignedTeam: 'Electrical Engineering', originalTeam: 'Electrical Engineering', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Slip hazard signage', 'Emergency rain ponchos', 'Janitorial blowers'],
    successCriteria: 'All loose outdoor assets secured; zero storm-related slip incidents reported.',
    estCompletionMinutes: 12
  },
  GATE_FAILURE: {
    id: 'GATE_FAILURE',
    title: 'Gate Failure Playbook',
    incidentType: 'Gate Failure',
    summary: 'Bypass faulty electronic readers with manual scan networks to reduce entry backlogs.',
    riskLevel: 'HIGH',
    objectives: [
      'Maintain peak inflow capacity above 4000 fans/hour',
      'Distribute queue times evenly across alternative gates',
      'Restore primary ethernet communication to card readers'
    ],
    checklist: [
      { id: 'gate_1', step: 'Distribute wireless backup handheld scanners to gate staff.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' },
      { id: 'gate_2', step: 'Authorize and activate Auxiliary Gate E / Gate 7 backup turnstiles.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' },
      { id: 'gate_3', step: 'Deploy dynamic signage guiding incoming fans to less-congested Gate C.', assignedTeam: 'Volunteers Team Beta', originalTeam: 'Volunteers Team Beta', completed: false, skipped: false, notes: '' },
      { id: 'gate_4', step: 'Initiate standard power cycle on affected gate local switch stacks.', assignedTeam: 'Electrical Engineering', originalTeam: 'Electrical Engineering', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Backup mobile scanner tablets', 'Manual ticket punches', 'Auxiliary gate key sets'],
    successCriteria: 'Faulty gate queues clear out; average wait times return below 180 seconds.',
    estCompletionMinutes: 10
  },
  FIRE_ALARM: {
    id: 'FIRE_ALARM',
    title: 'Fire Incident Playbook',
    incidentType: 'Fire Alarm',
    summary: 'Coordinate fire control, safe compartment evacuation, and clear entry paths for fire engines.',
    riskLevel: 'CRITICAL',
    objectives: [
      'Evacuate target sectors within 4 minutes',
      'Deploy localized extinguishing systems immediately',
      'Establish primary staging point for city fire marshal responders'
    ],
    checklist: [
      { id: 'fire_1', step: 'Initiate localized voice evacuation broadcast sequence.', assignedTeam: 'Public Address Desk', originalTeam: 'Public Address Desk', completed: false, skipped: false, notes: '' },
      { id: 'fire_2', step: 'Deploy standby fire marshals to inspect smoke detector coordinates.', assignedTeam: 'Fire Marshal Unit', originalTeam: 'Fire Marshal Unit', completed: false, skipped: false, notes: '' },
      { id: 'fire_3', step: 'Force-open all perimeter emergency bypass exit doors.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' },
      { id: 'fire_4', step: 'Instruct Security units to coordinate clear road access for incoming fire engines.', assignedTeam: 'Security Unit Alpha', originalTeam: 'Security Unit Alpha', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Localized suppression extinguishers', 'PA Voice override overrides', 'Thermal imaging kits'],
    successCriteria: 'Affected zone verified empty of spectators; heat sources isolated or extinguished.',
    estCompletionMinutes: 15
  },
  POWER_OUTAGE: {
    id: 'POWER_OUTAGE',
    title: 'Power Outage Playbook',
    incidentType: 'Power Outage',
    summary: 'Manage transition to emergency generators, light up egress stairs, and keep critical systems online.',
    riskLevel: 'CRITICAL',
    objectives: [
      'Transition vital infrastructure to generator backup under 10 seconds',
      'Activate emergency escape route lighting immediately',
      'Assure the crowd via PA systems to prevent mass panic'
    ],
    checklist: [
      { id: 'power_1', step: 'Confirm automatic switchover of diesel generator grid.', assignedTeam: 'Electrical Engineering', originalTeam: 'Electrical Engineering', completed: false, skipped: false, notes: '' },
      { id: 'power_2', step: 'Deploy mobile torch/megaphone staff to high-risk seating bowl stairs.', assignedTeam: 'Volunteers Team Alpha', originalTeam: 'Volunteers Team Alpha', completed: false, skipped: false, notes: '' },
      { id: 'power_3', step: 'Broadcast calm stadium-wide reassurance PA messages.', assignedTeam: 'Public Address Desk', originalTeam: 'Public Address Desk', completed: false, skipped: false, notes: '' },
      { id: 'power_4', step: 'Verify backup UPS systems are holding target server loads.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Generator diesel reserves', 'High-lumens LED emergency lights', 'Rechargeable megaphones'],
    successCriteria: 'Emergency lighting active on 100% of egress lines; backup generator output stabilized.',
    estCompletionMinutes: 5
  },
  VIP_MOVEMENT: {
    id: 'VIP_MOVEMENT',
    title: 'VIP Dignitary Playbook',
    incidentType: 'VIP Movement',
    summary: 'Coordinate high-profile dignitary arrival, secure private corridors, and protect elevator lifts.',
    riskLevel: 'LOW',
    objectives: [
      'Isolate path corridors with minimal impact to general fan traffic',
      'Verify active clearance of all VIP transit points',
      'Coordinate secure motorcade ingress at restricted bays'
    ],
    checklist: [
      { id: 'vip_1', step: 'Place North Lift and West Lift lines on secure override controls.', assignedTeam: 'Facilities Management', originalTeam: 'Facilities Management', completed: false, skipped: false, notes: '' },
      { id: 'vip_2', step: 'Clear West Stand lobby pathways of non-essential crew.', assignedTeam: 'Security Unit Bravo', originalTeam: 'Security Unit Bravo', completed: false, skipped: false, notes: '' },
      { id: 'vip_3', step: 'Station Close Protection escorts at designated arrival bay entries.', assignedTeam: 'VIP Close Protection', originalTeam: 'VIP Close Protection', completed: false, skipped: false, notes: '' },
      { id: 'vip_4', step: 'Log vehicle transponder IDs through secured West vehicle Gate.', assignedTeam: 'Gate Operations staff', originalTeam: 'Gate Operations staff', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Corridor crowd fences', 'Secure lift override keyfobs', 'Handheld transponder scanners'],
    successCriteria: 'Dignitary safely escorted to VIP Suites with zero corridor delay.',
    estCompletionMinutes: 15
  },
  TRANSPORT_DELAY: {
    id: 'TRANSPORT_DELAY',
    title: 'Transport Delay Playbook',
    incidentType: 'Transport Delay',
    summary: 'Act as intermediate hub to prevent transit terminal surges during subway/bus delays.',
    riskLevel: 'HIGH',
    objectives: [
      'Cap transit plaza queue density below 3 fans/sqm',
      'Establish dynamic bus shuttle bridges within 15 minutes',
      'Advise exit surges to utilize alternative station networks'
    ],
    checklist: [
      { id: 'trans_1', step: 'Contact regional metro control room to verify signal restore timelines.', assignedTeam: 'Transit Liaison Team', originalTeam: 'Transit Liaison Team', completed: false, skipped: false, notes: '' },
      { id: 'trans_2', step: 'Deploy queue pacing gates at Metro Station Plaza lanes.', assignedTeam: 'Crowd Control Unit', originalTeam: 'Crowd Control Unit', completed: false, skipped: false, notes: '' },
      { id: 'trans_3', step: 'Request mobilization of 5x regional shuttle buses to Bus Station Plaza.', assignedTeam: 'Transit Liaison Team', originalTeam: 'Transit Liaison Team', completed: false, skipped: false, notes: '' },
      { id: 'trans_4', step: 'Activate dynamic exit advice screens at all seating gate exits.', assignedTeam: 'IT Operations', originalTeam: 'IT Operations', completed: false, skipped: false, notes: '' }
    ],
    requiredResources: ['Pacing barricades', 'Dynamic sign override templates', 'Regional radio channels'],
    successCriteria: 'Transit plaza queues are kept moving; shuttle bridge handles egress overflow.',
    estCompletionMinutes: 25
  }
};

export function PlaybookDashboard({ state, onAdvanceTick }: PlaybookDashboardProps) {
  // Initialize playbooks state (copied from DEFAULT_PLAYBOOKS)
  const [playbooks, setPlaybooks] = useState<Record<string, Playbook>>(() => {
    // Try to load from localStorage to keep state elegant across ticks
    try {
      const saved = localStorage.getItem('arenaflow_playbooks_state_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load playbooks from localStorage', e);
    }

    const initial: Record<string, Playbook> = {};
    Object.keys(DEFAULT_PLAYBOOKS).forEach(key => {
      initial[key] = {
        ...DEFAULT_PLAYBOOKS[key],
        startedAt: null,
        completedAt: null,
        historyLog: []
      };
    });
    return initial;
  });

  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('CROWD_SURGE');
  
  // Custom playbook trigger modal/form
  const [showCustomTriggerForm, setShowCustomTriggerForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customIncidentType, setCustomIncidentType] = useState('Crowd Surge');
  const [customRisk, setCustomRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [customSummary, setCustomSummary] = useState('');
  const [customSteps, setCustomSteps] = useState('Step 1: Inspect area\nStep 2: Mobilize team\nStep 3: Resolve hazard');

  // Post-Incident Report Interactive States
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showExportDetails, setShowExportDetails] = useState(false);

  // Active incidents mapped from telemetry to highlight linked playbooks
  const activeTelemetryIncidents = useMemo(() => {
    return state.incidents.filter(inc => inc.active);
  }, [state.incidents]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('arenaflow_playbooks_state_v2', JSON.stringify(playbooks));
    } catch (e) {
      console.error('Error saving playbooks state', e);
    }
  }, [playbooks]);

  // Helper to get matching playbook ID based on incident title or type
  const getMatchingPlaybookId = (incident: Incident): string => {
    const titleLower = incident.title.toLowerCase();
    const descLower = incident.description.toLowerCase();

    if (titleLower.includes('surge') || descLower.includes('surge') || titleLower.includes('crowd')) return 'CROWD_SURGE';
    if (titleLower.includes('medical') || descLower.includes('medical') || titleLower.includes('injury')) return 'MEDICAL_EMERGENCY';
    if (titleLower.includes('security') || descLower.includes('security') || titleLower.includes('unattended')) return 'SECURITY_ALERT';
    if (titleLower.includes('lost') || descLower.includes('child')) return 'LOST_CHILD';
    if (titleLower.includes('rain') || descLower.includes('rain') || titleLower.includes('weather')) return 'WEATHER_WARNING';
    if (titleLower.includes('gate') || descLower.includes('turnstile') || titleLower.includes('reader')) return 'GATE_FAILURE';
    if (titleLower.includes('fire') || descLower.includes('fire') || titleLower.includes('alarm') || titleLower.includes('smoke')) return 'FIRE_ALARM';
    if (titleLower.includes('power') || descLower.includes('blackout') || titleLower.includes('outage')) return 'POWER_OUTAGE';
    if (titleLower.includes('vip') || descLower.includes('dignitary') || titleLower.includes('motorcade')) return 'VIP_MOVEMENT';
    if (titleLower.includes('transport') || descLower.includes('metro') || titleLower.includes('bus')) return 'TRANSPORT_DELAY';
    
    return 'CROWD_SURGE'; // Default fallback
  };

  // Telemetry Link: Auto-start playbooks when telemetry detects active incidents
  useEffect(() => {
    let stateChanged = false;
    const updatedPlaybooks = { ...playbooks };

    activeTelemetryIncidents.forEach(incident => {
      const matchId = getMatchingPlaybookId(incident);
      if (updatedPlaybooks[matchId] && !updatedPlaybooks[matchId].startedAt && !updatedPlaybooks[matchId].completedAt) {
        // Auto-start this playbook
        updatedPlaybooks[matchId] = {
          ...updatedPlaybooks[matchId],
          startedAt: new Date().toISOString(),
          historyLog: [
            `[${new Date().toLocaleTimeString()}] 🔮 AI Auto-Triggered Playbook linked to active telemetry incident: "${incident.title}"`
          ]
        };
        stateChanged = true;
      }
    });

    if (stateChanged) {
      setPlaybooks(updatedPlaybooks);
    }
  }, [activeTelemetryIncidents]);

  // Telemetry-Driven Live Recommendations AI updates
  const telemetryRecommendations = useMemo(() => {
    const recommendations: Record<string, string[]> = {};

    // 1. Crowd Surge Recommendations
    const surgeRecs: string[] = [];
    const lowerConcourse = state.zones.find(z => z.id === 'CONCOURSE_LOWER');
    if (lowerConcourse && lowerConcourse.riskScore > 65) {
      surgeRecs.push(`⚠️ Telemetry Alert: Lower Concourse Risk Score is high (${lowerConcourse.riskScore}%). Direct paging rails to open IMMEDIATELY.`);
    }
    if (state.matchPhase === 'ENTRY_SURGE') {
      surgeRecs.push('⚡ Match Phase is ENTRY SURGE: Increase gate dispatch rates and deploy volunteers to north perimeter.');
    } else if (state.matchPhase === 'EXIT_SURGE') {
      surgeRecs.push('⚡ Match Phase is EXIT SURGE: Clear all exit corridors and hold back inner turnstile releases.');
    }
    recommendations['CROWD_SURGE'] = surgeRecs;

    // 2. Medical Recommendations
    const medRecs: string[] = [];
    const medicalZones = state.zones.filter(z => z.type === 'MEDICAL');
    const medicalFull = medicalZones.some(z => (z.occupancy / z.capacity) > 0.8);
    if (medicalFull) {
      medRecs.push('⚠️ Triage alert: Core Medical Post capacity exceeds 80%. Coordinate direct off-site ambulance transport.');
    } else {
      medRecs.push('✓ Medical Station capacity is nominal. In-stadium triage stabilized.');
    }
    recommendations['MEDICAL_EMERGENCY'] = medRecs;

    // 3. Security Recommendations
    const secRecs: string[] = [];
    const southPlaza = state.zones.find(z => z.id === 'PLAZA_SOUTH');
    if (southPlaza && southPlaza.riskScore > 70) {
      secRecs.push(`⚠️ Crowd stress high at South Plaza (${southPlaza.riskScore}%). Secure cordon boundaries to prevent ingress rushes.`);
    }
    recommendations['SECURITY_ALERT'] = secRecs;

    // 4. Lost Child Recommendations
    const lostRecs: string[] = [];
    if (state.matchPhase === 'HALF_TIME') {
      lostRecs.push('⚠️ Concourse pedestrian density is high at HALF TIME. Deploy search volunteers strictly along upper levels.');
    } else {
      lostRecs.push('✓ Density levels nominal. Visual sweeps should focus on central washrooms and retail bays.');
    }
    recommendations['LOST_CHILD'] = lostRecs;

    // 5. Weather Recommendations
    const weatherRecs: string[] = [];
    const isRaining = state.incidents.some(i => i.title.toLowerCase().includes('rain') || i.description.toLowerCase().includes('rain'));
    if (isRaining) {
      weatherRecs.push('🌧️ Telemetry Alert: Precipitation detected. Shift 10 volunteers to Concourse entrances with wet vacuums.');
      weatherRecs.push('⚠️ High slip danger at seating bowl exit stairs. Slow down exit flow gates.');
    } else {
      weatherRecs.push('✓ Weather is clear. Outdoor structures and plazas operate at normal status.');
    }
    recommendations['WEATHER_WARNING'] = weatherRecs;

    // 6. Gate Failure Recommendations
    const gateRecs: string[] = [];
    const highQueueGate = state.gates.find(g => g.avgQueueSeconds > 180);
    if (highQueueGate) {
      gateRecs.push(`⚠️ Telemetry Alert: ${highQueueGate.name} queue is high (${highQueueGate.avgQueueSeconds}s). Enable bypass channels.`);
    }
    recommendations['GATE_FAILURE'] = gateRecs;

    // 7. Fire Alarm Recommendations
    const fireRecs: string[] = [];
    fireRecs.push('⚠️ Ensure Fire marshal coordinates are fully mapped on active map overlays.');
    recommendations['FIRE_ALARM'] = fireRecs;

    // 8. Power Failure Recommendations
    const powerRecs: string[] = [];
    const lowerCon = state.zones.find(z => z.id === 'CONCOURSE_LOWER');
    if (lowerCon && lowerCon.occupancy > lowerCon.capacity * 0.7) {
      powerRecs.push('⚠️ Crowds clustering in lower deck. Dispatch emergency backup power relays to standby.');
    }
    recommendations['POWER_OUTAGE'] = powerRecs;

    // 9. VIP Recommendations
    const vipRecs: string[] = [];
    if (state.matchPhase === 'PRE_MATCH') {
      vipRecs.push('⚡ Pre-Match Phase: VIP arrivals scheduled. Restrict Lift North immediately.');
    }
    recommendations['VIP_MOVEMENT'] = vipRecs;

    // 10. Transport Delay Recommendations
    const transRecs: string[] = [];
    if (state.transport.metroQueueSeconds > 400) {
      transRecs.push(`⚠️ Telemetry Alert: Metro Wait time is ${state.transport.metroQueueSeconds}s. Dispatch Shuttle buses to relieve terminal.`);
    }
    recommendations['TRANSPORT_DELAY'] = transRecs;

    return recommendations;
  }, [state]);

  const activePlaybook = playbooks[selectedPlaybookId];

  // Calculations for active playbook
  const progressPercent = useMemo(() => {
    if (!activePlaybook) return 0;
    const items = activePlaybook.checklist;
    const nonSkipped = items.filter(item => !item.skipped);
    if (nonSkipped.length === 0) return 0;
    const completed = nonSkipped.filter(item => item.completed).length;
    return Math.round((completed / nonSkipped.length) * 100);
  }, [activePlaybook]);

  const isPlaybookCompleted = useMemo(() => {
    if (!activePlaybook || !activePlaybook.startedAt) return false;
    const items = activePlaybook.checklist;
    // Playbook is finished when every item is either completed or skipped
    return items.every(item => item.completed || item.skipped);
  }, [activePlaybook]);

  // Action: Start Playbook manually
  const handleStartPlaybook = () => {
    if (!activePlaybook) return;
    const nowStr = new Date().toISOString();
    setReportSubmitted(false);
    setShowExportDetails(false);
    setPlaybooks(prev => ({
      ...prev,
      [selectedPlaybookId]: {
        ...prev[selectedPlaybookId],
        startedAt: nowStr,
        completedAt: null,
        historyLog: [
          `[${new Date().toLocaleTimeString()}] 🚀 Playbook manually initiated by Command Center Operator.`
        ]
      }
    }));
  };

  // Action: Reset Playbook
  const handleResetPlaybook = () => {
    if (!activePlaybook) return;
    setReportSubmitted(false);
    setShowExportDetails(false);
    
    // Determine default original checklist
    let originalChecklist: ChecklistItem[] = [];
    if (DEFAULT_PLAYBOOKS[selectedPlaybookId]) {
      originalChecklist = DEFAULT_PLAYBOOKS[selectedPlaybookId].checklist.map(item => ({
        ...item,
        completed: false,
        skipped: false,
        notes: ''
      }));
    } else {
      // For custom playbooks
      originalChecklist = activePlaybook.checklist.map(item => ({
        ...item,
        completed: false,
        skipped: false,
        notes: ''
      }));
    }

    setPlaybooks(prev => ({
      ...prev,
      [selectedPlaybookId]: {
        ...prev[selectedPlaybookId],
        startedAt: null,
        completedAt: null,
        checklist: originalChecklist,
        historyLog: []
      }
    }));
  };

  // Action: Add AI Recommended step to checklist dynamically
  const handleAddRecommendationAsStep = (recText: string) => {
    if (!activePlaybook) return;
    
    const cleanStep = recText.replace(/^⚠️\s*/, '').replace(/^🌧️\s*/, '').replace(/^⚡\s*/, '').trim();
    const newStep: ChecklistItem = {
      id: `ai_step_${Date.now()}`,
      step: cleanStep,
      assignedTeam: 'AI Command Assistant',
      originalTeam: 'AI Command Assistant',
      completed: false,
      skipped: false,
      notes: ''
    };

    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const actionTime = new Date().toLocaleTimeString();
      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: [...current.checklist, newStep],
          historyLog: [
            ...current.historyLog,
            `[${actionTime}] ⚡ Incorporated AI recommendation step: "${cleanStep.slice(0, 30)}..."`
          ]
        }
      };
    });
  };

  // Action: Simulate logging report to Central Registry
  const handleLogReport = () => {
    setIsSubmittingReport(true);
    setTimeout(() => {
      setIsSubmittingReport(false);
      setReportSubmitted(true);
      
      // Append to active playbook's history log
      setPlaybooks(prev => {
        const current = prev[selectedPlaybookId];
        const actionTime = new Date().toLocaleTimeString();
        return {
          ...prev,
          [selectedPlaybookId]: {
            ...current,
            historyLog: [
              ...current.historyLog,
              `[${actionTime}] 📂 Incident report successfully exported and archived in Central HQ Command Registry.`
            ]
          }
        };
      });
    }, 1200);
  };

  // Action: Toggle step completed
  const handleToggleComplete = (itemId: string) => {
    if (!activePlaybook) return;
    const isNowCompleted = !activePlaybook.checklist.find(i => i.id === itemId)?.completed;
    
    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const updatedChecklist = current.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: isNowCompleted, skipped: false };
        }
        return item;
      });

      const stepText = current.checklist.find(i => i.id === itemId)?.step || '';
      const actionTime = new Date().toLocaleTimeString();
      const statusText = isNowCompleted ? 'COMPLETED' : 'UNCOMPLETED';
      const logEntry = `[${actionTime}] Step "${stepText.slice(0, 30)}..." marked as ${statusText}`;

      // Check if this action completes the playbook
      const allDone = updatedChecklist.every(item => item.completed || item.skipped);
      const completedAtTime = allDone ? new Date().toISOString() : null;
      const finalLog = [...current.historyLog, logEntry];
      if (allDone) {
        finalLog.push(`[${actionTime}] 🏆 Playbook resolved. Post-Incident Report generated.`);
      }

      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: updatedChecklist,
          completedAt: completedAtTime,
          historyLog: finalLog
        }
      };
    });
  };

  // Action: Skip step
  const handleToggleSkip = (itemId: string) => {
    if (!activePlaybook) return;
    const isNowSkipped = !activePlaybook.checklist.find(i => i.id === itemId)?.skipped;

    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const updatedChecklist = current.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, skipped: isNowSkipped, completed: false };
        }
        return item;
      });

      const stepText = current.checklist.find(i => i.id === itemId)?.step || '';
      const actionTime = new Date().toLocaleTimeString();
      const statusText = isNowSkipped ? 'SKIPPED' : 'UN-SKIPPED';
      const logEntry = `[${actionTime}] Step "${stepText.slice(0, 30)}..." marked as ${statusText}`;

      // Check if this action completes the playbook
      const allDone = updatedChecklist.every(item => item.completed || item.skipped);
      const completedAtTime = allDone ? new Date().toISOString() : null;
      const finalLog = [...current.historyLog, logEntry];
      if (allDone) {
        finalLog.push(`[${actionTime}] 🏆 Playbook resolved. Post-Incident Report generated.`);
      }

      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: updatedChecklist,
          completedAt: completedAtTime,
          historyLog: finalLog
        }
      };
    });
  };

  // Action: Edit step notes
  const handleSaveNotes = (itemId: string, noteText: string) => {
    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const updatedChecklist = current.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, notes: noteText, isEditingNotes: false };
        }
        return item;
      });

      const stepText = current.checklist.find(i => i.id === itemId)?.step || '';
      const actionTime = new Date().toLocaleTimeString();
      const logEntry = `[${actionTime}] Notes added to step "${stepText.slice(0, 20)}...": "${noteText}"`;

      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: updatedChecklist,
          historyLog: [...current.historyLog, logEntry]
        }
      };
    });
  };

  const handleToggleEditNotes = (itemId: string) => {
    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const updatedChecklist = current.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, isEditingNotes: !item.isEditingNotes };
        }
        return item;
      });
      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: updatedChecklist
        }
      };
    });
  };

  // Action: Reassign team
  const handleReassignTeam = (itemId: string, newTeam: string) => {
    if (!newTeam.trim()) return;
    setPlaybooks(prev => {
      const current = prev[selectedPlaybookId];
      const updatedChecklist = current.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, assignedTeam: newTeam };
        }
        return item;
      });

      const stepText = current.checklist.find(i => i.id === itemId)?.step || '';
      const actionTime = new Date().toLocaleTimeString();
      const oldTeam = current.checklist.find(i => i.id === itemId)?.assignedTeam || '';
      const logEntry = `[${actionTime}] Reassigned step "${stepText.slice(0, 20)}..." from "${oldTeam}" to "${newTeam}"`;

      return {
        ...prev,
        [selectedPlaybookId]: {
          ...current,
          checklist: updatedChecklist,
          historyLog: [...current.historyLog, logEntry]
        }
      };
    });
  };

  // Create custom playbook on demand
  const handleCreateCustomPlaybook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customSummary.trim()) return;

    const formattedChecklist: ChecklistItem[] = customSteps
      .split('\n')
      .filter(line => line.trim())
      .map((line, idx) => {
        const stepText = line.replace(/^\d+[:.]?\s*/, '').trim(); // strip step numbers if any
        return {
          id: `custom_step_${Date.now()}_${idx}`,
          step: stepText,
          assignedTeam: 'General Staff',
          originalTeam: 'General Staff',
          completed: false,
          skipped: false,
          notes: ''
        };
      });

    const newId = `CUSTOM_${Date.now()}`;
    const newPlaybook: Playbook = {
      id: newId,
      title: customTitle,
      incidentType: customIncidentType,
      summary: customSummary,
      riskLevel: customRisk,
      objectives: ['Analyze custom incident boundaries', 'Maintain standard spectator flow pacing'],
      checklist: formattedChecklist,
      requiredResources: ['Mobile tablets', 'Standby staff vectors'],
      successCriteria: 'Custom incident verified resolved by on-scene safety coordinators.',
      estCompletionMinutes: 10,
      startedAt: new Date().toISOString(),
      completedAt: null,
      historyLog: [`[${new Date().toLocaleTimeString()}] 🚀 Custom playbook spawned and initialized.`]
    };

    setPlaybooks(prev => ({
      ...prev,
      [newId]: newPlaybook
    }));

    setSelectedPlaybookId(newId);
    setShowCustomTriggerForm(false);
    // clear fields
    setCustomTitle('');
    setCustomSummary('');
    setCustomSteps('Step 1: Inspect area\nStep 2: Mobilize team\nStep 3: Resolve hazard');
  };

  // Compute stats for playbooks
  const activePlaybooksCount = useMemo(() => {
    return Object.values(playbooks).filter(p => p.startedAt && !p.completedAt).length;
  }, [playbooks]);

  const resolvedPlaybooksCount = useMemo(() => {
    return Object.values(playbooks).filter(p => p.completedAt).length;
  }, [playbooks]);

  // Resolution calculations for Post-Incident Report
  const resolutionDetails = useMemo(() => {
    if (!activePlaybook || !activePlaybook.startedAt || !activePlaybook.completedAt) return null;
    const start = new Date(activePlaybook.startedAt);
    const end = new Date(activePlaybook.completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.max(1, Math.round(diffMs / 1000));
    
    // Mock the resolution time slightly to match actual stadium scenarios
    const minutesString = diffSeconds < 60 ? `${diffSeconds} seconds` : `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s`;

    // Dynamic lessons learned based on skipped and notes
    const skippedCount = activePlaybook.checklist.filter(i => i.skipped).length;
    const withNotes = activePlaybook.checklist.filter(i => i.notes).length;
    const assignedChange = activePlaybook.checklist.filter(i => i.assignedTeam !== i.originalTeam).length;

    const lessons = [
      `Completed ${activePlaybook.checklist.length - skippedCount} steps smoothly under normal triage protocol.`,
    ];

    if (skippedCount > 0) {
      lessons.push(`Skipped ${skippedCount} task step(s) due to site layout redundancies, recommending standardizing checklist density.`);
    }
    if (assignedChange > 0) {
      lessons.push(`Re-routed ${assignedChange} core task team assignments dynamically. Suggesting training standby volunteers for secondary responsibilities.`);
    }
    if (withNotes > 0) {
      lessons.push('Incorporated manual field notes. Team highlighted need for permanent pacing barriers near hot-spots.');
    }

    const aiSuggestions = [
      `Pre-deploy ${activePlaybook.requiredResources[0]} to key hot-zones during similar match phases.`,
      `Reduce target resolution time to ${Math.round(activePlaybook.estCompletionMinutes * 0.8)} minutes in future events using automated volunteer dispatching.`,
      `Implement digital audio beacons near key concourses to assist ${activePlaybook.checklist[0]?.assignedTeam || 'responders'} navigation.`
    ];

    return {
      resolutionTime: minutesString,
      lessons,
      aiSuggestions
    };
  }, [activePlaybook]);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30 text-red-400 font-extrabold';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-medium';
      case 'LOW':
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="flex flex-col gap-6" id="ai-operational-playbook-engine">
      
      {/* ────────────────── PLAYBOOK DECK TOP BAR ────────────────── */}
      <div className="rounded-3xl border border-indigo-500/15 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Operational Playbook Engine</h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 animate-pulse">
                  🤖 REAL-TIME GROUNDED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5 uppercase">Continuous Tactical Playbook Generators & Post-Incident Report deck</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center font-mono text-xs">
            <button
              onClick={() => setShowCustomTriggerForm(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" /> Trigger Custom Playbook
            </button>
            {onAdvanceTick && (
              <button
                onClick={onAdvanceTick}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Activity className="h-4 w-4 text-blue-400 animate-pulse" /> Advance State
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Counter Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Active Telemetry Incidents</span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">
                {activeTelemetryIncidents.length}
              </span>
            </div>
            <span className={`rounded-xl px-2.5 py-1 text-[9px] uppercase font-bold tracking-widest ${
              activeTelemetryIncidents.length > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeTelemetryIncidents.length > 0 ? '⚠ ATTENTION' : '✓ STABLE'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Playbooks In Progress</span>
              <span className="text-xl font-black font-mono text-indigo-300 mt-0.5 block">{activePlaybooksCount}</span>
            </div>
            <span className="text-[9px] uppercase text-indigo-400 font-semibold tracking-wide flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" /> Synchronized
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Playbooks Resolved</span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">{resolvedPlaybooksCount}</span>
            </div>
            <span className="text-[9px] uppercase text-slate-400 font-semibold tracking-wide flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-emerald-400" /> Resolution Deck
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Current Match Phase</span>
              <span className="text-sm font-black font-mono text-indigo-200 mt-1 block truncate">
                {state.matchPhase.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[8px] font-mono text-slate-500">ZONE COMPLIANCE</span>
          </div>
        </div>
      </div>

      {/* ────────────────── TWO-COLUMN INTERACTIVE ENGINE LAYOUT ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PLAYBOOK SELECTOR RAIL (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md relative overflow-hidden" aria-label="Playbook Templates Selection Rail">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <Radio className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Playbook Engine Deck</h3>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-500">10 MATRICES</span>
            </div>

            {/* List of Playbooks */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {Object.values(playbooks).map((p) => {
                const isSelected = p.id === selectedPlaybookId;
                const isActive = p.startedAt && !p.completedAt;
                const isDone = p.completedAt !== null;
                const matchingTelemetry = activeTelemetryIncidents.find(inc => getMatchingPlaybookId(inc) === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlaybookId(p.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer relative flex flex-col gap-1.5 group ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-600/5' 
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 hover:bg-slate-950/60'
                    }`}
                  >
                    {/* Glowing status line */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r" />
                    )}

                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block line-clamp-1">{p.summary}</span>
                      </div>
                      <span className={`text-[8px] font-mono font-bold tracking-widest uppercase rounded px-1.5 py-0.5 ${getRiskBadgeColor(p.riskLevel)}`}>
                        {p.riskLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[9px] font-mono border-t border-white/[0.03] pt-1.5">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>Est: {p.estCompletionMinutes} mins</span>
                      </div>
                      
                      {/* Playbook Status */}
                      <div className="flex items-center gap-1.5">
                        {matchingTelemetry && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse mr-1">
                            🚨 TELEMETRY ACTIVE
                          </span>
                        )}
                        {isActive && (
                          <span className="text-indigo-400 font-bold uppercase animate-pulse">● ACTIVE</span>
                        )}
                        {isDone && (
                          <span className="text-emerald-400 font-bold uppercase flex items-center gap-0.5">✓ RESOLVED</span>
                        )}
                        {!isActive && !isDone && (
                          <span className="text-slate-500 uppercase font-semibold">STANDBY</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: DETAILED ACTIVE PLAYBOOK & CHECKLIST (Col 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activePlaybook ? (
            <div className="flex flex-col gap-6">
              
              {/* PLAYBOOK METADATA BANNER CARD */}
              <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-500/[0.03] to-transparent pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Active Guide Matrix</span>
                    <h2 className="text-lg font-black text-white mt-1 uppercase tracking-wide flex items-center gap-2">
                      {activePlaybook.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">{activePlaybook.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${getRiskBadgeColor(activePlaybook.riskLevel)}`}>
                      {activePlaybook.riskLevel} RISK LEVEL
                    </span>
                    {activePlaybook.startedAt && (
                      <span className="text-xs font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-indigo-400">
                        EST TIME: {activePlaybook.estCompletionMinutes}M
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-4 space-y-2 text-left">
                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Tactical Objectives</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                      {activePlaybook.objectives.map((obj, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-4 space-y-2 text-left">
                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest font-mono">Suggested Resources & Success</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {activePlaybook.requiredResources.map((res, i) => (
                          <span key={i} className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[9.5px] font-semibold text-slate-400">
                            {res}
                          </span>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-white/[0.03]">
                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest">Success Threshold</span>
                        <p className="text-slate-300 leading-relaxed font-sans font-medium mt-0.5 text-[11px]">{activePlaybook.successCriteria}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Action Controllers */}
                <div className="mt-5 border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!activePlaybook.startedAt ? (
                      <button
                        onClick={handleStartPlaybook}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/10 transition-all cursor-pointer uppercase tracking-wider"
                      >
                        🚀 Initiate Operational Playbook
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-3 w-3 rounded-full bg-indigo-400 animate-ping" />
                        <span className="text-xs font-mono font-black text-indigo-300 uppercase tracking-wider">
                          PLAYBOOK IN PROCESS ({progressPercent}% COMPLETE)
                        </span>
                      </div>
                    )}
                  </div>

                  {activePlaybook.startedAt && (
                    <button
                      onClick={handleResetPlaybook}
                      className="rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white px-3.5 py-2.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restart Playbook
                    </button>
                  )}
                </div>
              </section>

              {/* TELEMETRY-DRIVEN AI UPDATES RECOMMENDATION LAYER */}
              {activePlaybook.startedAt && (
                <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 to-indigo-950/15 p-5 shadow-xl relative overflow-hidden" aria-label="AI Telemetry Driven Updates">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/[0.02] blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">Telemetry-Driven AI Updates</h4>
                      <p className="text-[9px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">Real-time playbook adaptations based on stadium sensors</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {telemetryRecommendations[selectedPlaybookId]?.length > 0 ? (
                      telemetryRecommendations[selectedPlaybookId].map((rec, i) => {
                        const cleanRecStep = rec.replace(/^⚠️\s*/, '').replace(/^🌧️\s*/, '').replace(/^⚡\s*/, '').trim();
                        const isAlreadyAdded = activePlaybook.checklist.some(item => item.step === cleanRecStep);
                        return (
                          <div key={i} className="rounded-xl border border-indigo-500/10 bg-slate-900/60 px-3.5 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                            <div className="flex gap-2 items-start">
                              <Activity className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                              <p className="text-slate-300 font-medium font-sans leading-relaxed">{rec}</p>
                            </div>
                            {!isAlreadyAdded && !rec.startsWith('✓') && (
                              <button
                                onClick={() => handleAddRecommendationAsStep(rec)}
                                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-[10px] font-bold text-white shrink-0 cursor-pointer flex items-center gap-1 transition-all uppercase tracking-wider"
                              >
                                <Plus className="h-3.5 w-3.5" /> Apply as Step
                              </button>
                            )}
                            {isAlreadyAdded && (
                              <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/20 rounded px-2 py-0.5">
                                ✓ Applied
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-slate-500 font-sans italic">Scanning sensor lines... Telemetry matches current objectives perfectly.</p>
                    )}
                  </div>
                </section>
              )}

              {/* INTERACTIVE CHECKLIST COMPONENT */}
              {activePlaybook.startedAt ? (
                <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl" aria-label="Interactive Playbook Checklist Steps">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Tactical Checklist Checklist</h3>
                      <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">Execute, skip, annotate, or reassign dispatch groups</p>
                    </div>
                    
                    {/* Overall Progress Slider */}
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <span className="text-[10px] font-mono font-black text-indigo-300">{progressPercent}% DONE</span>
                      <div className="h-2 w-28 bg-slate-950 border border-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activePlaybook.checklist.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 transition duration-200 relative ${
                            item.completed 
                              ? 'bg-emerald-950/10 border-emerald-900/30' 
                              : item.skipped 
                              ? 'bg-slate-950/30 border-slate-900 text-slate-500' 
                              : 'bg-slate-950/70 border-slate-850 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            
                            {/* Checklist Text / Checkbox */}
                            <div className="flex items-start gap-3.5">
                              <button
                                onClick={() => handleToggleComplete(item.id)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                                  item.completed 
                                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                                    : 'border-slate-700 hover:border-slate-500'
                                }`}
                                aria-label={`Mark step as ${item.completed ? 'incomplete' : 'complete'}`}
                              >
                                {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>

                              <div className="space-y-1">
                                <p className={`text-xs font-semibold leading-relaxed font-sans ${
                                  item.completed ? 'text-slate-400 line-through' : item.skipped ? 'text-slate-500' : 'text-slate-200'
                                }`}>
                                  {item.step}
                                </p>
                                
                                {/* Assigned Team Badge & Reassignment Trigger */}
                                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                                    <Users className="h-3 w-3 text-slate-500" />
                                    <span>Team: {item.assignedTeam}</span>
                                    {item.assignedTeam !== item.originalTeam && (
                                      <span className="text-amber-400 text-[8px] font-mono tracking-wider ml-1">(REASSIGNED)</span>
                                    )}
                                  </span>

                                  {/* Quick reassign triggers */}
                                  <div className="flex gap-1.5 items-center">
                                    <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">REASSIGN:</span>
                                    {['Command', 'Security', 'Medical', 'Volunteers'].map((teamAbrv) => {
                                      const fullTeamName = 
                                        teamAbrv === 'Command' ? 'Command Desk' :
                                        teamAbrv === 'Security' ? 'Security Unit Alpha' :
                                        teamAbrv === 'Medical' ? 'Medical Response Team 1' :
                                        'Volunteers Team Beta';
                                      
                                      const isCurrentlyAssigned = item.assignedTeam === fullTeamName;

                                      return (
                                        <button
                                          key={teamAbrv}
                                          onClick={() => handleReassignTeam(item.id, fullTeamName)}
                                          className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded transition ${
                                            isCurrentlyAssigned 
                                              ? 'bg-indigo-600 text-white font-black' 
                                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {teamAbrv}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Complete / Skip action block */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              <button
                                onClick={() => handleToggleSkip(item.id)}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                                  item.skipped 
                                    ? 'bg-slate-900 border-slate-800 text-slate-400' 
                                    : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {item.skipped ? '✓ Skipped' : 'Skip'}
                              </button>
                            </div>
                          </div>

                          {/* Notes Annotation Area */}
                          <div className="mt-3.5 border-t border-white/[0.03] pt-2.5">
                            {item.isEditingNotes ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  defaultValue={item.notes}
                                  placeholder="Add dynamic notes/observations..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveNotes(item.id, e.currentTarget.value);
                                    }
                                  }}
                                  onBlur={(e) => handleSaveNotes(item.id, e.target.value)}
                                  className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
                                  autoFocus
                                />
                                <button
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                                    handleSaveNotes(item.id, input.value);
                                  }}
                                  className="bg-indigo-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-500 uppercase"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="text-slate-400 italic">
                                  {item.notes ? (
                                    <span className="text-indigo-300 not-italic font-sans">✍ Note: {item.notes}</span>
                                  ) : (
                                    'No field observations logged yet.'
                                  )}
                                </span>
                                <button
                                  onClick={() => handleToggleEditNotes(item.id)}
                                  className="text-[9.5px] text-indigo-400 hover:underline cursor-pointer uppercase font-bold"
                                >
                                  {item.notes ? 'Edit note' : '+ Add Note'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                /* ACTIONABLE STANDBY SPLASH NOTICE */
                <section className="rounded-3xl border border-dashed border-indigo-500/20 bg-slate-950/20 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.01] to-transparent pointer-events-none" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-4 animate-bounce">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Playbook Ready for Dispatch</h4>
                  <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed font-sans">
                    This tactical response matrix is in standby mode. Prepare dispatch units and initialize real-time step monitoring.
                  </p>
                  
                  {/* Quick-list of objectives */}
                  <div className="mt-5 mb-6 bg-slate-950/40 rounded-2xl border border-white/5 p-4 max-w-md text-left w-full">
                    <span className="block text-[8px] font-black uppercase tracking-wider text-slate-500 mb-2">Matrix Target Objectives</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activePlaybook.objectives.map((obj, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-indigo-400 font-bold shrink-0">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleStartPlaybook}
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs font-black text-white shadow-xl shadow-indigo-600/15 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    🚀 Initiate Operational Playbook
                  </button>
                </section>
              )}

              {/* POST-INCIDENT RESOLUTION REPORT */}
              {isPlaybookCompleted && resolutionDetails && (
                <section className="rounded-3xl border border-emerald-500/15 bg-gradient-to-b from-slate-900/60 to-emerald-950/10 p-6 shadow-2xl relative overflow-hidden" id="post-incident-report-center">
                  {/* Subtle glowing elements */}
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
                  
                  <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-200">Post-Incident Resolution Report</h3>
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5 font-mono">🏆 Incident Resolved Successfully</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-2 py-0.5 rounded">
                      GEN-V1
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left text-xs">
                    
                    {/* Resolution Metrics Left */}
                    <div className="md:col-span-4 space-y-4 border-r border-white/5 pr-4">
                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest">Active Incident Type</span>
                        <span className="text-sm font-black text-white block mt-0.5 uppercase tracking-wide">{activePlaybook.incidentType}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest font-mono">Telemetry Resolution Time</span>
                        <span className="text-base font-black text-emerald-400 block mt-0.5 font-mono">{resolutionDetails.resolutionTime}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest">Incident Risk Vector</span>
                        <span className="text-xs font-bold text-white block mt-0.5">{activePlaybook.riskLevel}</span>
                      </div>
                    </div>

                    {/* Timeline of Actions Taken */}
                    <div className="md:col-span-8 space-y-4">
                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest font-mono mb-2">Detailed Action Timeline Log</span>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 font-mono text-[10px] leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                          {activePlaybook.historyLog.map((log, idx) => (
                            <div key={idx} className="text-slate-400 border-b border-white/[0.02] pb-1.5 last:border-0">
                              <span className="text-emerald-400 font-black">{log.slice(0, 10)}</span>
                              <span>{log.slice(10)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Operational Lessons Learned</span>
                          <ul className="space-y-1 text-[10.5px] text-slate-300 leading-relaxed font-sans">
                            {resolutionDetails.lessons.map((lesson, i) => (
                              <li key={i} className="flex gap-1.5">
                                <span className="text-emerald-400 font-bold shrink-0">•</span>
                                <span>{lesson}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="block text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-1.5">AI Playbook Improvements</span>
                          <ul className="space-y-1 text-[10.5px] text-slate-300 leading-relaxed font-sans">
                            {resolutionDetails.aiSuggestions.map((sug, i) => (
                              <li key={i} className="flex gap-1.5">
                                <span className="text-indigo-400 font-bold shrink-0">•</span>
                                <span>{sug}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Actionable Report Registry Actions */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLogReport}
                          disabled={isSubmittingReport || reportSubmitted}
                          className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider ${
                            reportSubmitted
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                          }`}
                        >
                          {isSubmittingReport ? (
                            <>
                              <span className="h-3 w-3 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                              Syncing with Central HQ...
                            </>
                          ) : reportSubmitted ? (
                            '✓ Logged in central HQ registry'
                          ) : (
                            '📂 Log Report to HQ Registry'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowExportDetails(!showExportDetails)}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2.5 text-xs font-bold transition-all uppercase tracking-wider"
                        >
                          {showExportDetails ? 'Hide Raw Details' : '🔗 View Raw Briefing'}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {reportSubmitted ? 'Status: SECURED & ARCHIVED' : 'Status: LOCAL COMPILED'}
                      </span>
                    </div>

                    {/* Raw Copyable Log Area */}
                    {showExportDetails && (
                      <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-white/5 text-left font-mono text-[10px] space-y-3">
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="text-slate-400 font-black uppercase tracking-wider">Secure Text Export Bundle</span>
                          <button
                            type="button"
                            onClick={() => {
                              const text = `=== FIFA WORLD CUP MATCHDAY HQ REPORT ===\nINCIDENT: ${activePlaybook.title}\nRISK LEVEL: ${activePlaybook.riskLevel}\nRESOLUTION TIME: ${resolutionDetails.resolutionTime}\n\n=== ACTION LOG ===\n${activePlaybook.historyLog.join('\n')}\n\n=== LESSONS LEARNED ===\n${resolutionDetails.lessons.join('\n')}\n=== AI RECS ===\n${resolutionDetails.aiSuggestions.join('\n')}`;
                              navigator.clipboard.writeText(text);
                            }}
                            className="text-[9px] text-indigo-400 hover:underline uppercase font-bold"
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                        <pre className="text-slate-300 whitespace-pre-wrap select-all leading-relaxed">
{`=== FIFA WORLD CUP MATCHDAY HQ REPORT ===
INCIDENT: ${activePlaybook.title}
RISK LEVEL: ${activePlaybook.riskLevel}
RESOLUTION TIME: ${resolutionDetails.resolutionTime}

=== ACTION LOG ===
${activePlaybook.historyLog.join('\n')}

=== LESSONS LEARNED ===
${resolutionDetails.lessons.join('\n')}

=== AI RECOMMENDATIONS ===
${resolutionDetails.aiSuggestions.join('\n')}`}
                        </pre>
                      </div>
                    )}

                  </div>
                </section>
              )}

            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center text-slate-500">
              <UserX className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">No active playbook selected. Choose one from the list.</p>
            </div>
          )}
        </div>
        
      </div>

      {/* ────────────────── CUSTOM PLAYBOOK TRIGGER MODAL/FORM ────────────────── */}
      {showCustomTriggerForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 transition-opacity backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-playbook-title"
        >
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/[0.03] blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <h3 id="custom-playbook-title" className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                🤖 Dynamic Playbook Generator
              </h3>
              <button
                onClick={() => setShowCustomTriggerForm(false)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomPlaybook} className="mt-4 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="p_title" className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Playbook Title</label>
                  <input
                    id="p_title"
                    type="text"
                    required
                    placeholder="e.g. VIP Ingress Holdout"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="p_type" className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Incident Type Matrix</label>
                  <select
                    id="p_type"
                    value={customIncidentType}
                    onChange={(e) => setCustomIncidentType(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="Crowd Surge">Crowd Surge</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Lost Child">Lost Child</option>
                    <option value="Weather Warning">Weather Warning</option>
                    <option value="Gate Failure">Gate Failure</option>
                    <option value="Fire Alarm">Fire Alarm</option>
                    <option value="Power Outage">Power Outage</option>
                    <option value="VIP Movement">VIP Movement</option>
                    <option value="Transport Delay">Transport Delay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="p_risk" className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Simulated Risk Level</label>
                  <select
                    id="p_risk"
                    value={customRisk}
                    onChange={(e) => setCustomRisk(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="LOW">LOW RISK</option>
                    <option value="MEDIUM">MEDIUM RISK</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="CRITICAL">CRITICAL RISK</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="p_summary" className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Summary Narrative</label>
                  <input
                    id="p_summary"
                    type="text"
                    required
                    placeholder="Briefly describe the incident core context..."
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="p_steps" className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">checklist steps (one per line)</label>
                <textarea
                  id="p_steps"
                  rows={4}
                  required
                  placeholder="Step 1: Coordinate area evacuation&#10;Step 2: Mobilize standby medic crew"
                  value={customSteps}
                  onChange={(e) => setCustomSteps(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none font-sans"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCustomTriggerForm(false)}
                  className="rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white px-5 py-2.5 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-black shadow-lg transition-all"
                >
                  Spawn and Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
