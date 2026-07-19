export type MatchPhase =
  | 'PRE_MATCH'
  | 'ENTRY_SURGE'
  | 'MATCH_ACTIVE'
  | 'HALF_TIME'
  | 'MATCH_END'
  | 'EXIT_SURGE';

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type Trend = 'FALLING' | 'STABLE' | 'RISING' | 'RAPIDLY_RISING';

export type AttentionLevel = 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL';

export type GateStatus = 'OPEN' | 'BUSY' | 'RESTRICTED' | 'CLOSED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StadiumZone {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  crowdLevel: CrowdLevel;
  trend: Trend;
  riskScore: number; // 0 to 100
  attentionLevel: AttentionLevel;
  type: 'PLAZA' | 'CONCOURSE' | 'SEATING' | 'SERVICE' | 'MEDICAL' | 'TRANSPORT' | 'CORRIDOR';
  isAccessible: boolean;
}

export interface Gate {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  status: GateStatus;
  avgQueueSeconds: number;
  trend: Trend;
}

export interface Incident {
  id: string;
  zoneId: string;
  title: string;
  severity: IncidentSeverity;
  description: string;
  active: boolean;
  timestamp: string;
}

export interface TransportState {
  metroStatus: string;
  metroQueueSeconds: number;
  busStatus: string;
  busQueueSeconds: number;
  taxiQueueSeconds: number;
}

export interface MatchState {
  minute: number;
  half: 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'EXTRA_TIME' | 'PENALTIES' | 'FINISHED';
  addedTime: number;
  status: 'Pre Match' | 'First Half' | 'Half Time' | 'Second Half' | 'Extra Time' | 'Penalties' | 'Finished';
  scoreHome: number;
  scoreAway: number;
  teamHome: string;
  teamAway: string;
  importance: 'NORMAL' | 'HIGH' | 'CRITICAL';
  attendance: number;
}

export interface StadiumState {
  matchPhase: MatchPhase;
  tickCount: number;
  zones: StadiumZone[];
  gates: Gate[];
  incidents: Incident[];
  transport: TransportState;
  match: MatchState;
}

export interface CrowdInsight {
  zoneId: string;
  occupancyPct: number;
  crowdLevel: CrowdLevel;
  trend: Trend;
  riskScore: number;
  thresholdViolations: string[];
  reasons: string[];
  recommendedAttentionLevel: AttentionLevel;
}

export interface RouteNode {
  id: string;
  name: string;
  isAccessible: boolean;
  type: string;
}

export interface RouteEdge {
  fromNodeId: string;
  toNodeId: string;
  distance: number; // physical distance
  congestionWeight: number; // dynamically added penalty
  isClosed: boolean;
  isAccessible: boolean;
}

export interface RouteRequest {
  startNodeId: string;
  destinationNodeId: string;
  accessibilityRequired: boolean;
}

export interface RouteResult {
  path: string[]; // Node IDs
  nodeNames: string[]; // Friendly Node Names
  totalDistance: number;
  estimatedWalkingTimeMinutes: number;
  congestionSummary: string;
  accessibilityStatus: string;
  routeFacts: {
    hasHighCongestion: boolean;
    hasIncidentNearby: boolean;
    isAccessible: boolean;
  };
}

export interface OperationalDecision {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'CROWD' | 'MEDICAL' | 'ROUTING' | 'EXIT';
  affectedLocations: string[];
  rationaleFacts: string[];
  recommendedActions: string[];
  communicationRequired: {
    operationsBrief: string;
    fanAlert: string;
    volunteerInstruction: string;
  };
  timestamp: string;
  situationSummary?: string;
  riskScore?: number;
  confidenceScore?: number;
  estimatedResolutionTime?: string;
  requiredPersonnel?: string[];
  resourcesSuggested?: {
    medicalTeam?: string;
    securityUnit?: string;
    volunteerGroup?: string;
    equipment?: string;
    emergencyVehicle?: string;
  };
  explanation?: string;
  status?: 'PENDING' | 'APPROVED' | 'DISMISSED' | 'MODIFIED';
}

export interface CopilotRequest {
  role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER';
  userPrompt?: string;
  routeContext?: RouteResult;
  selectedZoneId?: string;
}

export interface CopilotResponse {
  text: string;
  aiPowered: boolean;
  fallbackUsed: boolean;
  suggestions?: string[];
}
