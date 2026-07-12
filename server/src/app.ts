import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { stadiumRouter } from './routes/stadium.js';
import { operationsRouter } from './routes/operations.js';
import { simulationRouter } from './routes/simulation.js';
import { routingRouter } from './routes/routing.js';
import { incidentsRouter } from './routes/incidents.js';
import { aiRouter } from './routes/ai.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // 100 requests/IP
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());

  // Mount endpoints
  app.use('/api/stadium', stadiumRouter);
  app.use('/api/operations', operationsRouter);
  app.use('/api/simulation', simulationRouter);
  app.use('/api/routes', routingRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/health', healthRouter);

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler to prevent exposing stack traces
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

