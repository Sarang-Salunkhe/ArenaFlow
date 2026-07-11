import { Router } from 'express';
import { getCurrentState } from '../engines/simulator.js';
import { generateAllInsights } from '../engines/crowdIntelligence.js';
import { evaluateDecisions } from '../engines/decisionEngine.js';

export const stadiumRouter = Router();

// GET /api/stadium/state
stadiumRouter.get('/state', (_req, res) => {
  try {
    const state = getCurrentState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET /api/operations/insights
stadiumRouter.get('/insights', (_req, res) => {
  try {
    const state = getCurrentState();
    const insights = generateAllInsights(state.zones, state.incidents);
    res.json(insights);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET /api/operations/decisions
stadiumRouter.get('/decisions', (_req, res) => {
  try {
    const state = getCurrentState();
    const decisions = evaluateDecisions(state);
    res.json(decisions);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
