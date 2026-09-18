import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../src/modules/drivers/driver-auth.middleware.js', () => ({ authenticateDriver: (req, res, next) => { req.driver = { id: 'driver', _id: 'driver', operationalStatus: req.get('test-offline') ? 'OFFLINE' : 'ONLINE', save: vi.fn() }; next(); } }));
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { findOne: vi.fn(), exists: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('../src/modules/bookings/pickup-preparation.service.js', () => ({ preparePickup: vi.fn(), pickupPreparationState: () => ({ canStartPickup: false }) }));
import { Booking } from '../src/modules/bookings/booking.model.js';
import { preparePickup } from '../src/modules/bookings/pickup-preparation.service.js';
import { driverTripRouter } from '../src/modules/drivers/driver-trip.routes.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';
const app = express();
app.use(express.json());
app.use('/trips', driverTripRouter);
app.use(errorHandler);
const id = 'a'.repeat(24);
let booking;
const location = () => ({ latitude: 12, longitude: 77, recordedAt: new Date().toISOString() });
beforeEach(() => {
  vi.clearAllMocks();
  booking = { _id: id, id, currentDriverId: 'driver', timing: 'SCHEDULED', status: 'ASSIGNED', scheduledStartAt: new Date(Date.now() + 30 * 60000), pickup: { latitude: 13, longitude: 78 } };
  Booking.findOne.mockImplementation(async () => booking);
  Booking.exists.mockResolvedValue(false);
  Booking.findOneAndUpdate.mockImplementation(async () => ({ ...booking, status: 'DRIVER_EN_ROUTE' }));
  preparePickup.mockResolvedValue({ route: { durationMinutes: 20, distanceKm: 10 } });
});
it('allows preview immediately after assignment without starting a ride', async () => {
  booking.scheduledStartAt = new Date(Date.now() + 86400000);
  const response = await request(app).post(`/trips/${id}/pickup-preview`).send(location());
  expect(response.status).toBe(200);
  expect(response.body.data.trip.canStartPickup).toBe(false);
  expect(response.body.data.preparation.route.durationMinutes).toBe(20);
  expect(Booking.findOne).toHaveBeenCalledWith(expect.objectContaining({ currentDriverId: 'driver' }));
  expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
});
it('rejects starting before the ETA plus buffer window', async () => {
  booking.scheduledStartAt = new Date(Date.now() + 60 * 60000);
  const response = await request(app).post(`/trips/${id}/en-route`).send(location());
  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('SCHEDULED_RIDE_TOO_EARLY');
  expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
});
it.each(['DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'])('previews an immediate ride in %s without changing its status', async (status) => {
  booking.timing = 'NOW';
  booking.status = status;
  const response = await request(app).post(`/trips/${id}/pickup-preview`).send(location());
  expect(response.status).toBe(200);
  expect(response.body.data.trip.status).toBe(status);
  const query = Booking.findOne.mock.calls[0][0];
  expect(query).not.toHaveProperty('timing');
  expect(query.status.$in).toContain(status);
  expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
});
it('starts within the window only after a forced ETA recalculation', async () => {
  const response = await request(app).post(`/trips/${id}/en-route`).send(location());
  expect(response.status).toBe(200);
  expect(preparePickup).toHaveBeenCalledWith(booking, expect.anything(), expect.anything(), { force: true });
  expect(response.body.data.trip.status).toBe('DRIVER_EN_ROUTE');
});
it('keeps offline previews available but rejects offline start', async () => {
  expect((await request(app).post(`/trips/${id}/pickup-preview`).set('test-offline', '1').send(location())).body.data.onlineRequired).toBe(true);
  const response = await request(app).post(`/trips/${id}/en-route`).set('test-offline', '1').send(location());
  expect(response.body.error.code).toBe('DRIVER_OFFLINE');
  expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
});
it('does not start overdue rides', async () => {
  booking.scheduledStartAt = new Date(Date.now() - 60000);
  const response = await request(app).post(`/trips/${id}/en-route`).send(location());
  expect(response.body.error.code).toBe('SCHEDULED_PICKUP_OVERDUE');
  expect(preparePickup).not.toHaveBeenCalled();
});
it('does not start a second pickup while another trip is active', async () => {
  Booking.exists.mockResolvedValue(true);
  const response = await request(app).post(`/trips/${id}/en-route`).send(location());
  expect(response.body.error.code).toBe('DRIVER_ON_TRIP');
  expect(preparePickup).not.toHaveBeenCalled();
});
