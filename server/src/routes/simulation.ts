import { Router } from 'express';
import { z } from 'zod';
import {
  getCurrentState,
  advanceSimulation,
  resetSimulation,
  setMatchPhase,
  triggerScenario,
} from '../engines/simulator.js';

export const simulationRouter = Router();

// POST /api/simulation/advance
simulationRouter.post('/advance', (_req, res) => {
  try {
    advanceSimulation();
    const state = getCurrentState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST /api/simulation/reset
simulationRouter.post('/reset', (_req, res) => {
  try {
    resetSimulation();
    const state = getCurrentState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Schema for match phase
const phaseSchema = z.object({
  phase: z.enum([
    'PRE_MATCH',
    'ENTRY_SURGE',
    'MATCH_ACTIVE',
    'HALF_TIME',
    'MATCH_END',
    'EXIT_SURGE',
  ]),
});

// POST /api/simulation/phase
simulationRouter.post('/phase', (req, res) => {
  const result = phaseSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid match phase parameter.', details: result.error.flatten() });
    return;
  }

  try {
    setMatchPhase(result.data.phase);
    const state = getCurrentState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Schema for scenarios
const scenarioSchema = z.object({
  scenario: z.enum(['GATE_CONGESTION', 'MEDICAL_INCIDENT', 'ROUTE_CLOSURE', 'EXIT_SURGE']),
});

// POST /api/simulation/scenario
simulationRouter.post('/scenario', (req, res) => {
  const result = scenarioSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid scenario parameter.', details: result.error.flatten() });
    return;
  }

  try {
    triggerScenario(result.data.scenario);
    const state = getCurrentState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
