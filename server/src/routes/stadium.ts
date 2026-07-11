import { Router } from 'express';
import { getCurrentState } from '../engines/simulator.js';

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
