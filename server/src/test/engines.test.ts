import { describe, it, expect, beforeEach } from 'vitest';
import { getCurrentState, resetSimulation, advanceSimulation, setMatchPhase, triggerScenario } from '../engines/simulator.js';
import { calculateCrowdInsight } from '../engines/crowdIntelligence.js';
import { calculateRoute } from '../engines/routingEngine.js';
import { evaluateDecisions } from '../engines/decisionEngine.js';
import { StadiumZone } from '../types.js';

describe('Deterministic Engines Unit Tests', () => {
  beforeEach(() => {
    resetSimulation();
  });

  describe('Simulator Engine', () => {
    it('initializes to PRE_MATCH state with tick count 0', () => {
      const state = getCurrentState();
      expect(state.matchPhase).toBe('PRE_MATCH');
      expect(state.tickCount).toBe(0);
      expect(state.zones.length).toBeGreaterThan(0);
      expect(state.gates.length).toBeGreaterThan(0);
      expect(state.incidents.length).toBe(0);
    });

    it('advances tick count and oscillates occupancies', () => {
      const state1 = { ...getCurrentState() };
      advanceSimulation();
      const state2 = getCurrentState();
      expect(state2.tickCount).toBe(1);
      // Occupancies should oscillate slightly deterministically
      const diffOcc = state2.zones.some((z, idx) => z.occupancy !== state1.zones[idx].occupancy);
      expect(diffOcc).toBe(true);
    });

    it('updates targets correctly on phase change', () => {
      setMatchPhase('MATCH_ACTIVE');
      const state = getCurrentState();
      expect(state.matchPhase).toBe('MATCH_ACTIVE');
      // In MATCH_ACTIVE, seating stands should have high occupancies
      const standEast = state.zones.find(z => z.id === 'STAND_EAST');
      expect(standEast?.crowdLevel).toBe('CRITICAL'); // cap is 92%
    });

    it('triggers predefined scenarios', () => {
      triggerScenario('MEDICAL_INCIDENT');
      const state = getCurrentState();
      expect(state.incidents.length).toBe(1);
      expect(state.incidents[0].zoneId).toBe('STAND_EAST');
      expect(state.incidents[0].severity).toBe('CRITICAL');
    });
  });

  describe('Crowd Intelligence Engine', () => {
    const mockZone: StadiumZone = {
      id: 'TEST_ZONE',
      name: 'Test Zone',
      capacity: 1000,
      occupancy: 100,
      crowdLevel: 'LOW',
      trend: 'STABLE',
      riskScore: 0,
      attentionLevel: 'NORMAL',
      type: 'PLAZA',
      isAccessible: true
    };

    it('handles LOW crowd boundaries', () => {
      const insight = calculateCrowdInsight({ ...mockZone, occupancy: 100 }, []);
      expect(insight.crowdLevel).toBe('LOW');
      expect(insight.riskScore).toBe(10); // occupancy 10% + trend 0 + incidents 0 = 10
      expect(insight.recommendedAttentionLevel).toBe('NORMAL');
    });

    it('handles HIGH and CRITICAL crowd boundaries', () => {
      const insightHigh = calculateCrowdInsight({ ...mockZone, occupancy: 700 }, []);
      expect(insightHigh.crowdLevel).toBe('HIGH');
      expect(insightHigh.riskScore).toBe(70);

      const insightCritical = calculateCrowdInsight({ ...mockZone, occupancy: 920 }, []);
      expect(insightCritical.crowdLevel).toBe('CRITICAL');
      expect(insightCritical.riskScore).toBe(92);
      expect(insightCritical.thresholdViolations).toContain('OCCUPANCY_CRITICAL');
    });

    it('factors in rising trends and incidents', () => {
      const activeIncidents = [{
        id: 'inc1',
        zoneId: 'TEST_ZONE',
        title: 'Crowd clog',
        severity: 'HIGH' as const,
        description: 'Gate blocked',
        active: true,
        timestamp: ''
      }];
      const insight = calculateCrowdInsight({ ...mockZone, occupancy: 500, trend: 'RAPIDLY_RISING' }, activeIncidents);
      // Base risk: 50%
      // Trend penalty: +20 (RAPIDLY_RISING)
      // Incident penalty: +25 (HIGH severity)
      // Total = 95
      expect(insight.riskScore).toBe(95);
      expect(insight.recommendedAttentionLevel).toBe('CRITICAL');
      expect(insight.thresholdViolations).toContain('ACTIVE_INCIDENT');
    });
  });

  describe('Routing Engine', () => {
    it('calculates the shortest valid path', () => {
      const state = getCurrentState();
      const result = calculateRoute({
        startNodeId: 'METRO_STATION',
        destinationNodeId: 'GATE_A',
        accessibilityRequired: false
      }, state);
      expect(result.path).toEqual(['METRO_STATION', 'PLAZA_NORTH', 'GATE_A']);
      expect(result.totalDistance).toBe(400); // 300m + 100m
      expect(result.estimatedWalkingTimeMinutes).toBe(5); // 400 / 80
    });

    it('respects accessibility constraints and takes the lift', () => {
      const state = getCurrentState();
      // Route from Lower Concourse to Upper Concourse
      // Non-accessible can go directly via stairs: CONCOURSE_LOWER -> CONCOURSE_UPPER (40m)
      const standardResult = calculateRoute({
        startNodeId: 'CONCOURSE_LOWER',
        destinationNodeId: 'CONCOURSE_UPPER',
        accessibilityRequired: false
      }, state);
      expect(standardResult.path).toEqual(['CONCOURSE_LOWER', 'CONCOURSE_UPPER']);

      // Accessible must route via Lift: CONCOURSE_LOWER -> LIFT_NORTH -> CONCOURSE_UPPER (20m + 10m = 30m)
      const accessibleResult = calculateRoute({
        startNodeId: 'CONCOURSE_LOWER',
        destinationNodeId: 'CONCOURSE_UPPER',
        accessibilityRequired: true
      }, state);
      expect(accessibleResult.path).toEqual(['CONCOURSE_LOWER', 'LIFT_NORTH', 'CONCOURSE_UPPER']);
      expect(accessibleResult.routeFacts.isAccessible).toBe(true);
    });

    it('avoids closed zones', () => {
      triggerScenario('ROUTE_CLOSURE'); // closes EMERGENCY_CORRIDOR
      const state = getCurrentState();
      
      // Attempting to route CONCOURSE_LOWER -> EMERGENCY_CORRIDOR -> PLAZA_SOUTH
      // Since EMERGENCY_CORRIDOR is closed, routing should fail or take a different path
      // Direct path would be CONCOURSE_LOWER -> EMERGENCY_CORRIDOR -> PLAZA_SOUTH
      // Alternative: CONCOURSE_LOWER -> GATE_B -> PLAZA_SOUTH (50m + 100m = 150m)
      const result = calculateRoute({
        startNodeId: 'CONCOURSE_LOWER',
        destinationNodeId: 'PLAZA_SOUTH',
        accessibilityRequired: false
      }, state);
      
      expect(result.path).toEqual(['CONCOURSE_LOWER', 'GATE_B', 'PLAZA_SOUTH']);
    });

    it('throws error when no valid route is found', () => {
      const state = getCurrentState();
      // Block both North Plaza paths to Gate A
      state.incidents.push({
        id: 'inc_block',
        zoneId: 'PLAZA_NORTH',
        title: 'Plaza Blocked',
        severity: 'CRITICAL',
        description: 'Zone closed',
        active: true,
        timestamp: ''
      });

      expect(() => {
        calculateRoute({
          startNodeId: 'METRO_STATION',
          destinationNodeId: 'GATE_A',
          accessibilityRequired: false
        }, state);
      }).toThrow(/no valid route exists/i);
    });
  });

  describe('Operational Decision Engine', () => {
    it('evaluates gate congestion alerts and diversion tips', () => {
      // Setup: Gate A congested, Gate B empty
      const state = getCurrentState();
      const gateA = state.gates.find(g => g.id === 'GATE_A')!;
      gateA.status = 'BUSY';
      gateA.occupancy = 4800; // near cap
      gateA.trend = 'RISING';

      const gateB = state.gates.find(g => g.id === 'GATE_B')!;
      gateB.status = 'OPEN';
      gateB.occupancy = 500; // clear

      const decisions = evaluateDecisions(state);
      const gateDecision = decisions.find(d => d.source === 'CROWD');
      expect(gateDecision).toBeDefined();
      expect(gateDecision?.title).toContain('Gate A');
      expect(gateDecision?.title).toContain('Gate B');
      expect(gateDecision?.recommendedActions[0]).toContain('Divert');
    });

    it('evaluates medical dispatch emergency rules', () => {
      triggerScenario('MEDICAL_INCIDENT');
      const state = getCurrentState();
      const decisions = evaluateDecisions(state);
      const medDecision = decisions.find(d => d.source === 'MEDICAL');
      expect(medDecision).toBeDefined();
      expect(medDecision?.priority).toBe('CRITICAL');
      expect(medDecision?.affectedLocations).toContain('STAND_EAST');
    });
  });
});
