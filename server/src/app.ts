import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { stadiumRouter } from './routes/stadium.js';
import { simulationRouter } from './routes/simulation.js';
import { routingRouter } from './routes/routing.js';
import { incidentsRouter } from './routes/incidents.js';
import { aiRouter } from './routes/ai.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());

  // Mount endpoints
  app.use('/api', stadiumRouter); // handles /stadium/state, /operations/insights, /operations/decisions
  app.use('/api/simulation', simulationRouter);
  app.use('/api/routes', routingRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/health', healthRouter);

  // Global error handler to prevent exposing stack traces
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

