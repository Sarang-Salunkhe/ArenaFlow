import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('ArenaFlow REST API Integration Tests', () => {
  const app = createApp();

  beforeAll(() => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  });

  describe('Stadium & Insights Endpoints', () => {
    it('GET /api/stadium/state returns current stadium layout state', async () => {
      const res = await request(app).get('/api/stadium/state');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('matchPhase');
      expect(res.body).toHaveProperty('zones');
      expect(res.body).toHaveProperty('gates');
    });

    it('GET /api/operations/insights returns zone risk analytics', async () => {
      const res = await request(app).get('/api/operations/insights');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('riskScore');
      expect(res.body[0]).toHaveProperty('reasons');
    });

    it('GET /api/operations/decisions returns rule recommendations list', async () => {
      const res = await request(app).get('/api/operations/decisions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Simulation Actions', () => {
    it('POST /api/simulation/advance increments tick count', async () => {
      const firstRes = await request(app).get('/api/stadium/state');
      const startTick = firstRes.body.tickCount;

      const advanceRes = await request(app).post('/api/simulation/advance');
      expect(advanceRes.status).toBe(200);
      expect(advanceRes.body.tickCount).toBe(startTick + 1);
    });

    it('POST /api/simulation/phase sets active phase with Zod checks', async () => {
      const res = await request(app)
        .post('/api/simulation/phase')
        .send({ phase: 'ENTRY_SURGE' });
      expect(res.status).toBe(200);
      expect(res.body.matchPhase).toBe('ENTRY_SURGE');

      // Invalid check
      const badRes = await request(app)
        .post('/api/simulation/phase')
        .send({ phase: 'BAD_PHASE' });
      expect(badRes.status).toBe(400);
    });

    it('POST /api/simulation/scenario triggers demo scenarios', async () => {
      const res = await request(app)
        .post('/api/simulation/scenario')
        .send({ scenario: 'MEDICAL_INCIDENT' });
      expect(res.status).toBe(200);
      expect(res.body.incidents.length).toBeGreaterThan(0);
    });
  });

  describe('Pathfinding Route Calculations', () => {
    it('POST /api/routes/calculate returns direct path instructions', async () => {
      const res = await request(app)
        .post('/api/routes/calculate')
        .send({
          startNodeId: 'METRO_STATION',
          destinationNodeId: 'GATE_A',
          accessibilityRequired: false,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('path');
      expect(res.body).toHaveProperty('nodeNames');
      expect(res.body.totalDistance).toBe(400);
    });

    it('POST /api/routes/calculate fails with 400 for unreachable nodes', async () => {
      // Create a scenario to clear state
      await request(app).post('/api/simulation/reset');

      // Induce plaza block incident
      await request(app)
        .post('/api/incidents/report')
        .send({
          zoneId: 'PLAZA_NORTH',
          title: 'Full Blockage',
          severity: 'CRITICAL',
          description: 'Emergency corridor block',
        });

      const res = await request(app)
        .post('/api/routes/calculate')
        .send({
          startNodeId: 'METRO_STATION',
          destinationNodeId: 'GATE_A',
          accessibilityRequired: false,
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Incident Submission', () => {
    it('POST /api/incidents/report inserts and validates new incident', async () => {
      const res = await request(app)
        .post('/api/incidents/report')
        .send({
          zoneId: 'STAND_WEST',
          title: 'Seat Collapse Sector W',
          severity: 'MEDIUM',
          description: 'Row 3 seat 5 cracked. Zone cleared.',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.active).toBe(true);

      // Verify validation check
      const badRes = await request(app)
        .post('/api/incidents/report')
        .send({
          zoneId: 'STAND_WEST',
          title: 'A', // too short
          severity: 'SEVERE', // invalid enum
          description: 'Broken seat',
        });
      expect(badRes.status).toBe(400);
    });
  });

  describe('AI Copilot Endpoints', () => {
    it('POST /api/ai/assist runs fallback behavior without api key', async () => {
      // Re-trigger simulator reset to clear any blocking incidents
      await request(app).post('/api/simulation/reset');

      const res = await request(app)
        .post('/api/ai/assist')
        .send({
          role: 'FAN',
          userPrompt: 'how do I walk to the exit?',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('text');
      expect(res.body.aiPowered).toBe(false);
      expect(res.body.fallbackUsed).toBe(true);
      expect(res.body.text).toContain('Deterministic Wayfinding Assistance');
    });

    it('POST /api/ai/brief runs fallback briefing', async () => {
      const res = await request(app)
        .post('/api/ai/brief')
        .send({
          role: 'OPERATIONS',
        });
      expect(res.status).toBe(200);
      expect(res.body.fallbackUsed).toBe(true);
      expect(res.body.text).toContain('Deterministic System Brief');
    });
  });
});
