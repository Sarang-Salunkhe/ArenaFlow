import {
  MatchPhase,
  StadiumState,
  StadiumZone,
  Incident,
  TransportState,
  CrowdLevel,
  Trend,
  AttentionLevel,
  GateStatus,
  MatchState,
} from '../types.js';

// Initial stadium zones config
const INITIAL_ZONES: {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  type: StadiumZone['type'];
  isAccessible: boolean;
}[] = [
  { id: 'PLAZA_NORTH', name: 'North Plaza', capacity: 15000, occupancy: 2000, type: 'PLAZA', isAccessible: true },
  { id: 'PLAZA_SOUTH', name: 'South Plaza', capacity: 15000, occupancy: 1500, type: 'PLAZA', isAccessible: true },
  { id: 'CONCOURSE_LOWER', name: 'Lower Concourse', capacity: 12000, occupancy: 1000, type: 'CONCOURSE', isAccessible: true },
  { id: 'CONCOURSE_UPPER', name: 'Upper Concourse', capacity: 8000, occupancy: 800, type: 'CONCOURSE', isAccessible: true },
  { id: 'STAND_NORTH', name: 'North Stand (Stairs Only)', capacity: 10000, occupancy: 1200, type: 'SEATING', isAccessible: false },
  { id: 'STAND_SOUTH', name: 'South Stand (Stairs Only)', capacity: 10000, occupancy: 1000, type: 'SEATING', isAccessible: false },
  { id: 'STAND_EAST', name: 'East Stand (Accessible)', capacity: 10000, occupancy: 1500, type: 'SEATING', isAccessible: true },
  { id: 'STAND_WEST', name: 'West Stand (Accessible)', capacity: 10000, occupancy: 1100, type: 'SEATING', isAccessible: true },
  { id: 'FOOD_COURT_A', name: 'Food Court A', capacity: 3000, occupancy: 400, type: 'SERVICE', isAccessible: true },
  { id: 'FOOD_COURT_B', name: 'Food Court B', capacity: 3000, occupancy: 300, type: 'SERVICE', isAccessible: true },
  { id: 'MEDICAL_POST_1', name: 'Medical Station 1', capacity: 100, occupancy: 2, type: 'MEDICAL', isAccessible: true },
  { id: 'MEDICAL_POST_2', name: 'Medical Station 2', capacity: 100, occupancy: 1, type: 'MEDICAL', isAccessible: true },
  { id: 'LIFT_NORTH', name: 'North Lift', capacity: 50, occupancy: 5, type: 'CORRIDOR', isAccessible: true },
  { id: 'EMERGENCY_CORRIDOR', name: 'Emergency Corridor', capacity: 2000, occupancy: 0, type: 'CORRIDOR', isAccessible: true },
  { id: 'METRO_STATION', name: 'Metro Station Plaza', capacity: 20000, occupancy: 800, type: 'TRANSPORT', isAccessible: true },
  { id: 'BUS_STATION', name: 'Bus Station Plaza', capacity: 10000, occupancy: 400, type: 'TRANSPORT', isAccessible: true },
];

const INITIAL_GATES = [
  { id: 'GATE_A', name: 'Gate A (North)', capacity: 5000, occupancy: 500, status: 'OPEN', avgQueueSeconds: 120, trend: 'STABLE' },
  { id: 'GATE_B', name: 'Gate B (South)', capacity: 5000, occupancy: 450, status: 'OPEN', avgQueueSeconds: 110, trend: 'STABLE' },
  { id: 'GATE_C', name: 'Gate C (East)', capacity: 4000, occupancy: 300, status: 'OPEN', avgQueueSeconds: 80, trend: 'STABLE' },
  { id: 'GATE_D', name: 'Gate D (West)', capacity: 4000, occupancy: 250, status: 'OPEN', avgQueueSeconds: 70, trend: 'STABLE' },
];

const INITIAL_TRANSPORT: TransportState = {
  metroStatus: 'Normal operations',
  metroQueueSeconds: 180,
  busStatus: 'Normal operations',
  busQueueSeconds: 120,
  taxiQueueSeconds: 60,
};

const INITIAL_MATCH: MatchState = {
  minute: 0,
  half: 'PRE_MATCH',
  addedTime: 0,
  status: 'Pre Match',
  scoreHome: 0,
  scoreAway: 0,
  teamHome: 'Cascadia FC',
  teamAway: 'Metro United',
  importance: 'CRITICAL',
  attendance: 12400,
};

let state: StadiumState = {
  matchPhase: 'PRE_MATCH',
  tickCount: 0,
  zones: [],
  gates: [],
  incidents: [],
  transport: { ...INITIAL_TRANSPORT },
  match: { ...INITIAL_MATCH },
};

export function updateMatchState() {
  const phase = state.matchPhase;
  const tick = state.tickCount;

  if (phase === 'PRE_MATCH') {
    state.match.minute = 0;
    state.match.half = 'PRE_MATCH';
    state.match.status = 'Pre Match';
    state.match.attendance = Math.min(22000 + tick * 1200, 28000);
    state.match.addedTime = 0;
  } else if (phase === 'ENTRY_SURGE') {
    state.match.minute = 0;
    state.match.half = 'PRE_MATCH';
    state.match.status = 'Pre Match';
    state.match.attendance = Math.min(28000 + tick * 3200, 58000);
    state.match.addedTime = 0;
  } else if (phase === 'MATCH_ACTIVE') {
    state.match.minute = Math.min(45, Math.max(1, tick * 2));
    state.match.half = 'FIRST_HALF';
    state.match.status = 'First Half';
    state.match.attendance = Math.min(58000 + tick * 400, 68500);
    state.match.addedTime = 2;
  } else if (phase === 'HALF_TIME') {
    state.match.minute = 45;
    state.match.half = 'HALF_TIME';
    state.match.status = 'Half Time';
    state.match.attendance = 68500;
    state.match.addedTime = 0;
  } else if (phase === 'MATCH_END') {
    state.match.minute = Math.min(90, Math.max(46, 45 + tick * 2));
    state.match.half = 'SECOND_HALF';
    state.match.status = 'Second Half';
    state.match.attendance = 68500;
    state.match.addedTime = 4;
  } else if (phase === 'EXIT_SURGE') {
    state.match.minute = 90;
    state.match.half = 'FINISHED';
    state.match.status = 'Finished';
    state.match.attendance = 68500;
    state.match.addedTime = 0;
  }
}

export function resetSimulation() {
  state.matchPhase = 'PRE_MATCH';
  state.tickCount = 0;
  state.incidents = [];
  state.transport = { ...INITIAL_TRANSPORT };
  state.match = { ...INITIAL_MATCH };
  
  state.zones = INITIAL_ZONES.map(z => ({
    ...z,
    crowdLevel: 'LOW' as CrowdLevel,
    trend: 'STABLE' as Trend,
    riskScore: 0,
    attentionLevel: 'NORMAL' as AttentionLevel,
  }));

  state.gates = INITIAL_GATES.map(g => ({
    ...g,
    status: 'OPEN' as GateStatus,
    trend: 'STABLE' as Trend,
  }));

  updateMatchState();
  recalculateCrowdMetrics();
}

// Helper to determine crowd level based on occupancy percentage
function getCrowdLevelFromPct(pct: number): CrowdLevel {
  if (pct >= 85) return 'CRITICAL';
  if (pct >= 65) return 'HIGH';
  if (pct >= 35) return 'MODERATE';
  return 'LOW';
}

// Pure calculation of metrics for zones and gates based on their occupancies
export function recalculateCrowdMetrics() {
  state.zones.forEach(zone => {
    const occupancyPct = (zone.occupancy / zone.capacity) * 100;
    zone.crowdLevel = getCrowdLevelFromPct(occupancyPct);

    // Calculate dynamic risk score based on occupancy, severity of active incidents in the zone, etc.
    let baseRisk = Math.min(100, Math.round(occupancyPct));
    
    // Check for active incidents in this zone
    const zoneIncidents = state.incidents.filter(i => i.zoneId === zone.id && i.active);
    zoneIncidents.forEach(incident => {
      if (incident.severity === 'CRITICAL') baseRisk += 40;
      else if (incident.severity === 'HIGH') baseRisk += 25;
      else if (incident.severity === 'MEDIUM') baseRisk += 15;
      else baseRisk += 5;
    });

    // Cap at 100
    zone.riskScore = Math.min(100, Math.max(0, baseRisk));

    // Determine attention level based on risk score
    if (zone.riskScore >= 80) zone.attentionLevel = 'CRITICAL';
    else if (zone.riskScore >= 60) zone.attentionLevel = 'HIGH';
    else if (zone.riskScore >= 35) zone.attentionLevel = 'WATCH';
    else zone.attentionLevel = 'NORMAL';
  });

  state.gates.forEach(gate => {
    const queueRatio = gate.occupancy / gate.capacity;
    if (gate.status !== 'CLOSED' && gate.status !== 'RESTRICTED') {
      if (queueRatio >= 0.8) {
        gate.status = 'BUSY';
      } else {
        gate.status = 'OPEN';
      }
    }
    // Calculate approximate queue time
    gate.avgQueueSeconds = Math.round(queueRatio * 600); // 10 minutes at max queue ratio
  });
}

export function getCurrentState(): StadiumState {
  if (state.zones.length === 0) {
    resetSimulation();
  }
  return state;
}

export function setMatchPhase(phase: MatchPhase) {
  state.matchPhase = phase;
  state.tickCount = 0; // reset ticks for the new phase
  state.zones = state.zones.map(zone => ({ ...zone }));
  state.gates = state.gates.map(gate => ({ ...gate }));
  applyPhaseTargets();
  updateMatchState();
  recalculateCrowdMetrics();
}

function applyPhaseTargets() {
  const phase = state.matchPhase;
  
  // Phase target parameters (deterministic target occupancies)
  state.zones.forEach(zone => {
    let targetOccupancy = 0;
    let trend: Trend = 'STABLE';
    
    switch (phase) {
      case 'PRE_MATCH':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.15;
        else if (zone.type === 'TRANSPORT') targetOccupancy = zone.capacity * 0.10;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.10;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.12;
        else targetOccupancy = zone.capacity * 0.15;
        trend = 'RISING';
        break;
      case 'ENTRY_SURGE':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.70;
        else if (zone.type === 'TRANSPORT') targetOccupancy = zone.capacity * 0.45;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.50;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.35;
        else targetOccupancy = zone.capacity * 0.25;
        trend = 'RAPIDLY_RISING';
        break;
      case 'MATCH_ACTIVE':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.05;
        else if (zone.type === 'TRANSPORT') targetOccupancy = zone.capacity * 0.02;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.05;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.92;
        else targetOccupancy = zone.capacity * 0.08;
        trend = 'STABLE';
        break;
      case 'HALF_TIME':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.08;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.85;
        else if (zone.type === 'SERVICE') targetOccupancy = zone.capacity * 0.80;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.70; // fans leave seats temporarily
        else targetOccupancy = zone.capacity * 0.10;
        trend = 'RISING';
        break;
      case 'MATCH_END':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.20;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.40;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.55;
        else if (zone.type === 'TRANSPORT') targetOccupancy = zone.capacity * 0.25;
        else targetOccupancy = zone.capacity * 0.10;
        trend = 'FALLING';
        break;
      case 'EXIT_SURGE':
        if (zone.type === 'PLAZA') targetOccupancy = zone.capacity * 0.80;
        else if (zone.type === 'CONCOURSE') targetOccupancy = zone.capacity * 0.30;
        else if (zone.type === 'SEATING') targetOccupancy = zone.capacity * 0.05;
        else if (zone.type === 'TRANSPORT') targetOccupancy = zone.capacity * 0.90;
        else if (zone.type === 'CORRIDOR') targetOccupancy = zone.capacity * 0.85;
        else targetOccupancy = zone.capacity * 0.05;
        trend = 'RAPIDLY_RISING';
        break;
    }
    
    zone.occupancy = Math.round(targetOccupancy);
    zone.trend = trend;
  });

  state.gates.forEach(gate => {
    let targetQueue = 0;
    let trend: Trend = 'STABLE';
    
    switch (phase) {
      case 'PRE_MATCH':
        targetQueue = gate.capacity * 0.15;
        trend = 'RISING';
        break;
      case 'ENTRY_SURGE':
        targetQueue = gate.capacity * 0.85;
        trend = 'RAPIDLY_RISING';
        break;
      case 'MATCH_ACTIVE':
        targetQueue = gate.capacity * 0.05;
        trend = 'FALLING';
        break;
      case 'HALF_TIME':
        targetQueue = gate.capacity * 0.05;
        trend = 'STABLE';
        break;
      case 'MATCH_END':
        targetQueue = gate.capacity * 0.10;
        trend = 'RISING';
        break;
      case 'EXIT_SURGE':
        targetQueue = gate.capacity * 0.80;
        trend = 'RAPIDLY_RISING';
        break;
    }
    
    gate.occupancy = Math.round(targetQueue);
    gate.trend = trend;
  });

  // Adjust transport queues based on phase
  if (phase === 'EXIT_SURGE') {
    state.transport.metroQueueSeconds = 900; // 15 mins
    state.transport.busQueueSeconds = 600; // 10 mins
    state.transport.taxiQueueSeconds = 300;
  } else if (phase === 'MATCH_END') {
    state.transport.metroQueueSeconds = 420;
    state.transport.busQueueSeconds = 300;
    state.transport.taxiQueueSeconds = 180;
  } else {
    state.transport.metroQueueSeconds = 180;
    state.transport.busQueueSeconds = 120;
    state.transport.taxiQueueSeconds = 60;
  }
}

export function advanceSimulation() {
  state.tickCount += 1;

  state.zones = state.zones.map((zone, index) => {
    const delta = Math.sin(state.tickCount + index) * (zone.capacity * 0.02);
    const nextOccupancy = Math.max(
      0,
      Math.min(zone.capacity, Math.round(zone.occupancy + delta)),
    );

    return {
      ...zone,
      occupancy: nextOccupancy,
    };
  });

  state.gates = state.gates.map((gate, index) => {
    const delta = Math.cos(state.tickCount + index) * (gate.capacity * 0.015);
    const nextOccupancy = Math.max(
      0,
      Math.min(gate.capacity, Math.round(gate.occupancy + delta)),
    );

    return {
      ...gate,
      occupancy: nextOccupancy,
    };
  });

  updateMatchState();

  // Automatic match developments during play
  if (state.matchPhase === 'MATCH_ACTIVE' && state.tickCount === 8 && state.match.scoreHome === 0) {
    // Cascadia FC scores!
    state.match.scoreHome = 1;
    state.incidents = [
      ...state.incidents,
      {
        id: `auto_goal_home_${Date.now()}`,
        zoneId: 'STAND_NORTH',
        title: 'GOAL! Cascadia FC Scores!',
        severity: 'LOW',
        description: 'Cascadia FC takes the lead! Spectacular volley sparks immense roar and jumping celebrations in North Stand.',
        active: true,
        timestamp: new Date().toISOString(),
      }
    ];
  } else if (state.matchPhase === 'MATCH_END' && state.tickCount === 12 && state.match.scoreAway === 0) {
    // Metro United equalizes!
    state.match.scoreAway = 1;
    state.incidents = [
      ...state.incidents,
      {
        id: `auto_goal_away_${Date.now()}`,
        zoneId: 'STAND_SOUTH',
        title: 'GOAL! Metro United Equalizer',
        severity: 'LOW',
        description: 'Metro United score an equalizer! Wild away support celebrations in South Stand Section S3.',
        active: true,
        timestamp: new Date().toISOString(),
      }
    ];
  }

  recalculateCrowdMetrics();
}

export function triggerScenario(scenario: string) {
  const nowStr = new Date().toISOString();

  switch (scenario) {
    case 'GOAL': {
      state.match.scoreHome += 1;
      const standN = state.zones.find(z => z.id === 'STAND_NORTH');
      if (standN) {
        standN.occupancy = Math.min(standN.capacity, Math.round(standN.occupancy * 1.08));
        standN.trend = 'RAPIDLY_RISING';
      }
      const standS = state.zones.find(z => z.id === 'STAND_SOUTH');
      if (standS) {
        standS.occupancy = Math.min(standS.capacity, Math.round(standS.occupancy * 1.05));
        standS.trend = 'RAPIDLY_RISING';
      }
      state.zones.forEach(z => {
        if (z.type === 'SERVICE') {
          z.occupancy = Math.min(z.capacity, Math.round(z.occupancy * 1.15));
          z.trend = 'RISING';
        }
      });
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_goal_${Date.now()}`,
          zoneId: 'STAND_NORTH',
          title: 'GOAL! Cascadia FC Score!',
          severity: 'LOW',
          description: 'Stadium crowd explodes in celebration. Sound levels peak at 112dB. Seating bowls are highly active.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'YELLOW_CARD': {
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_yellow_${Date.now()}`,
          zoneId: 'STAND_SOUTH',
          title: 'Yellow Card Issued',
          severity: 'LOW',
          description: 'A yellow card is shown to Metro United defender. Moderate tension and booing in the South Stand.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'RED_CARD': {
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_red_${Date.now()}`,
          zoneId: 'STAND_SOUTH',
          title: 'Red Card Issued - High Tension',
          severity: 'MEDIUM',
          description: 'Metro United player sent off for a tackle. High crowd tension. Extra security personnel positioned near player tunnel.',
          active: true,
          timestamp: nowStr,
        },
      ];
      const standS = state.zones.find(z => z.id === 'STAND_SOUTH');
      if (standS) {
        standS.trend = 'RISING';
      }
      break;
    }

    case 'MEDICAL_INCIDENT':
    case 'MEDICAL_EMERGENCY': {
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_med_${Date.now()}`,
          zoneId: 'STAND_EAST',
          title: 'Medical Emergency Stand East',
          severity: 'CRITICAL',
          description: 'First responders dispatched to Section E4 row 12 for immediate medical attention. Walkways being cleared.',
          active: true,
          timestamp: nowStr,
        },
      ];
      const standE = state.zones.find(z => z.id === 'STAND_EAST');
      if (standE) {
        standE.trend = 'STABLE';
      }
      break;
    }

    case 'CROWD_SURGE': {
      const concourse = state.zones.find(z => z.id === 'CONCOURSE_LOWER');
      if (concourse) {
        concourse.occupancy = Math.round(concourse.capacity * 0.95);
        concourse.trend = 'RAPIDLY_RISING';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_surge_${Date.now()}`,
          zoneId: 'CONCOURSE_LOWER',
          title: 'Crowd Surge Lower Concourse',
          severity: 'HIGH',
          description: 'Sudden high passenger flow at Lower Concourse entrances. Pacing rails deployed to steady the inflow.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'GATE_CONGESTION': {
      const gateA = state.gates.find(g => g.id === 'GATE_A');
      if (gateA) {
        gateA.status = 'RESTRICTED';
        gateA.occupancy = Math.round(gateA.capacity * 0.95);
        gateA.trend = 'RAPIDLY_RISING';
      }
      const plazaN = state.zones.find(z => z.id === 'PLAZA_NORTH');
      if (plazaN) {
        plazaN.occupancy = Math.round(plazaN.capacity * 0.90);
        plazaN.trend = 'RAPIDLY_RISING';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_gate_cong_${Date.now()}`,
          zoneId: 'PLAZA_NORTH',
          title: 'Severe Gate A Queue Congestion',
          severity: 'HIGH',
          description: 'Gate A queue times exceeded 20 minutes due to ticket reader failure. Fans directed to alternative gates.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'HEAVY_RAIN': {
      state.zones.forEach(z => {
        if (z.type === 'PLAZA') {
          z.occupancy = Math.round(z.occupancy * 0.3);
          z.trend = 'FALLING';
        } else if (z.type === 'CONCOURSE' || z.type === 'SERVICE') {
          z.occupancy = Math.min(z.capacity, Math.round(z.occupancy * 1.5));
          z.trend = 'RAPIDLY_RISING';
        }
      });
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_rain_${Date.now()}`,
          zoneId: 'CONCOURSE_LOWER',
          title: 'Heavy Rain - Covered Concourse Surge',
          severity: 'MEDIUM',
          description: 'Heavy sudden rainfall started. Fans rushing to covered areas. High slip warning active across all concourses.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'VIP_ARRIVAL': {
      const standW = state.zones.find(z => z.id === 'STAND_WEST');
      if (standW) {
        standW.occupancy = Math.min(standW.capacity, Math.round(standW.occupancy * 1.15));
        standW.trend = 'RISING';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_vip_${Date.now()}`,
          zoneId: 'STAND_WEST',
          title: 'VIP Dignitary Arrival',
          severity: 'MEDIUM',
          description: 'Official VIP motorcade has arrived. Stand West VIP gates isolated. Escort team deployed.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'SECURITY_ALERT': {
      const gateB = state.gates.find(g => g.id === 'GATE_B');
      if (gateB) {
        gateB.status = 'CLOSED';
        gateB.trend = 'STABLE';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_security_${Date.now()}`,
          zoneId: 'PLAZA_SOUTH',
          title: 'Unattended Package Security Alert',
          severity: 'CRITICAL',
          description: 'Unattended bag spotted at South Plaza Entrance Gate B. Cordon established. Security responders on scene.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'LOST_CHILD': {
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_lost_${Date.now()}`,
          zoneId: 'PLAZA_NORTH',
          title: 'Lost Child Alert',
          severity: 'LOW',
          description: 'An 8-year-old child reported separated near North Plaza. Security staff alerted and searching concourses.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'PUBLIC_TRANSPORT_DELAY': {
      state.transport.metroQueueSeconds = 900;
      const metro = state.zones.find(z => z.id === 'METRO_STATION');
      if (metro) {
        metro.occupancy = Math.round(metro.capacity * 0.95);
        metro.trend = 'RAPIDLY_RISING';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_transport_${Date.now()}`,
          zoneId: 'METRO_STATION',
          title: 'Metro Service Technical Delay',
          severity: 'HIGH',
          description: 'Metro Line 2 experiencing signal errors. Station platforms building high density. Bus shuttle pacing activated.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'POWER_FAILURE': {
      const upperConc = state.zones.find(z => z.id === 'CONCOURSE_UPPER');
      if (upperConc) {
        upperConc.trend = 'STABLE';
      }
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_power_${Date.now()}`,
          zoneId: 'CONCOURSE_UPPER',
          title: 'Substation Power Interruption',
          severity: 'CRITICAL',
          description: 'Partial power blackout in Upper Concourse. Emergency backup generators online. High tracking on exits.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }

    case 'ROUTE_CLOSURE': {
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_route_close_${state.tickCount}`,
          zoneId: 'EMERGENCY_CORRIDOR',
          title: 'Emergency Corridor Blocked',
          severity: 'HIGH',
          description: 'Structural inspection underway in Emergency Corridor. Sector closed to public.',
          active: true,
          timestamp: nowStr,
        },
      ];

      const corridor = state.zones.find(z => z.id === 'EMERGENCY_CORRIDOR');
      if (corridor) {
        corridor.occupancy = 0;
      }
      break;
    }

    case 'EXIT_SURGE': {
      setMatchPhase('EXIT_SURGE');
      state.incidents = [
        ...state.incidents,
        {
          id: `scen_exit_surge_${state.tickCount}`,
          zoneId: 'METRO_STATION',
          title: 'Metro Station Platform Surge',
          severity: 'HIGH',
          description: 'Extremely high passenger volume at Metro Station. Ingress restrictions in place.',
          active: true,
          timestamp: nowStr,
        },
      ];
      break;
    }
  }

  recalculateCrowdMetrics();
}

export function reportIncident(incidentData: Omit<Incident, 'id' | 'active' | 'timestamp'>) {
  const newIncident: Incident = {
    id: `inc_${Date.now()}`,
    zoneId: incidentData.zoneId,
    title: incidentData.title,
    severity: incidentData.severity,
    description: incidentData.description,
    active: true,
    timestamp: new Date().toISOString(),
  };
  state.incidents = [...state.incidents, newIncident];
  recalculateCrowdMetrics();
  return newIncident;
}
