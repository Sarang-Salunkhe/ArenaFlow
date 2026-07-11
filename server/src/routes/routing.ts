import { Router } from 'express';
import { z } from 'zod';
import { calculateRoute } from '../engines/routingEngine.js';
import { getCurrentState } from '../engines/simulator.js';

export const routingRouter = Router();

const routeRequestSchema = z.object({
  startNodeId: z.string().min(1, 'Start node is required'),
  destinationNodeId: z.string().min(1, 'Destination node is required'),
  accessibilityRequired: z.boolean().default(false),
});

// POST /api/routes/calculate
routingRouter.post('/calculate', (req, res) => {
  const result = routeRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid route request parameters.', details: result.error.flatten() });
    return;
  }

  try {
    const state = getCurrentState();
    const route = calculateRoute(result.data, state);
    res.json(route);
  } catch (error: any) {
    // If routing engine throws, we return a structured 400 error indicating no path found
    res.status(400).json({ error: error.message || 'Routing calculation failed.' });
  }
});
