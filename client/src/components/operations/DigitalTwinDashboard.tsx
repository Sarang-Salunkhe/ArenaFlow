import { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  Cpu,
  Heart,
  MapPin,
  Radio,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  Zap
} from 'lucide-react';
import { StadiumState } from '../../types';

interface DigitalTwinDashboardProps {
  state: StadiumState;
}

interface WhatIfModifiers {
  auxGateOpened: boolean;
  volunteersDeployed: boolean;
  sectorBClosed: boolean;
}

export function DigitalTwinDashboard({ state }: DigitalTwinDashboardProps) {
  // 1. What-If Modifiers State
  const [modifiers, setModifiers] = useState<WhatIfModifiers>({
    auxGateOpened: false,
    volunteersDeployed: false,
    sectorBClosed: false,
  });

  // 2. Map Toggle: view Current Risk vs Predicted Risk
  const [mapOverlayMode, setMapOverlayMode] = useState<'CURRENT' | 'PREDICTED'>('PREDICTED');

  // 3. Hover state for sector insights
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // 4. Reset modifiers helper
  const handleResetModifiers = () => {
    setModifiers({
      auxGateOpened: false,
      volunteersDeployed: false,
      sectorBClosed: false,
    });
  };

  // 5. Compute dynamic sector risk and prediction states based on real stadium telemetry & what-if modifiers
  const dynamicSectors = useMemo(() => {
    return state.zones.map(zone => {
      let currentRisk = zone.riskScore;
      let predictedRisk = currentRisk;
      
      // Phase-based prediction additions
      if (state.matchPhase === 'ENTRY_SURGE') {
        predictedRisk += 15;
      } else if (state.matchPhase === 'EXIT_SURGE') {
        predictedRisk += 20;
      } else if (state.matchPhase === 'HALF_TIME') {
        if (zone.id.startsWith('FOOD_COURT') || zone.id === 'CONCOURSE_LOWER') {
          predictedRisk += 25;
        }
      }

      // Modifier adjustments
      if (modifiers.sectorBClosed) {
        // Let's assume Plaza North is closed
        if (zone.id === 'PLAZA_NORTH') {
          predictedRisk = 0; // Closed
        } else if (zone.id === 'PLAZA_SOUTH' || zone.id === 'METRO_STATION') {
          predictedRisk += 30; // Crowds redistributed
        } else if (zone.id === 'CONCOURSE_LOWER') {
          predictedRisk += 15;
        }
      }

      if (modifiers.volunteersDeployed) {
        if (zone.id.startsWith('PLAZA') || zone.id.startsWith('CONCOURSE')) {
          predictedRisk = Math.max(0, predictedRisk - 18);
        }
      }

      if (modifiers.auxGateOpened) {
        if (zone.id === 'METRO_STATION' || zone.id === 'PLAZA_NORTH') {
          predictedRisk = Math.max(0, predictedRisk - 12);
        }
      }

      // Cap at 100 or 0
      predictedRisk = Math.min(100, Math.max(0, predictedRisk));
      if (zone.id === 'PLAZA_NORTH' && modifiers.sectorBClosed) {
        predictedRisk = 0; // Explicit closed indicator
      }

      // Determine Trend
      let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
      const difference = predictedRisk - currentRisk;
      if (zone.id === 'PLAZA_NORTH' && modifiers.sectorBClosed) {
        trend = 'DECREASING';
      } else if (difference > 4) {
        trend = 'INCREASING';
      } else if (difference < -4) {
        trend = 'DECREASING';
      }

      return {
        ...zone,
        currentRisk,
        predictedRisk,
        trend,
      };
    });
  }, [state, modifiers]);

  // 6. Predict the 10 core Operational Metrics
  const predictions = useMemo(() => {
    const currentAvgRisk = state.zones.reduce((sum, z) => sum + z.riskScore, 0) / state.zones.length;
    const activeIncidents = state.incidents.filter(i => i.active).length;

    // A. Crowd Congestion Risk
    let baseCrowdRisk = state.matchPhase === 'ENTRY_SURGE' ? 75 : state.matchPhase === 'EXIT_SURGE' ? 82 : 45;
    if (modifiers.sectorBClosed) baseCrowdRisk += 18;
    if (modifiers.volunteersDeployed) baseCrowdRisk -= 15;
    baseCrowdRisk = Math.min(100, Math.max(10, baseCrowdRisk + activeIncidents * 6));

    // B. Gate Overload Probability
    let baseGateRisk = state.gates.some(g => g.avgQueueSeconds > 180) ? 70 : 40;
    if (state.matchPhase === 'ENTRY_SURGE') baseGateRisk += 25;
    if (modifiers.auxGateOpened) baseGateRisk -= 35;
    if (modifiers.volunteersDeployed) baseGateRisk -= 10;
    baseGateRisk = Math.min(100, Math.max(5, baseGateRisk));

    // C. Queue Growth Prediction
    let baseQueueGrowth = state.matchPhase === 'ENTRY_SURGE' ? 80 : state.matchPhase === 'HALF_TIME' ? 60 : 30;
    if (modifiers.auxGateOpened) baseQueueGrowth -= 40;
    if (modifiers.volunteersDeployed) baseQueueGrowth -= 15;
    baseQueueGrowth = Math.min(100, Math.max(5, baseQueueGrowth));

    // D. Medical Incident Probability
    let baseMedicalProb = 12 + activeIncidents * 8;
    if (state.matchPhase === 'ENTRY_SURGE' || state.matchPhase === 'EXIT_SURGE') baseMedicalProb += 15;
    if (modifiers.sectorBClosed) baseMedicalProb += 10;
    baseMedicalProb = Math.min(100, Math.max(3, baseMedicalProb));

    // E. Security Risk Level
    let baseSecurityRisk = 15 + activeIncidents * 12;
    if (state.matchPhase === 'EXIT_SURGE') baseSecurityRisk += 10;
    if (modifiers.sectorBClosed) baseSecurityRisk += 15;
    baseSecurityRisk = Math.min(100, Math.max(5, baseSecurityRisk));

    // F. Volunteer Shortage
    let baseVolunteerShortage = state.matchPhase === 'ENTRY_SURGE' ? 65 : state.matchPhase === 'EXIT_SURGE' ? 55 : 30;
    if (modifiers.volunteersDeployed) baseVolunteerShortage = 5;
    baseVolunteerShortage = Math.min(100, Math.max(0, baseVolunteerShortage));

    // G. Evacuation Readiness
    let baseEvacReadiness = 92;
    if (activeIncidents > 0) baseEvacReadiness -= 15;
    if (modifiers.sectorBClosed) baseEvacReadiness -= 20;
    if (modifiers.volunteersDeployed) baseEvacReadiness += 5;
    baseEvacReadiness = Math.min(100, Math.max(30, baseEvacReadiness));

    // H. Weather Impact
    let baseWeatherImpact = 10;
    const isRaining = state.incidents.some(i => i.title.toLowerCase().includes('rain') || i.description.toLowerCase().includes('rain'));
    if (isRaining) baseWeatherImpact = 75;

    // I. Transport Delays
    let baseTransportDelay = Math.round((state.transport.metroQueueSeconds + state.transport.busQueueSeconds) / 8);
    if (state.matchPhase === 'EXIT_SURGE') baseTransportDelay += 35;
    if (modifiers.sectorBClosed) baseTransportDelay += 10;

    // J. Overall Operational Risk
    const computedOverall = Math.round((baseCrowdRisk + baseGateRisk + baseQueueGrowth + baseMedicalProb + baseSecurityRisk + (100 - baseEvacReadiness)) / 6);

    const formatPct = (val: number) => `${val}%`;

    return [
      {
        id: 'crowd_congestion',
        title: 'Crowd Congestion Risk',
        current: formatPct(state.matchPhase === 'ENTRY_SURGE' ? 65 : state.matchPhase === 'EXIT_SURGE' ? 70 : 40),
        predicted: formatPct(baseCrowdRisk),
        confidence: 94,
        time: 'In 5 mins',
        severity: baseCrowdRisk >= 75 ? 'CRITICAL' : baseCrowdRisk >= 50 ? 'HIGH' : baseCrowdRisk >= 30 ? 'MEDIUM' : 'LOW',
        action: modifiers.volunteersDeployed 
          ? 'Volunteers active in sectors. Verify flow with CCTV feed.' 
          : 'Deploy 10 Volunteers to Metro Plaza and North Gates to distribute entry vectors.',
        icon: Users,
        rawPredicted: baseCrowdRisk,
      },
      {
        id: 'gate_overload',
        title: 'Gate Overload Probability',
        current: formatPct(state.gates.some(g => g.status === 'BUSY') ? 68 : 35),
        predicted: formatPct(baseGateRisk),
        confidence: 89,
        time: 'In 4 mins',
        severity: baseGateRisk >= 75 ? 'CRITICAL' : baseGateRisk >= 50 ? 'HIGH' : baseGateRisk >= 30 ? 'MEDIUM' : 'LOW',
        action: modifiers.auxGateOpened 
          ? 'Auxiliary Gate E is online. Load balanced across turnstiles.'
          : 'Authorize Open Gate 7 / Gate E immediately to relieve queue pressures.',
        icon: ShieldAlert,
        rawPredicted: baseGateRisk,
      },
      {
        id: 'queue_growth',
        title: 'Queue Growth Prediction',
        current: `${Math.round(state.gates.reduce((acc, g) => acc + g.avgQueueSeconds, 0) / state.gates.length)}s avg`,
        predicted: `${Math.round(baseQueueGrowth * 3.5)}s predicted`,
        confidence: 91,
        time: 'In 8 mins',
        severity: baseQueueGrowth >= 70 ? 'CRITICAL' : baseQueueGrowth >= 50 ? 'HIGH' : baseQueueGrowth >= 30 ? 'MEDIUM' : 'LOW',
        action: modifiers.auxGateOpened
          ? 'Queue growth vector flattened. Inflow normalized.'
          : 'Activate digital signage re-routing fans toward Gate C (East) and Gate D (West).',
        icon: Clock,
        rawPredicted: baseQueueGrowth,
      },
      {
        id: 'medical_incident',
        title: 'Medical Case Probability',
        current: `${activeIncidents} active case${activeIncidents !== 1 ? 's' : ''}`,
        predicted: formatPct(baseMedicalProb),
        confidence: 85,
        time: 'In 10 mins',
        severity: baseMedicalProb >= 40 ? 'CRITICAL' : baseMedicalProb >= 25 ? 'HIGH' : baseMedicalProb >= 15 ? 'MEDIUM' : 'LOW',
        action: 'Standby Medical Post 1 & 2. Ensure corridors remain unimpeded.',
        icon: Heart,
        rawPredicted: baseMedicalProb,
      },
      {
        id: 'security_risk',
        title: 'Security Risk Level',
        current: formatPct(10 + activeIncidents * 5),
        predicted: formatPct(baseSecurityRisk),
        confidence: 88,
        time: 'In 6 mins',
        severity: baseSecurityRisk >= 50 ? 'CRITICAL' : baseSecurityRisk >= 35 ? 'HIGH' : baseSecurityRisk >= 20 ? 'MEDIUM' : 'LOW',
        action: modifiers.sectorBClosed 
          ? 'Plaza North restricted. Maintain heightened security patrol in perimeter zones.'
          : 'Dispatch proactive roving security units toward transit intersection nodes.',
        icon: Shield,
        rawPredicted: baseSecurityRisk,
      },
      {
        id: 'volunteer_shortage',
        title: 'Volunteer Shortage',
        current: modifiers.volunteersDeployed ? 'Sufficient' : 'Adequate (142 active)',
        predicted: formatPct(baseVolunteerShortage),
        confidence: 92,
        time: 'In 12 mins',
        severity: baseVolunteerShortage >= 60 ? 'CRITICAL' : baseVolunteerShortage >= 40 ? 'HIGH' : baseVolunteerShortage >= 20 ? 'MEDIUM' : 'LOW',
        action: modifiers.volunteersDeployed
          ? 'Responders deployed. Coverage is maximized.'
          : 'Trigger broadcast notification calling all standby volunteer crew members to report.',
        icon: Wrench,
        rawPredicted: baseVolunteerShortage,
      },
      {
        id: 'evacuation_readiness',
        title: 'Evacuation Readiness',
        current: formatPct(95 - activeIncidents * 3),
        predicted: formatPct(baseEvacReadiness),
        confidence: 96,
        time: 'Instantaneous',
        severity: baseEvacReadiness <= 60 ? 'CRITICAL' : baseEvacReadiness <= 75 ? 'HIGH' : baseEvacReadiness <= 85 ? 'MEDIUM' : 'LOW_RISK',
        action: 'Ensure all emergency bypass doors are unlocked and stadium maps are synchronized.',
        icon: Zap,
        rawPredicted: 100 - baseEvacReadiness, // invert for severity coloring
      },
      {
        id: 'weather_impact',
        title: 'Weather Impact Index',
        current: isRaining ? 'Heavy Rain active' : 'Clear skies',
        predicted: formatPct(baseWeatherImpact),
        confidence: 98,
        time: 'In 15 mins',
        severity: baseWeatherImpact >= 70 ? 'CRITICAL' : baseWeatherImpact >= 50 ? 'HIGH' : baseWeatherImpact >= 25 ? 'MEDIUM' : 'LOW',
        action: isRaining 
          ? 'Heavy precipitation active. Advise fans via PA to shelter under upper deck roof sections.' 
          : 'Nominal conditions. No proactive weather measures required.',
        icon: Sparkles,
        rawPredicted: baseWeatherImpact,
      },
      {
        id: 'transport_delays',
        title: 'Transport Delays (Transit)',
        current: `Metro: ${state.transport.metroQueueSeconds}s / Bus: ${state.transport.busQueueSeconds}s`,
        predicted: formatPct(baseTransportDelay),
        confidence: 87,
        time: 'In 7 mins',
        severity: baseTransportDelay >= 70 ? 'CRITICAL' : baseTransportDelay >= 45 ? 'HIGH' : baseTransportDelay >= 25 ? 'MEDIUM' : 'LOW',
        action: 'Notify local transit dispatcher to coordinate 4 additional backup train services.',
        icon: Radio,
        rawPredicted: baseTransportDelay,
      },
      {
        id: 'overall_risk',
        title: 'Overall Operational Risk',
        current: formatPct(currentAvgRisk),
        predicted: formatPct(computedOverall),
        confidence: 95,
        time: 'In 5 mins',
        severity: computedOverall >= 65 ? 'CRITICAL' : computedOverall >= 45 ? 'HIGH' : computedOverall >= 25 ? 'MEDIUM' : 'LOW',
        action: computedOverall >= 60 ? 'Escalate emergency command center posture to ACTIVE WATCH II.' : 'nominal state operation.',
        icon: Activity,
        rawPredicted: computedOverall,
      },
    ];
  }, [state, dynamicSectors, modifiers]);

  // 7. Extract the Overall Operational Risk prediction to display in a summary
  const overallRiskPrediction = useMemo(() => {
    return predictions.find(p => p.id === 'overall_risk') || { predicted: '30%', severity: 'LOW' };
  }, [predictions]);

  // 8. Generate 4 Smart AI Scenario-aware Insights dynamically
  const smartInsights = useMemo(() => {
    const list: string[] = [];
    const activeIncidents = state.incidents.filter(i => i.active);

    if (modifiers.sectorBClosed) {
      list.push('🚨 Plaza North is RESTRICTED: Crowds re-routing south. Predicted congestion at Plaza South & Metro Terminal has increased by +30%.');
    } else if (state.matchPhase === 'ENTRY_SURGE') {
      list.push('⚡ Sector C & Plaza North are expected to exceed safe crowd density limits within 6 minutes under current inflow coefficients.');
    }

    if (!modifiers.auxGateOpened) {
      list.push('🚪 Gate 4 & Gate A queues are predicted to increase by 24% over the next 10 minutes. Recommend opening Auxiliary Gate E / Gate 7 to distribute the surge.');
    } else {
      list.push('✓ Dynamic Open Gate 7: Overload probability at main turnstiles reduced by 35%. Inflow stress has been successfully distributed.');
    }

    if (!modifiers.volunteersDeployed) {
      list.push('⚠️ Volunteer coverage in Zone B / Plazas may become insufficient during the upcoming match minutes. Recommend deploying 15 extra tactical volunteers.');
    } else {
      list.push('✓ Responders Deployed: Extra volunteer coverage is now active, successfully compressing the predicted queue growth and bottlenecking risks.');
    }

    if (activeIncidents.length > 0) {
      const highestSeverity = activeIncidents.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH') ? 'HIGH' : 'MEDIUM';
      list.push(`⚠️ Active Field Incidents (${activeIncidents.length}): Dynamic Risk is ${highestSeverity}. Secondary bottlenecks forming near emergency corridors.`);
    }

    const isRaining = state.incidents.some(i => i.title.toLowerCase().includes('rain') || i.description.toLowerCase().includes('rain'));
    if (isRaining) {
      list.push('🌧️ Weather Warning (Rain): F&B concession queues are projected to spike by +40% within 10 minutes as fans vacate uncovered stands.');
    }

    return list;
  }, [state, modifiers]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30 text-red-400 font-bold';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold';
      case 'LOW_RISK':
      case 'LOW':
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="flex flex-col gap-6" id="digital-twin-predictive-layer">
      
      {/* ────────────────── TOP CONTROL HEADER ────────────────── */}
      <div className="rounded-3xl border border-indigo-500/15 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Glow Element */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-md">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Digital Twin Intelligence</h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
                  🔮 SYNCHRONIZED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5 uppercase">Continuous AI State Projection Deck • FIFA WC 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center font-mono text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Projection Horizon:</span>
            <span className="text-white font-extrabold bg-slate-950/80 border border-white/5 px-2.5 py-1 rounded-xl">
              ⏱ +15 Minutes Continuous
            </span>
          </div>
        </div>

        {/* 10 KPIs Prediction Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Core Stadium Risk</span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">{overallRiskPrediction.predicted}</span>
            </div>
            <span className={`rounded-xl px-2.5 py-1 text-[9px] uppercase font-bold tracking-widest ${getSeverityStyle(overallRiskPrediction.severity)}`}>
              {overallRiskPrediction.severity} Severity
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Prediction Confidence</span>
              <span className="text-xl font-black font-mono text-indigo-300 mt-0.5 block">94.8%</span>
            </div>
            <span className="text-[9px] uppercase text-indigo-400 font-semibold tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-bounce" /> Real-time Grounded
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Telemetry Sample Rate</span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">10 Hz</span>
            </div>
            <span className="text-[9px] uppercase text-slate-400 font-semibold tracking-wide flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────── TWO-COLUMN SANDBOX & MAP LAYOUT ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: WHAT-IF SANDBOX & RISK MAP (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* WHAT-IF SIMULATION PANEL */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md relative overflow-hidden" aria-label="What-If Simulation Sandbox">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-500/[0.02] to-transparent pointer-events-none" />
            
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">What-If Operations Sandbox</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Toggle live actions to see simulated impact</p>
                </div>
              </div>
              <button
                onClick={handleResetModifiers}
                className="text-[10px] text-slate-500 hover:text-indigo-400 hover:underline transition-colors font-bold uppercase tracking-wider"
              >
                Reset Sandbox
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Action 1: Open auxiliary gate */}
              <button
                onClick={() => setModifiers(prev => ({ ...prev, auxGateOpened: !prev.auxGateOpened }))}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  modifiers.auxGateOpened 
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.1)] scale-[1.01]' 
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold ${
                    modifiers.auxGateOpened ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    🚪
                  </span>
                  <div className={`h-2.5 w-2.5 rounded-full ${modifiers.auxGateOpened ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'}`} />
                </div>
                <div>
                  <span className={`block text-xs font-bold mt-1 ${modifiers.auxGateOpened ? 'text-indigo-300' : 'text-slate-200'}`}>
                    Open Auxiliary Gate E
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">
                    {modifiers.auxGateOpened ? '✓ Queue load reduced' : 'Reduces gate turnstile bottlenecks'}
                  </span>
                </div>
              </button>

              {/* Action 2: Deploy extra volunteers */}
              <button
                onClick={() => setModifiers(prev => ({ ...prev, volunteersDeployed: !prev.volunteersDeployed }))}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  modifiers.volunteersDeployed 
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.1)] scale-[1.01]' 
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold ${
                    modifiers.volunteersDeployed ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    👥
                  </span>
                  <div className={`h-2.5 w-2.5 rounded-full ${modifiers.volunteersDeployed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'}`} />
                </div>
                <div>
                  <span className={`block text-xs font-bold mt-1 ${modifiers.volunteersDeployed ? 'text-indigo-300' : 'text-slate-200'}`}>
                    Deploy 15 Volunteers
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">
                    {modifiers.volunteersDeployed ? '✓ Peak crowd coverage active' : 'Relieves Plaza & entry congestion'}
                  </span>
                </div>
              </button>

              {/* Action 3: Close Sector B */}
              <button
                onClick={() => setModifiers(prev => ({ ...prev, sectorBClosed: !prev.sectorBClosed }))}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  modifiers.sectorBClosed 
                    ? 'bg-red-950/20 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)] scale-[1.01]' 
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold ${
                    modifiers.sectorBClosed ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    🛑
                  </span>
                  <div className={`h-2.5 w-2.5 rounded-full ${modifiers.sectorBClosed ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`} />
                </div>
                <div>
                  <span className={`block text-xs font-bold mt-1 ${modifiers.sectorBClosed ? 'text-red-400' : 'text-slate-200'}`}>
                    Restrict Plaza North
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">
                    {modifiers.sectorBClosed ? '⚠ Crowds re-routing South' : 'Simulate safety perimeter closure'}
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* DUAL-STATE DIGITAL RISK MAP */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md relative" aria-label="Digital Stadium Risk Map Overlay">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Digital Twin Interactive Map</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Dual-state risk prediction layers</p>
                </div>
              </div>

              {/* Map toggle */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-white/5 font-mono text-[9px] font-black tracking-widest self-start sm:self-center">
                <button
                  onClick={() => setMapOverlayMode('CURRENT')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase ${
                    mapOverlayMode === 'CURRENT' 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Current State
                </button>
                <button
                  onClick={() => setMapOverlayMode('PREDICTED')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase flex items-center gap-1 ${
                    mapOverlayMode === 'PREDICTED' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Cpu className="h-2.5 w-2.5" /> Predicted (+15m)
                </button>
              </div>
            </div>

            {/* Stadium Map Stage */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-4 shadow-inner flex flex-col items-center relative">
              <span className="absolute top-3 left-3 text-[9px] font-mono font-bold text-slate-500 flex items-center gap-1 uppercase">
                <span className={`h-1.5 w-1.5 rounded-full ${mapOverlayMode === 'PREDICTED' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
                Active Map Overlay: {mapOverlayMode === 'PREDICTED' ? 'AI PROJECTION MODE' : 'STATED REALITY'}
              </span>

              <svg viewBox="0 0 420 300" className="h-auto w-full max-w-sm md:max-w-md mt-4" role="img" aria-labelledby="twin-map-title">
                <title id="twin-map-title">Stadium Dual Risk Overlay Map</title>
                <defs>
                  <filter id="glowEffect">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background flow paths with subtle animations */}
                <path d="M105 55 C145 82 148 108 128 137" className="fill-none stroke-indigo-500/10" strokeWidth="2.5" strokeDasharray="5 5" />
                <path d="M315 55 C275 82 272 108 292 137" className="fill-none stroke-indigo-500/10" strokeWidth="2.5" strokeDasharray="5 5" />
                <path d="M122 250 C176 282 244 282 298 250" className="fill-none stroke-indigo-400/10" strokeWidth="3" strokeLinecap="round" />

                {/* Render Zones Dynamically with predicted or current risk */}
                {dynamicSectors.map((sector) => {
                  const activeRisk = mapOverlayMode === 'PREDICTED' ? sector.predictedRisk : sector.currentRisk;
                  
                  // Color selection helper
                  const getSectorColors = (score: number) => {
                    if (sector.id === 'PLAZA_NORTH' && modifiers.sectorBClosed) {
                      return 'fill-red-950/20 stroke-red-600/40 text-red-500';
                    }
                    if (score >= 80) return 'fill-red-500/15 stroke-red-500 text-red-400';
                    if (score >= 60) return 'fill-orange-500/15 stroke-orange-500 text-orange-400';
                    if (score >= 35) return 'fill-amber-500/10 stroke-amber-500 text-amber-300';
                    return 'fill-emerald-500/5 stroke-emerald-500/50 text-emerald-400';
                  };

                  const colorClass = getSectorColors(activeRisk);
                  const isHovered = hoveredSector === sector.id;

                  // Node layout coordinate definitions
                  if (sector.id === 'METRO_STATION') {
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <rect x="10" y="20" width="105" height="40" rx="6"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="22" y="44" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">METRO STATION</text>
                      </g>
                    );
                  }

                  if (sector.id === 'BUS_STATION') {
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <rect x="305" y="20" width="105" height="40" rx="6"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="317" y="44" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">BUS TERMINAL</text>
                      </g>
                    );
                  }

                  if (sector.id === 'PLAZA_NORTH') {
                    const isClosed = modifiers.sectorBClosed;
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <ellipse cx="100" cy="100" rx="42" ry="26"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="75" y="103" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">
                          {isClosed ? '⚠️ RESTRICTED' : 'PLAZA NORTH'}
                        </text>
                      </g>
                    );
                  }

                  if (sector.id === 'PLAZA_SOUTH') {
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <ellipse cx="320" cy="100" rx="42" ry="26"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="295" y="103" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">PLAZA SOUTH</text>
                      </g>
                    );
                  }

                  if (sector.id === 'CONCOURSE_LOWER') {
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <rect x="110" y="155" width="200" height="75" rx="37"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="175" y="168" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">LOWER CONCOURSE</text>
                      </g>
                    );
                  }

                  if (sector.id === 'CONCOURSE_UPPER') {
                    return (
                      <g key={sector.id} onMouseEnter={() => setHoveredSector(sector.id)} onMouseLeave={() => setHoveredSector(null)}>
                        <rect x="140" y="180" width="140" height="36" rx="18"
                          className={`stroke-2 transition-all duration-300 cursor-pointer ${colorClass} ${isHovered ? 'stroke-indigo-400 fill-indigo-950/40' : ''}`}
                          filter={isHovered ? 'url(#glowEffect)' : undefined}
                        />
                        <text x="178" y="193" className="fill-white text-[8px] font-black font-sans pointer-events-none tracking-wide">UPPER COV</text>
                      </g>
                    );
                  }

                  return null; // Don't clutter the main layout
                })}

                {/* Interactive ping indicators for hovering feedback */}
                {hoveredSector && (
                  <g className="pointer-events-none">
                    <circle cx="210" cy="150" r="18" className="fill-indigo-500/5 stroke-indigo-400 stroke-1 animate-ping" />
                  </g>
                )}
              </svg>

              {/* Legend & Hover sector values */}
              <div className="w-full mt-4 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-3 gap-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Stable</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Watch</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> High</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
                </div>

                <div className="text-right text-[10px] font-mono">
                  {hoveredSector ? (
                    (() => {
                      const sec = dynamicSectors.find(s => s.id === hoveredSector);
                      if (!sec) return 'Hover sector for telemetry';
                      return (
                        <span className="text-indigo-300 font-extrabold">
                          {sec.name}: Current {sec.currentRisk}% ➔ Predicted {sec.predictedRisk}% ({sec.trend === 'INCREASING' ? 'Increasing ↗' : sec.trend === 'DECREASING' ? 'Decreasing ↘' : 'Stable →'})
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-slate-500">Hover sectors for real-time risk comparison vectors</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* DYNAMIC LIVE TREND VECTOR VISUALIZER */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md" aria-label="Live Predictive Trend Visualizations">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Predictive Trend Vectors</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Dual-mode live trend telemetry</p>
                </div>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded">
                Telemetry Stream
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {[
                { label: 'Crowd Density', modifier: modifiers.sectorBClosed ? 'RISING' : state.matchPhase === 'ENTRY_SURGE' ? 'RISING' : 'STABLE', icon: Users, color: 'text-indigo-400' },
                { label: 'Queue Duration', modifier: modifiers.auxGateOpened ? 'FALLING' : state.matchPhase === 'ENTRY_SURGE' ? 'RISING' : 'FALLING', icon: Clock, color: 'text-rose-400' },
                { label: 'Volunteer Cover', modifier: modifiers.volunteersDeployed ? 'RISING' : 'STABLE', icon: Wrench, color: 'text-emerald-400' },
                { label: 'Medical Burden', modifier: state.incidents.length > 0 ? 'RISING' : 'STABLE', icon: Heart, color: 'text-red-400' },
                { label: 'Security Risk', modifier: modifiers.sectorBClosed ? 'RISING' : state.incidents.length > 0 ? 'RISING' : 'FALLING', icon: Shield, color: 'text-blue-400' },
              ].map((trend, idx) => {
                const getVectorIcon = (mod: string) => {
                  if (mod === 'RISING') return <TrendingUp className="h-4 w-4 text-rose-400 animate-bounce" />;
                  if (mod === 'FALLING') return <TrendingDown className="h-4 w-4 text-emerald-400" />;
                  return <span className="text-slate-500 font-bold font-mono">→</span>;
                };

                return (
                  <div key={idx} className="rounded-2xl bg-slate-950/70 border border-white/5 p-3.5 flex flex-col items-center justify-between text-center relative group overflow-hidden">
                    <trend.icon className={`h-4.5 w-4.5 ${trend.color} mb-1.5`} />
                    <span className="text-[10px] text-slate-400 block font-bold leading-tight">{trend.label}</span>
                    
                    <div className="flex items-center gap-1.5 mt-2.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/5">
                      <span className="text-[10px] font-mono font-black text-white">
                        {trend.modifier === 'RISING' ? 'UP' : trend.modifier === 'FALLING' ? 'DOWN' : 'STABLE'}
                      </span>
                      {getVectorIcon(trend.modifier)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: AI INSIGHTS & 10 PREDICTION CARDS (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* AI INSIGHTS NOTIFICATIONS PANEL */}
          <section className="rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-slate-900/50 to-indigo-950/15 p-5 shadow-xl backdrop-blur-md relative" aria-label="AI Twin Insights Panel">
            <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
            
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">AI Predictive Insights</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Real-time proactive stadium warnings</p>
                </div>
              </div>
              <span className="text-[8px] font-mono font-bold text-slate-500">4 EVENTS LIVE</span>
            </div>

            <div className="space-y-3 max-h-[195px] overflow-y-auto pr-1">
              {smartInsights.map((insight, idx) => (
                <div key={idx} className="rounded-2xl border border-indigo-500/10 bg-slate-950/70 p-3.5 flex gap-2.5 text-left leading-relaxed text-xs">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0 animate-ping" />
                  <p className="text-slate-300 font-medium font-sans">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* THE 10 DETAILED PREDICTION CARDS GRID */}
          <section className="flex flex-col gap-4" aria-label="Digital Twin Predictive Deck">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Radio className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Continuous AI Predictions Deck</h3>
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">10 synchronized operational vectors</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1 flex-1">
              {predictions.map((card) => {
                const isOverall = card.id === 'overall_risk';
                const Icon = card.icon;

                // Color variables
                const severityColors = 
                  card.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' :
                  card.severity === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                  card.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

                const progressColor = 
                  card.severity === 'CRITICAL' ? 'bg-red-500' :
                  card.severity === 'HIGH' ? 'bg-orange-500' :
                  card.severity === 'MEDIUM' ? 'bg-amber-500' :
                  'bg-emerald-500';

                return (
                  <div key={card.id} className={`rounded-2xl border bg-slate-950/85 p-4 space-y-3 transition duration-200 hover:border-slate-700/80 relative overflow-hidden ${
                    isOverall ? 'border-indigo-500/20 bg-gradient-to-r from-slate-950 to-indigo-950/15' : 'border-slate-800'
                  }`}>
                    {/* Corner Visual Glow */}
                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/[0.01] to-transparent pointer-events-none" />

                    {/* Card Title & Meta Row */}
                    <div className="flex items-start justify-between gap-2 text-left">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4.5 w-4.5 ${isOverall ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                        <h4 className="text-xs font-black text-white leading-tight">{card.title}</h4>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-mono tracking-widest border ${severityColors}`}>
                        {card.severity}
                      </span>
                    </div>

                    {/* Telemetry Vectors Row */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/25 border border-white/[0.03] p-2.5 rounded-xl text-left text-[10px]">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-500">Current</span>
                        <span className="text-slate-300 font-mono font-bold mt-0.5 block truncate">{card.current}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-indigo-400">Predicted</span>
                        <span className="text-white font-mono font-black mt-0.5 block truncate">{card.predicted}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-500">Horizon</span>
                        <span className="text-indigo-300 font-bold font-mono mt-0.5 block truncate">{card.time}</span>
                      </div>
                    </div>

                    {/* Progress Slider Display */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-[7px] font-extrabold text-slate-500 uppercase tracking-widest">
                        <span>Prediction Confidence Coefficient</span>
                        <span className="font-mono text-indigo-400 text-[9px]">{card.confidence}% Confidence</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${card.rawPredicted}%` }} />
                      </div>
                    </div>

                    {/* Recommended Action Box */}
                    <div className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-left leading-relaxed">
                      <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[7px] block mb-0.5">
                        💡 Recommended AI Action:
                      </span>
                      <span className="text-slate-300 font-sans">{card.action}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
