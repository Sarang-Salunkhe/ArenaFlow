import { Router } from 'express';
import { generateAllInsights } from '../engines/crowdIntelligence.js';
import { evaluateDecisions } from '../engines/decisionEngine.js';
import { getCurrentState } from '../engines/simulator.js';

export const operationsRouter = Router();

operationsRouter.get('/insights', (_req, res) => {
  try {
    const state = getCurrentState();
    const insights = generateAllInsights(state.zones, state.incidents);
    res.json(insights);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

operationsRouter.get('/decisions', (_req, res) => {
  try {
    const state = getCurrentState();
    const decisions = evaluateDecisions(state);
    res.json(decisions);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
