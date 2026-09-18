import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../src/modules/customers/customer-auth.middleware.js', () => ({ authenticateCustomer: (req, res, next) => { req.customer = { id: 'customer', name: 'Test', phone: 'test' }; next(); } }));
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { findOne: vi.fn(), createWithUniqueNumber: vi.fn() } }));
vi.mock('../src/modules/drivers/driver.model.js', () => ({ Driver: { exists: vi.fn() } }));
vi.mock('../src/modules/vehicles/vehicle.model.js', () => ({ VehicleCategory: { findOne: vi.fn() }, VehicleVariant: { findOne: vi.fn() } }));
vi.mock('../src/modules/maps/maps.service.js', () => ({ computeRoute: vi.fn() }));
vi.mock('../src/modules/bookings/local-fare.service.js', () => ({ calculateLocalFare: () => ({ totalFare: 100 }), fareBandFor: vi.fn() }));

import { Booking } from '../src/modules/bookings/booking.model.js';
import { Driver } from '../src/modules/drivers/driver.model.js';
import { VehicleCategory, VehicleVariant } from '../src/modules/vehicles/vehicle.model.js';
import { computeRoute } from '../src/modules/maps/maps.service.js';
import { customerBookingRouter } from '../src/modules/customers/customer-booking.routes.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';
const app = express();
app.use(express.json());
app.use('/bookings', customerBookingRouter);
app.use(errorHandler);
const body = { pickupAddress: 'Pickup', destinationAddress: 'Destination', pickupLatitude: 12, pickupLongitude: 77, destinationLatitude: 13, destinationLongitude: 78, categoryId: 'a'.repeat(24), variantId: 'b'.repeat(24), idempotencyKey: 'retry_key_123456789' };
let saved;
beforeEach(() => {
  vi.resetAllMocks();
  saved = null;
  Booking.findOne.mockImplementation(() => ({ populate: () => Promise.resolve(saved) }));
  Booking.createWithUniqueNumber.mockImplementation(async (values) => { saved = { ...values, id: 'booking', bookingNumber: 'RJS_TEST' }; return saved; });
  VehicleCategory.findOne.mockResolvedValue({ id: body.categoryId, code: 'LOCAL' });
  VehicleVariant.findOne.mockResolvedValue({ id: body.variantId, code: 'SEDAN', onRoadPrice: 1000000 });
  Driver.exists.mockResolvedValue(true);
  computeRoute.mockResolvedValue({ distanceKm: 10, durationMinutes: 20 });
});
it('replays a booking after a lost response without creating another ride', async () => {
  expect((await request(app).post('/bookings').send(body)).status).toBe(201);
  const retry = await request(app).post('/bookings').send(body);
  expect(retry.status).toBe(200);
  expect(retry.body.data.booking.id).toBe('booking');
  expect(Booking.createWithUniqueNumber).toHaveBeenCalledTimes(1);
  expect(computeRoute).toHaveBeenCalledTimes(1);
});
it('rejects reusing a retry key for different booking details', async () => {
  await request(app).post('/bookings').send(body);
  const retry = await request(app).post('/bookings').send({ ...body, destinationAddress: 'Different place' });
  expect(retry.status).toBe(409);
  expect(retry.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
});
it('replays the winner of a concurrent unique-key collision', async () => {
  Booking.createWithUniqueNumber.mockImplementation(async (values) => {
    saved = { ...values, id: 'winner' };
    throw { code: 11000, keyPattern: { customerId: 1, bookingRequestKey: 1 } };
  });
  const retry = await request(app).post('/bookings').send(body);
  expect(retry.status).toBe(200);
  expect(retry.body.data.booking.id).toBe('winner');
});
