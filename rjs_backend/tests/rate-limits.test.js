import express from 'express';
import request from 'supertest';
import { createLimiter, createOtpLimiters, createAccountLimiter, accountRequestScope, endpointRequestScope } from '../src/common/middleware/rate-limits.js';

it('payment creation has its own quota without blocking verification or cancellation', async () => {
  const app = express();
  app.use((req, res, next) => { req.customer = { id: req.get('test-account') ?? 'alice' }; next(); });
  app.use(createAccountLimiter('customer', undefined, { payment_creation: 1, cancel_booking: 5, create_booking: 5, fare_estimate: 20, location_search: 30, driver_offer: 20 }));
  app.use((req, res) => res.json({ success: true }));
  const path = '/api/v1/customer/bookings/abc/payment-order';
  expect((await request(app).post(path)).status).toBe(200);
  const blocked = await request(app).post(path);
  expect(blocked.status).toBe(429);
  expect(blocked.headers['x-ratelimit-scope']).toBe('payment_creation');
  expect((await request(app).post('/api/v1/customer/bookings/abc/verify-payment')).status).toBe(200);
  expect((await request(app).post('/api/v1/customer/bookings/abc/cancel')).status).toBe(200);
  expect((await request(app).post(path).set('test-account', 'bob')).status).toBe(200);
});

it.each([
  ['GET', '/api/v1/customer/maps/autocomplete?input=test', 'location_search'],
  ['GET', '/api/v1/customer/maps/places/test', 'location_search'],
  ['GET', '/api/v1/customer/bookings/vehicle-catalog?pickupLatitude=1', 'fare_estimate'],
  ['POST', '/api/v1/customer/maps/route', 'fare_estimate'],
  ['POST', '/api/v1/customer/bookings', 'create_booking'],
  ['POST', '/api/v1/customer/bookings/abc/cancel', 'cancel_booking'],
  ['POST', '/api/v1/driver/trips/abc/accept', 'driver_offer'],
  ['POST', '/api/v1/driver/trips/abc/reject', 'driver_offer'],
  ['POST', '/api/v1/driver/trips/abc/payment-qr', 'payment_creation'],
  ['POST', '/api/v1/customer/wallet/withdrawals', 'payment_creation'],
  ['POST', '/api/v1/customer/bookings/abc/verify-payment', null],
])('classifies endpoint %s %s', (method, path, expected) => {
  expect(endpointRequestScope(method, path)).toBe(expected);
});

it('exhausting tracking does not block GPS, ride/payment actions, or other accounts', async () => {
  const app = express();
  app.use((req, res, next) => { req.driver = { id: req.get('test-account') ?? 'alice' }; next(); });
  app.use(createAccountLimiter('driver', { tracking: 1, gps: 1, actions: 1, other: 1 }));
  app.use((req, res) => res.json({ success: true }));
  expect((await request(app).get('/api/v1/driver/trips/active')).status).toBe(200);
  const blocked = await request(app).get('/api/v1/driver/trips/offers');
  expect(blocked.status).toBe(429);
  expect(blocked.headers['x-ratelimit-scope']).toBe('tracking');
  expect((await request(app).patch('/api/v1/driver/trips/location')).status).toBe(200);
  expect((await request(app).post('/api/v1/driver/trips/abc/complete')).status).toBe(200);
  expect((await request(app).get('/api/v1/driver/auth/me')).status).toBe(200);
  expect((await request(app).get('/api/v1/driver/trips/active').set('test-account', 'bob')).status).toBe(200);
});

it('classifies customer tracking, payment, booking creation, and ordinary reads', () => {
  expect(accountRequestScope('GET', '/api/v1/customer/bookings/6aad00f0e899a8a635eca74e?refresh=1')).toBe('tracking');
  expect(accountRequestScope('POST', '/api/v1/customer/bookings/abc/verify-payment')).toBe('actions');
  expect(accountRequestScope('POST', '/api/v1/customer/bookings')).toBe('actions');
  expect(accountRequestScope('GET', '/api/v1/customer/bookings')).toBe('other');
});

it('limits one account without blocking another on the same IP and returns JSON retry details', async () => {
  const app = express();
  // Test ids stand in for server-verified account ids, not production client headers.
  app.use((req, res, next) => { req.customer = { id: req.path }; next(); });
  app.use(createLimiter({ windowMs: 60000, limit: 2, keyGenerator: (req) => `customer:${req.customer.id}` }));
  app.get('*path', (req, res) => res.json({ success: true }));
  expect((await request(app).get('/alice')).status).toBe(200);
  expect((await request(app).get('/alice')).status).toBe(200);
  const blocked = await request(app).get('/alice');
  expect(blocked.status).toBe(429);
  expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  expect(blocked.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
  expect((await request(app).get('/bob')).status).toBe(200);
});

it('caps OTP sends per phone while allowing a different phone', async () => {
  const app = express();
  app.use(express.json());
  app.post('/otp', createOtpLimiters().request, (req, res) => res.json({ success: true }));
  for (let index = 0; index < 5; index++) expect((await request(app).post('/otp').send({ phone: '6666666666' })).status).toBe(200);
  expect((await request(app).post('/otp').send({ phone: '6666666666' })).status).toBe(429);
  expect((await request(app).post('/otp').send({ phone: '7777777777' })).status).toBe(200);
});
