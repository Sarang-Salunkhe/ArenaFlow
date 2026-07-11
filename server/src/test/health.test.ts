import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GET /api/health', () => {
  beforeAll(() => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  });

  it('returns structured health status JSON', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'ArenaFlow API',
    });
    expect(response.headers['content-type']).toMatch(/json/);
  });
});
