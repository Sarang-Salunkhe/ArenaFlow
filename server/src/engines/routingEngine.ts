import { RouteRequest, RouteResult, StadiumState, StadiumZone } from '../types.js';

interface AdjacencyEdge {
  toNodeId: string;
  distance: number;
  isAccessible: boolean;
}

// Fixed topology adjacency list mapping node IDs to neighbors
const TOPOLOGY: Record<string, AdjacencyEdge[]> = {
  METRO_STATION: [{ toNodeId: 'PLAZA_NORTH', distance: 300, isAccessible: true }],
  BUS_STATION: [{ toNodeId: 'PLAZA_SOUTH', distance: 250, isAccessible: true }],
  
  PLAZA_NORTH: [
    { toNodeId: 'METRO_STATION', distance: 300, isAccessible: true },
    { toNodeId: 'GATE_A', distance: 100, isAccessible: true },
    { toNodeId: 'GATE_C', distance: 150, isAccessible: true }
  ],
  PLAZA_SOUTH: [
    { toNodeId: 'BUS_STATION', distance: 250, isAccessible: true },
    { toNodeId: 'GATE_B', distance: 100, isAccessible: true },
    { toNodeId: 'GATE_D', distance: 150, isAccessible: true },
    { toNodeId: 'EMERGENCY_CORRIDOR', distance: 150, isAccessible: true }
  ],

  GATE_A: [
    { toNodeId: 'PLAZA_NORTH', distance: 100, isAccessible: true },
    { toNodeId: 'CONCOURSE_LOWER', distance: 50, isAccessible: true }
  ],
  GATE_B: [
    { toNodeId: 'PLAZA_SOUTH', distance: 100, isAccessible: true },
    { toNodeId: 'CONCOURSE_LOWER', distance: 50, isAccessible: true }
  ],
  GATE_C: [
    { toNodeId: 'PLAZA_NORTH', distance: 150, isAccessible: true },
    { toNodeId: 'CONCOURSE_LOWER', distance: 60, isAccessible: true }
  ],
  GATE_D: [
    { toNodeId: 'PLAZA_SOUTH', distance: 150, isAccessible: true },
    { toNodeId: 'CONCOURSE_LOWER', distance: 60, isAccessible: true }
  ],

  CONCOURSE_LOWER: [
    { toNodeId: 'GATE_A', distance: 50, isAccessible: true },
    { toNodeId: 'GATE_B', distance: 50, isAccessible: true },
    { toNodeId: 'GATE_C', distance: 60, isAccessible: true },
    { toNodeId: 'GATE_D', distance: 60, isAccessible: true },
    { toNodeId: 'CONCOURSE_UPPER', distance: 40, isAccessible: false }, // stairs only
    { toNodeId: 'LIFT_NORTH', distance: 20, isAccessible: true },
    { toNodeId: 'STAND_NORTH', distance: 80, isAccessible: false },
    { toNodeId: 'STAND_SOUTH', distance: 80, isAccessible: false },
    { toNodeId: 'STAND_EAST', distance: 80, isAccessible: true },
    { toNodeId: 'FOOD_COURT_A', distance: 30, isAccessible: true },
    { toNodeId: 'MEDICAL_POST_1', distance: 40, isAccessible: true },
    { toNodeId: 'EMERGENCY_CORRIDOR', distance: 200, isAccessible: true }
  ],

  CONCOURSE_UPPER: [
    { toNodeId: 'CONCOURSE_LOWER', distance: 40, isAccessible: false }, // stairs only
    { toNodeId: 'LIFT_NORTH', distance: 10, isAccessible: true },
    { toNodeId: 'STAND_WEST', distance: 80, isAccessible: true },
    { toNodeId: 'FOOD_COURT_B', distance: 30, isAccessible: true },
    { toNodeId: 'MEDICAL_POST_2', distance: 40, isAccessible: true }
  ],

  LIFT_NORTH: [
    { toNodeId: 'CONCOURSE_LOWER', distance: 20, isAccessible: true },
    { toNodeId: 'CONCOURSE_UPPER', distance: 10, isAccessible: true }
  ],

  STAND_NORTH: [{ toNodeId: 'CONCOURSE_LOWER', distance: 80, isAccessible: false }],
  STAND_SOUTH: [{ toNodeId: 'CONCOURSE_LOWER', distance: 80, isAccessible: false }],
  STAND_EAST: [{ toNodeId: 'CONCOURSE_LOWER', distance: 80, isAccessible: true }],
  STAND_WEST: [{ toNodeId: 'CONCOURSE_UPPER', distance: 80, isAccessible: true }],

  FOOD_COURT_A: [{ toNodeId: 'CONCOURSE_LOWER', distance: 30, isAccessible: true }],
  FOOD_COURT_B: [{ toNodeId: 'CONCOURSE_UPPER', distance: 30, isAccessible: true }],

  MEDICAL_POST_1: [{ toNodeId: 'CONCOURSE_LOWER', distance: 40, isAccessible: true }],
  MEDICAL_POST_2: [{ toNodeId: 'CONCOURSE_UPPER', distance: 40, isAccessible: true }],

  EMERGENCY_CORRIDOR: [
    { toNodeId: 'CONCOURSE_LOWER', distance: 200, isAccessible: true },
    { toNodeId: 'PLAZA_SOUTH', distance: 150, isAccessible: true }
  ],
};

export function calculateRoute(
  request: RouteRequest,
  stadiumState: StadiumState
): RouteResult {
  const { startNodeId, destinationNodeId, accessibilityRequired } = request;

  // Verify nodes exist in state
  const zonesMap = new Map<string, StadiumZone>();
  stadiumState.zones.forEach(z => zonesMap.set(z.id, z));

  if (!zonesMap.has(startNodeId) || !zonesMap.has(destinationNodeId)) {
    throw new Error('Start or destination node does not exist in stadium state.');
  }

  // Active incidents list
  const activeIncidents = stadiumState.incidents.filter(inc => inc.active);
  const closedZones = new Set<string>();

  // Mark zones as closed if they have severe incidents blocking them
  activeIncidents.forEach(inc => {
    if (inc.severity === 'CRITICAL' || inc.title.toLowerCase().includes('closed') || inc.title.toLowerCase().includes('blocked')) {
      closedZones.add(inc.zoneId);
    }
  });

  // Dijkstra Algorithm variables
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  // Initialize
  Object.keys(TOPOLOGY).forEach(nodeId => {
    dist[nodeId] = Infinity;
    prev[nodeId] = null;
    unvisited.add(nodeId);
  });

  dist[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let u: string | null = null;
    let minDist = Infinity;
    unvisited.forEach(nodeId => {
      if (dist[nodeId] < minDist) {
        minDist = dist[nodeId];
        u = nodeId;
      }
    });

    if (u === null || minDist === Infinity) {
      break;
    }

    if (u === destinationNodeId) {
      break;
    }

    unvisited.delete(u);

    const neighbors = TOPOLOGY[u] || [];
    for (const edge of neighbors) {
      const v = edge.toNodeId;
      if (!unvisited.has(v)) continue;

      // Rule: closed edges/zones cannot be used
      if (closedZones.has(v) || closedZones.has(u)) {
        continue;
      }

      // Rule: accessibility constraint
      if (accessibilityRequired && (!edge.isAccessible || !zonesMap.get(v)?.isAccessible || !zonesMap.get(u)?.isAccessible)) {
        continue;
      }

      // Dynamic weight computation
      let weight = edge.distance;

      // Congestion penalty
      const targetZone = zonesMap.get(v);
      if (targetZone) {
        if (targetZone.crowdLevel === 'CRITICAL') {
          weight += 500; // heavy penalty
        } else if (targetZone.crowdLevel === 'HIGH') {
          weight += 200;
        } else if (targetZone.crowdLevel === 'MODERATE') {
          weight += 50;
        }
      }

      // Check if neighbor zone is a gate that is busy/restricted
      const targetGate = stadiumState.gates.find(g => g.id === v);
      if (targetGate) {
        if (targetGate.status === 'CLOSED') {
          continue; // cannot traverse closed gate
        } else if (targetGate.status === 'RESTRICTED') {
          weight += 400;
        } else if (targetGate.status === 'BUSY') {
          weight += 150;
        }
      }

      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  // Reconstruct path
  if (dist[destinationNodeId] === Infinity || prev[destinationNodeId] === null && startNodeId !== destinationNodeId) {
    throw new Error(`No valid route exists between ${zonesMap.get(startNodeId)?.name || startNodeId} and ${zonesMap.get(destinationNodeId)?.name || destinationNodeId} under current conditions.`);
  }

  const path: string[] = [];
  let curr: string | null = destinationNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  // Calculate actual physical distance and facts
  let totalDistance = 0;
  let hasHighCongestion = false;
  let hasIncidentNearby = false;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Find edge in topology
    const edge = TOPOLOGY[from]?.find(e => e.toNodeId === to);
    if (edge) {
      totalDistance += edge.distance;
    }

    const zone = zonesMap.get(to);
    if (zone) {
      if (zone.crowdLevel === 'CRITICAL' || zone.crowdLevel === 'HIGH') {
        hasHighCongestion = true;
      }
      // Check for active incidents
      const incs = activeIncidents.filter(inc => inc.zoneId === to);
      if (incs.length > 0) {
        hasIncidentNearby = true;
      }
    }
  }

  const nodeNames = path.map(id => zonesMap.get(id)?.name || id);
  
  // Avg walking speed is 80m/minute. Congestion adds delay.
  let estimatedTime = Math.round(totalDistance / 80);
  if (hasHighCongestion) {
    estimatedTime += 3; // add 3 mins delay
  }
  estimatedTime = Math.max(1, estimatedTime);

  let congestionSummary = 'Route has low congestion.';
  if (hasHighCongestion) {
    congestionSummary = 'Route passes through high density areas. Expect delays.';
  } else if (path.some(id => zonesMap.get(id)?.crowdLevel === 'MODERATE')) {
    congestionSummary = 'Route has moderate crowd density.';
  }

  return {
    path,
    nodeNames,
    totalDistance,
    estimatedWalkingTimeMinutes: estimatedTime,
    congestionSummary,
    accessibilityStatus: accessibilityRequired ? 'Fully accessible route' : 'Standard route (stairs may be included)',
    routeFacts: {
      hasHighCongestion,
      hasIncidentNearby,
      isAccessible: path.every(id => zonesMap.get(id)?.isAccessible ?? true),
    },
  };
}
