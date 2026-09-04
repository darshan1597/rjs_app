import request from 'supertest';
import { createApp } from '../src/app.js';

describe('health endpoint', () => {
  it('returns the service status', async () => {
    const response = await request(createApp()).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('rjs-backend');
  });
});
