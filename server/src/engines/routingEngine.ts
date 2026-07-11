import { RouteNode, RouteRequest, RouteResult, StadiumState } from '../types.js';

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
    { toNodeId: 'CONCOURSE_UPPER', distance: 10, isAccessible: false }, // stairs only
    { toNodeId: 'LIFT_NORTH', distance: 20, isAccessible: true },
    { toNodeId: 'STAND_NORTH', distance: 80, isAccessible: false },
    { toNodeId: 'STAND_SOUTH', distance: 80, isAccessible: false },
    { toNodeId: 'STAND_EAST', distance: 80, isAccessible: true },
    { toNodeId: 'FOOD_COURT_A', distance: 30, isAccessible: true },
    { toNodeId: 'MEDICAL_POST_1', distance: 40, isAccessible: true },
    { toNodeId: 'EMERGENCY_CORRIDOR', distance: 200, isAccessible: true }
  ],

  CONCOURSE_UPPER: [
    { toNodeId: 'CONCOURSE_LOWER', distance: 10, isAccessible: false }, // stairs only
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

  const nodeMap = new Map<string, RouteNode>();
  stadiumState.zones.forEach(zone => {
    nodeMap.set(zone.id, {
      id: zone.id,
      name: zone.name,
      isAccessible: zone.isAccessible,
      type: zone.type,
    });
  });

  stadiumState.gates.forEach(gate => {
    nodeMap.set(gate.id, {
      id: gate.id,
      name: gate.name,
      isAccessible: true,
      type: 'GATE',
    });
  });

  const validGraphNodes = new Set<string>(Object.keys(TOPOLOGY));
  if (!validGraphNodes.has(startNodeId) || !validGraphNodes.has(destinationNodeId)) {
    throw new Error('Start or destination node does not exist in stadium state.');
  }

  const activeIncidents = stadiumState.incidents.filter(inc => inc.active);
  const closedZones = new Set<string>();

  activeIncidents.forEach(incident => {
    if (
      incident.severity === 'CRITICAL' ||
      incident.title.toLowerCase().includes('closed') ||
      incident.title.toLowerCase().includes('blocked')
    ) {
      closedZones.add(incident.zoneId);
    }
  });

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  Object.keys(TOPOLOGY).forEach(nodeId => {
    dist[nodeId] = Infinity;
    prev[nodeId] = null;
    unvisited.add(nodeId);
  });

  dist[startNodeId] = 0;

  while (unvisited.size > 0) {
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
      if (!unvisited.has(v)) {
        continue;
      }

      if (closedZones.has(v) || closedZones.has(u)) {
        continue;
      }

      if (accessibilityRequired && (!edge.isAccessible || !nodeMap.get(v)?.isAccessible || !nodeMap.get(u)?.isAccessible)) {
        continue;
      }

      let weight = edge.distance;

      const targetZone = nodeMap.get(v);
      if (targetZone) {
        if (targetZone.type !== 'GATE' && targetZone.type !== 'CORRIDOR') {
          if (targetZone.id === 'STAND_NORTH' || targetZone.id === 'STAND_SOUTH' || targetZone.id === 'STAND_EAST' || targetZone.id === 'STAND_WEST') {
            weight += 20;
          }
        }
      }

      const targetGate = stadiumState.gates.find(g => g.id === v);
      if (targetGate) {
        if (targetGate.status === 'CLOSED') {
          continue;
        }
        if (targetGate.status === 'RESTRICTED') {
          weight += 400;
        } else if (targetGate.status === 'BUSY') {
          weight += 150;
        }
      }

      const nextDistance = dist[u] + weight;
      if (nextDistance < dist[v]) {
        dist[v] = nextDistance;
        prev[v] = u;
      }
    }
  }

  if (dist[destinationNodeId] === Infinity || (prev[destinationNodeId] === null && startNodeId !== destinationNodeId)) {
    throw new Error(
      `No valid route exists between ${nodeMap.get(startNodeId)?.name || startNodeId} and ${nodeMap.get(destinationNodeId)?.name || destinationNodeId} under current conditions.`,
    );
  }

  const path: string[] = [];
  let curr: string | null = destinationNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  let totalDistance = 0;
  let hasHighCongestion = false;
  let hasIncidentNearby = false;
  const traversedEdges: Array<{ from: string; to: string; isAccessible: boolean }> = [];

  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    const edge = TOPOLOGY[from]?.find(item => item.toNodeId === to);
    if (edge) {
      totalDistance += edge.distance;
      traversedEdges.push({ from, to, isAccessible: edge.isAccessible });
    }

    const targetZone = nodeMap.get(to);
    if (targetZone) {
      if (targetZone.type !== 'GATE' && (targetZone.id === 'STAND_EAST' || targetZone.id === 'STAND_WEST' || targetZone.id === 'STAND_NORTH' || targetZone.id === 'STAND_SOUTH')) {
        hasHighCongestion = true;
      }

      const zoneIncidents = activeIncidents.filter(incident => incident.zoneId === to);
      if (zoneIncidents.length > 0) {
        hasIncidentNearby = true;
      }
    }

    const gate = stadiumState.gates.find(item => item.id === to);
    if (gate && (gate.status === 'BUSY' || gate.status === 'RESTRICTED')) {
      hasHighCongestion = true;
    }
  }

  const nodeNames = path.map(id => nodeMap.get(id)?.name || id);

  let estimatedTime = Math.round(totalDistance / 80);
  if (hasHighCongestion) {
    estimatedTime += 3;
  }
  estimatedTime = Math.max(1, estimatedTime);

  let congestionSummary = 'Route has low congestion.';
  if (hasHighCongestion) {
    congestionSummary = 'Route passes through high density areas. Expect delays.';
  } else if (path.some(id => nodeMap.get(id)?.type === 'SEATING')) {
    congestionSummary = 'Route has moderate crowd density.';
  }

  const isAccessible = traversedEdges.every(edge => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    return edge.isAccessible && (fromNode?.isAccessible ?? true) && (toNode?.isAccessible ?? true);
  });

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
      isAccessible,
    },
  };
}
