import express from 'express';
import request from 'supertest';
import { createRequestMonitoring } from '../src/common/middleware/request-monitoring.js';

it('records volume, rate limits, errors and latency without storing request data', async () => {
  const monitor = createRequestMonitoring();
  const app = express();
  app.use(monitor.middleware);
  app.get('/api/v1/customer/maps/autocomplete', (req, res) => res.status(429).json({}));
  app.get('/error', (req, res) => res.status(500).json({}));
  await request(app).get('/api/v1/customer/maps/autocomplete?input=private-address');
  await request(app).get('/error');
  const snapshot = monitor.snapshot();
  expect(snapshot.counters).toEqual(expect.arrayContaining([
    expect.objectContaining({ scope: 'location_search', outcome: '4xx', requests: 1, rateLimited: 1 }),
    expect.objectContaining({ outcome: '5xx', requests: 1 }),
  ]));
  expect(snapshot.counters.every((counter) => counter.averageLatencyMs >= 0)).toBe(true);
  expect(JSON.stringify(snapshot)).not.toContain('private-address');
});
