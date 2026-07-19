import { Router } from 'express';
import { z } from 'zod';
import { reportIncident } from '../engines/simulator.js';

export const incidentsRouter = Router();

const reportIncidentSchema = z.object({
  zoneId: z.string().min(1, 'Zone ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title is too long'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(5, 'Description must be at least 5 characters long').max(500, 'Description is too long'),
});

// POST /api/incidents/report
incidentsRouter.post('/report', (req, res) => {
  const result = reportIncidentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid incident report parameters.', details: result.error.flatten() });
    return;
  }

  try {
    const newIncident = reportIncident(result.data);
    res.status(201).json(newIncident);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
