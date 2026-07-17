import React, { useState, useMemo, useCallback } from 'react';
import { StadiumState, RouteResult, StadiumZone, Incident } from '../types';

export const NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  METRO_STATION: { x: 90, y: 55 },
  BUS_STATION: { x: 510, y: 55 },
  PLAZA_NORTH: { x: 190, y: 110 },
  PLAZA_SOUTH: { x: 410, y: 110 },
  GATE_A: { x: 140, y: 185 },
  GATE_C: { x: 230, y: 185 },
  GATE_B: { x: 370, y: 185 },
  GATE_D: { x: 460, y: 185 },
  CONCOURSE_LOWER: { x: 300, y: 280 },
  CONCOURSE_UPPER: { x: 300, y: 280 },
  LIFT_NORTH: { x: 200, y: 280 },
  EMERGENCY_CORRIDOR: { x: 425, y: 250 },
  STAND_NORTH: { x: 300, y: 145 },
  STAND_SOUTH: { x: 300, y: 415 },
  STAND_EAST: { x: 420, y: 280 },
  STAND_WEST: { x: 180, y: 280 },
  FOOD_COURT_A: { x: 250, y: 320 },
  FOOD_COURT_B: { x: 350, y: 320 },
  MEDICAL_POST_1: { x: 250, y: 240 },
  MEDICAL_POST_2: { x: 350, y: 240 },
};

export const TOPOLOGY_EDGES = [
  { from: 'METRO_STATION', to: 'PLAZA_NORTH' },
  { from: 'BUS_STATION', to: 'PLAZA_SOUTH' },
  { from: 'PLAZA_NORTH', to: 'GATE_A' },
  { from: 'PLAZA_NORTH', to: 'GATE_C' },
  { from: 'PLAZA_SOUTH', to: 'GATE_B' },
  { from: 'PLAZA_SOUTH', to: 'GATE_D' },
  { from: 'PLAZA_SOUTH', to: 'EMERGENCY_CORRIDOR' },
  { from: 'GATE_A', to: 'CONCOURSE_LOWER' },
  { from: 'GATE_B', to: 'CONCOURSE_LOWER' },
  { from: 'GATE_C', to: 'CONCOURSE_LOWER' },
  { from: 'GATE_D', to: 'CONCOURSE_LOWER' },
  { from: 'CONCOURSE_LOWER', to: 'CONCOURSE_UPPER' },
  { from: 'CONCOURSE_LOWER', to: 'LIFT_NORTH' },
  { from: 'CONCOURSE_LOWER', to: 'STAND_NORTH' },
  { from: 'CONCOURSE_LOWER', to: 'STAND_SOUTH' },
  { from: 'CONCOURSE_LOWER', to: 'STAND_EAST' },
  { from: 'CONCOURSE_LOWER', to: 'FOOD_COURT_A' },
  { from: 'CONCOURSE_LOWER', to: 'MEDICAL_POST_1' },
  { from: 'CONCOURSE_LOWER', to: 'EMERGENCY_CORRIDOR' },
  { from: 'CONCOURSE_UPPER', to: 'LIFT_NORTH' },
  { from: 'CONCOURSE_UPPER', to: 'STAND_WEST' },
  { from: 'CONCOURSE_UPPER', to: 'FOOD_COURT_B' },
  { from: 'CONCOURSE_UPPER', to: 'MEDICAL_POST_2' },
];

function getCrowdDensityColor(riskScore: number): string {
  // Map riskScore (0 to 100) to HSL color: Green (120) down to Red (0)
  let hue = 120;
  if (riskScore <= 35) {
    hue = 120 - (riskScore / 35) * 40; // Green to Yellow-Green (120 -> 80)
  } else if (riskScore <= 65) {
    hue = 80 - ((riskScore - 35) / 30) * 45; // Yellow-Green to Orange (80 -> 35)
  } else {
    hue = 35 - ((riskScore - 65) / 35) * 35; // Orange to Red (35 -> 0)
  }
  return `hsl(${hue}, 85%, 45%)`;
}

function getIncidentType(title: string, desc: string): 'medical' | 'security' | 'fire' | 'lost_child' | 'suspicious_object' | 'general' {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('medical') || text.includes('cardiac') || text.includes('injury') || text.includes('first aid')) return 'medical';
  if (text.includes('fire') || text.includes('smoke') || text.includes('hazard')) return 'fire';
  if (text.includes('child') || text.includes('kid') || text.includes('lost') || text.includes('missing')) return 'lost_child';
  if (text.includes('suspicious') || text.includes('bag') || text.includes('drone') || text.includes('bomb') || text.includes('package')) return 'suspicious_object';
  if (text.includes('security') || text.includes('scanner') || text.includes('reader') || text.includes('crowd')) return 'security';
  return 'general';
}

function getIncidentEmoji(type: string): string {
  switch (type) {
    case 'medical': return '🩺';
    case 'security': return '🛡️';
    case 'fire': return '🔥';
    case 'lost_child': return '🧒';
    case 'suspicious_object': return '📦';
    default: return '⚠️';
  }
}

// ----------------------------------------------------
// Memoized Component for Connection Edges
// ----------------------------------------------------
interface MapEdgeProps {
  from: string;
  to: string;
  isBlocked: boolean;
  isPathActive: boolean;
  isPathEvac: boolean;
  matchPhase: string;
}

const MapEdge = React.memo(({ from, to, isBlocked, isPathActive, isPathEvac, matchPhase }: MapEdgeProps) => {
  const p1 = NODE_COORDINATES[from];
  const p2 = NODE_COORDINATES[to];
  if (!p1 || !p2) return null;

  // Determine Ingress vs Egress flow direction based on match phase
  const isEgress = matchPhase === 'MATCH_END' || matchPhase === 'EXIT_SURGE';
  const rank: Record<string, number> = {
    METRO_STATION: 1, BUS_STATION: 1,
    PLAZA_NORTH: 2, PLAZA_SOUTH: 2,
    GATE_A: 3, GATE_B: 3, GATE_C: 3, GATE_D: 3,
    EMERGENCY_CORRIDOR: 4, LIFT_NORTH: 4, CONCOURSE_LOWER: 4,
    CONCOURSE_UPPER: 5,
    STAND_NORTH: 6, STAND_SOUTH: 6, STAND_EAST: 6, STAND_WEST: 6,
    FOOD_COURT_A: 6, FOOD_COURT_B: 6, MEDICAL_POST_1: 6, MEDICAL_POST_2: 6
  };
  const r1 = rank[from] || 0;
  const r2 = rank[to] || 0;

  const flowFrom = isEgress ? (r1 >= r2 ? p1 : p2) : (r1 <= r2 ? p1 : p2);
  const flowTo = isEgress ? (r1 >= r2 ? p2 : p1) : (r1 <= r2 ? p2 : p1);

  if (isBlocked) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    return (
      <g>
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.65" />
        <circle cx={midX} cy={midY} r={6} fill="#ef4444" />
        <line x1={midX - 3} y1={midY - 3} x2={midX + 3} y2={midY + 3} stroke="#ffffff" strokeWidth="1.5" />
        <line x1={midX + 3} y1={midY - 3} x2={midX - 3} y2={midY + 3} stroke="#ffffff" strokeWidth="1.5" />
      </g>
    );
  }

  if (isPathActive) {
    const strokeColor = isPathEvac ? '#f97316' : '#60a5fa';
    const flowClass = isPathEvac ? 'animate-flow-evac' : 'animate-flow-fast';
    return (
      <g>
        <line x1={flowFrom.x} y1={flowFrom.y} x2={flowTo.x} y2={flowTo.y} stroke={strokeColor} strokeWidth="5.5" opacity="0.25" className="map-glow-filter" />
        <line x1={flowFrom.x} y1={flowFrom.y} x2={flowTo.x} y2={flowTo.y} stroke={strokeColor} strokeWidth="3" className={flowClass} />
      </g>
    );
  }

  // Default flow connections (subtle animated background sync lines)
  return (
    <line
      x1={flowFrom.x}
      y1={flowFrom.y}
      x2={flowTo.x}
      y2={flowTo.y}
      stroke="#334155"
      strokeWidth="1.5"
      className="animate-flow-normal"
      opacity="0.4"
    />
  );
});

// ----------------------------------------------------
// Memoized Component for Stadium Sectors (Zones)
// ----------------------------------------------------
interface MapZoneProps {
  id: string;
  name: string;
  type: string;
  riskScore: number;
  occupancy: number;
  capacity: number;
  trend: string;
  isSelected: boolean;
  onClick: (id: string) => void;
  onMouseEnter: (id: string, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

const MapZone = React.memo(({ id, name, type, riskScore, occupancy, capacity, trend, isSelected, onClick, onMouseEnter, onMouseLeave }: MapZoneProps) => {
  const coords = NODE_COORDINATES[id];
  if (!coords) return null;

  const color = getCrowdDensityColor(riskScore);
  const percent = Math.round((occupancy / capacity) * 100);

  const handleClick = () => onClick(id);
  const handleMouseEnter = (e: React.MouseEvent) => onMouseEnter(id, e);

  // Render Seating Stand shapes as large curved polygons wrapping around center
  if (type === 'SEATING') {
    let points = '';
    let textOffset = { x: 0, y: 0 };
    if (id === 'STAND_NORTH') {
      points = '210,120 390,120 365,160 235,160';
      textOffset = { x: 0, y: -8 };
    } else if (id === 'STAND_SOUTH') {
      points = '235,380 365,380 390,420 210,420';
      textOffset = { x: 0, y: 10 };
    } else if (id === 'STAND_EAST') {
      points = '375,190 415,160 415,350 375,320';
      textOffset = { x: 12, y: 0 };
    } else if (id === 'STAND_WEST') {
      points = '185,160 225,190 225,320 185,350';
      textOffset = { x: -12, y: 0 };
    }

    return (
      <g className="group cursor-pointer" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
        <polygon
          points={points}
          fill={color}
          fillOpacity={isSelected ? 0.75 : 0.45}
          stroke={isSelected ? '#3b82f6' : '#475569'}
          strokeWidth={isSelected ? 2.5 : 1}
          className="transition-all duration-200 hover:fill-opacity-80"
          style={{ filter: isSelected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none' }}
        />
        <text
          x={coords.x + textOffset.x}
          y={coords.y + textOffset.y}
          textAnchor="middle"
          className="fill-slate-300 font-sans font-bold select-none text-[8.5px] pointer-events-none group-hover:fill-white"
        >
          {name.split(' ')[0]} ({percent}%)
        </text>
      </g>
    );
  }

  // Render Concourse Rings
  if (id === 'CONCOURSE_LOWER' || id === 'CONCOURSE_UPPER') {
    const isLower = id === 'CONCOURSE_LOWER';
    const rx = isLower ? 95 : 75;
    const ry = isLower ? 75 : 55;

    return (
      <g className="group cursor-pointer" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
        <ellipse
          cx={coords.x}
          cy={coords.y}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={color}
          strokeWidth={isSelected ? 6 : 4}
          strokeOpacity={isSelected ? 0.95 : 0.65}
          className="transition-all duration-200 hover:stroke-opacity-95"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
        <text
          x={coords.x}
          y={coords.y + (isLower ? ry + 12 : -ry - 6)}
          textAnchor="middle"
          className="fill-slate-400 font-sans font-medium select-none text-[8px] pointer-events-none group-hover:fill-white"
        >
          {isLower ? 'Lower Ring' : 'Upper Ring'}
        </text>
      </g>
    );
  }

  // Default shape: simple circles or rectangles for nodes
  const radius = type === 'TRANSPORT' ? 14 : 10;

  return (
    <g className="group cursor-pointer" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
      <circle
        cx={coords.x}
        cy={coords.y}
        r={radius}
        fill={color}
        fillOpacity={isSelected ? 0.85 : 0.55}
        stroke={isSelected ? '#3b82f6' : '#475569'}
        strokeWidth={isSelected ? 2.5 : 1.2}
        className="transition-all duration-200 hover:fill-opacity-80"
        style={{ filter: isSelected ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.6))' : 'none' }}
      />
      <text
        x={coords.x}
        y={coords.y - radius - 3}
        textAnchor="middle"
        className="fill-slate-300 font-sans font-extrabold select-none text-[8px] pointer-events-none group-hover:fill-white"
      >
        {name.split(' ')[0]}
      </text>
    </g>
  );
});

// ----------------------------------------------------
// Main Map Component
// ----------------------------------------------------
interface StadiumMapProps {
  stadiumState: StadiumState | null;
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  activeRoute?: RouteResult | null;
  isEvacuationMode?: boolean;
}

export function StadiumMap({
  stadiumState,
  selectedZoneId,
  onSelectZone = () => {},
  activeRoute = null,
  isEvacuationMode = false
}: StadiumMapProps) {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseEnter = useCallback((id: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (rect && container) {
      setTooltipPos({
        x: rect.left - container.left + rect.width / 2,
        y: rect.top - container.top - 10
      });
    }
    setHoveredZoneId(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredZoneId(null);
  }, []);

  // Compute lookup objects for efficiency
  const zonesMap = useMemo(() => {
    if (!stadiumState) return new Map<string, StadiumZone>();
    return new Map(stadiumState.zones.map(z => [z.id, z]));
  }, [stadiumState]);

  const gatesMap = useMemo(() => {
    if (!stadiumState) return new Map<string, typeof stadiumState.gates[0]>();
    return new Map(stadiumState.gates.map(g => [g.id, g]));
  }, [stadiumState]);

  const activeIncidents = useMemo(() => {
    if (!stadiumState) return [];
    return stadiumState.incidents.filter(i => i.active);
  }, [stadiumState]);

  const activeRouteEdges = useMemo(() => {
    if (!activeRoute) return new Set<string>();
    const edges = new Set<string>();
    for (let i = 0; i < activeRoute.path.length - 1; i++) {
      const from = activeRoute.path[i];
      const to = activeRoute.path[i + 1];
      edges.add(`${from}->${to}`);
      edges.add(`${to}->${from}`);
    }
    return edges;
  }, [activeRoute]);

  const blockedZones = useMemo(() => {
    const blocked = new Set<string>();
    activeIncidents.forEach(inc => {
      if (inc.severity === 'CRITICAL' || inc.title.toLowerCase().includes('close') || inc.title.toLowerCase().includes('block')) {
        blocked.add(inc.zoneId);
      }
    });
    return blocked;
  }, [activeIncidents]);

  const hoveredZoneInfo = useMemo(() => {
    if (!hoveredZoneId || !stadiumState) return null;

    const zone = zonesMap.get(hoveredZoneId);
    const gate = gatesMap.get(hoveredZoneId);
    const zoneIncidents = activeIncidents.filter(i => i.zoneId === hoveredZoneId);
    
    // Mock volunteer assignment based on zone capacity
    const volunteers = Math.max(2, Math.round((zone?.capacity || gate?.capacity || 1000) / 750));

    if (zone) {
      const isTransport = zone.type === 'TRANSPORT';
      let queueText = 'N/A';
      if (isTransport) {
        queueText = zone.id === 'METRO_STATION'
          ? `${Math.round(stadiumState.transport.metroQueueSeconds / 60)}m`
          : `${Math.round(stadiumState.transport.busQueueSeconds / 60)}m`;
      }

      return {
        name: zone.name,
        type: zone.type,
        occupancy: zone.occupancy,
        capacity: zone.capacity,
        percent: Math.round((zone.occupancy / zone.capacity) * 100),
        riskScore: zone.riskScore,
        attention: zone.attentionLevel,
        queue: queueText,
        incidents: zoneIncidents,
        volunteers
      };
    }

    if (gate) {
      return {
        name: gate.name,
        type: 'GATE',
        occupancy: gate.occupancy,
        capacity: gate.capacity,
        percent: Math.round((gate.occupancy / gate.capacity) * 100),
        riskScore: Math.round((gate.occupancy / gate.capacity) * 100),
        attention: gate.status === 'RESTRICTED' ? 'CRITICAL' : gate.status === 'BUSY' ? 'HIGH' : 'NORMAL',
        queue: `${Math.round(gate.avgQueueSeconds / 60)}m`,
        incidents: zoneIncidents,
        volunteers
      };
    }

    return null;
  }, [hoveredZoneId, stadiumState, zonesMap, gatesMap, activeIncidents]);

  if (!stadiumState) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 font-bold">
        Loading operations telemetry map...
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-2xl flex flex-col items-center">
      {/* Map Interactive HUD Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Command Center Map Overlay</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{stadiumState.matchPhase.replace(/_/g, ' ')} Telemetry</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-400 flex items-center gap-2 backdrop-blur-sm select-none">
          <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" /> Low
          <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500" /> Mod
          <span className="inline-block w-2.5 h-2.5 rounded bg-orange-500" /> High
          <span className="inline-block w-2.5 h-2.5 rounded bg-red-500" /> Crit
        </div>
      </div>

      {/* SVG Container */}
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto max-w-xl mt-4 select-none"
        role="img"
        aria-label="FIFA World Cup 2026 Operations Map"
      >
        <defs>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pitch markings in center (Coordinates 300, 280 center) */}
        <g opacity="0.2">
          {/* Outer Boundary */}
          <rect x="230" y="225" width="140" height="110" rx="3" fill="#1b4332" stroke="#10b981" strokeWidth="2" />
          {/* Half Line */}
          <line x1="300" y1="225" x2="300" y2="335" stroke="#10b981" strokeWidth="2" />
          {/* Center Circle */}
          <circle cx="300" cy="280" r="22" fill="none" stroke="#10b981" strokeWidth="2" />
          {/* Penalty boxes */}
          <rect x="230" y="250" width="20" height="60" fill="none" stroke="#10b981" strokeWidth="1.5" />
          <rect x="350" y="250" width="20" height="60" fill="none" stroke="#10b981" strokeWidth="1.5" />
        </g>

        {/* Render Connection Edges */}
        <g>
          {TOPOLOGY_EDGES.map((edge) => {
            const edgeId = `${edge.from}->${edge.to}`;
            const isBlocked = blockedZones.has(edge.from) || blockedZones.has(edge.to);
            const isPathActive = activeRouteEdges.has(edgeId);
            return (
              <MapEdge
                key={edgeId}
                from={edge.from}
                to={edge.to}
                isBlocked={isBlocked}
                isPathActive={isPathActive}
                isPathEvac={isEvacuationMode}
                matchPhase={stadiumState.matchPhase}
              />
            );
          })}
        </g>

        {/* Render Stadium Zones (Sectors) */}
        <g>
          {stadiumState.zones.map((zone) => (
            <MapZone
              key={zone.id}
              id={zone.id}
              name={zone.name}
              type={zone.type}
              riskScore={zone.riskScore}
              occupancy={zone.occupancy}
              capacity={zone.capacity}
              trend={zone.trend}
              isSelected={selectedZoneId === zone.id}
              onClick={onSelectZone}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </g>

        {/* Render Gates (Dynamic overlays with queue indicator) */}
        <g>
          {stadiumState.gates.map((gate) => {
            const coords = NODE_COORDINATES[gate.id];
            if (!coords) return null;

            const isSelected = selectedZoneId === gate.id;
            const flowPercent = Math.round((gate.occupancy / gate.capacity) * 100);
            const color = getCrowdDensityColor(flowPercent);

            return (
              <g
                key={gate.id}
                className="group cursor-pointer"
                onClick={() => onSelectZone(gate.id)}
                onMouseEnter={(e) => handleMouseEnter(gate.id, e)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Gate Icon Rectangle portal */}
                <rect
                  x={coords.x - 10}
                  y={coords.y - 6}
                  width="20"
                  height="12"
                  rx="3"
                  fill={color}
                  fillOpacity={isSelected ? 0.9 : 0.6}
                  stroke={isSelected ? '#3b82f6' : '#64748b'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-200"
                />
                {/* Status Dot */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="3.5"
                  fill={gate.status === 'RESTRICTED' ? '#a855f7' : gate.status === 'CLOSED' ? '#ef4444' : gate.status === 'BUSY' ? '#f59e0b' : '#10b981'}
                  className={gate.status === 'RESTRICTED' || gate.status === 'CLOSED' ? 'animate-pulse' : ''}
                />
                <text
                  x={coords.x}
                  y={coords.y - 9}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono font-bold select-none text-[7.5px] pointer-events-none group-hover:fill-white"
                >
                  {gate.name.split(' ')[1]}
                </text>
              </g>
            );
          })}
        </g>

        {/* Render Active Incident Markers (Pulsing glowing warning badges) */}
        <g>
          {activeIncidents.map((inc) => {
            const coords = NODE_COORDINATES[inc.zoneId];
            if (!coords) return null;

            // Offset the incident badge from the zone node coordinates
            const ox = coords.x + (inc.zoneId.includes('STAND') ? 0 : 15);
            const oy = coords.y - (inc.zoneId.includes('STAND') ? 15 : 15);

            const incType = getIncidentType(inc.title, inc.description);
            const emoji = getIncidentEmoji(incType);

            return (
              <g key={inc.id} className="pointer-events-none select-none">
                {/* Pulsing glow ring */}
                <circle
                  cx={ox}
                  cy={oy}
                  r="13"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  className="animate-map-pulse"
                  opacity="0.8"
                />
                {/* Outer solid badge */}
                <circle cx={ox} cy={oy} r="9.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                {/* Incident Emoji text */}
                <text
                  x={ox}
                  y={oy + 3.2}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#ffffff"
                  fontFamily="Segoe UI Symbol, Apple Color Emoji, sans-serif"
                >
                  {emoji}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Telemetry Tooltip */}
      {hoveredZoneId && hoveredZoneInfo && (
        <div
          className="absolute z-20 w-48 rounded-xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-150 pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 120}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Tooltip Header */}
          <div className="border-b border-white/5 pb-1.5 mb-1.5 flex items-center justify-between">
            <span className="text-xs font-black text-white truncate max-w-[110px]">{hoveredZoneInfo.name}</span>
            <span className={`text-[8px] font-bold uppercase rounded px-1 py-0.2 ${
              hoveredZoneInfo.attention === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
              hoveredZoneInfo.attention === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
              hoveredZoneInfo.attention === 'WATCH' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {hoveredZoneInfo.attention}
            </span>
          </div>

          {/* Telemetry Stats */}
          <div className="space-y-1 text-[10px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Occupancy:</span>
              <span className="font-mono text-white font-bold">{hoveredZoneInfo.percent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5 mb-1.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${hoveredZoneInfo.percent}%`,
                  backgroundColor: getCrowdDensityColor(hoveredZoneInfo.riskScore),
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Headcount:</span>
              <span className="font-mono font-medium">{hoveredZoneInfo.occupancy.toLocaleString()} / {hoveredZoneInfo.capacity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Queue Delay:</span>
              <span className="font-mono font-medium text-blue-300">{hoveredZoneInfo.queue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Volunteers:</span>
              <span className="font-mono font-medium text-emerald-400">{hoveredZoneInfo.volunteers} Active</span>
            </div>
          </div>

          {/* Active Incidents indicator in tooltip */}
          {hoveredZoneInfo.incidents.length > 0 && (
            <div className="mt-2 border-t border-red-500/10 pt-1.5">
              <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <span>🚨</span> {hoveredZoneInfo.incidents.length} Incident{hoveredZoneInfo.incidents.length > 1 ? 's' : ''} Active
              </div>
              <p className="text-[8px] text-slate-400 leading-snug truncate mt-0.5">
                {hoveredZoneInfo.incidents[0].title}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
