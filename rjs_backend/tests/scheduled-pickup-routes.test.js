import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../src/modules/drivers/driver-auth.middleware.js', () => ({ authenticateDriver: (req, res, next) => { req.driver = { id: 'driver', _id: 'driver', operationalStatus: req.get('test-offline') ? 'OFFLINE' : 'ONLINE', save: vi.fn() }; next(); } }));
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: {
  findOne: vi.fn(), exists: vi.fn(), findOneAndUpdate: vi.fn(),
  find: vi.fn(), aggregate: vi.fn(), countDocuments: vi.fn(),
} }));
vi.mock('../src/modules/bookings/pickup-preparation.service.js', () => ({ preparePickup: vi.fn(), pickupPreparationState: () => ({ canStartPickup: false }) }));
vi.mock('../src/modules/customers/customer-push.service.js', () => ({ sendCustomerBookingPush: vi.fn().mockResolvedValue({ sent: 0 }) }));
import { Booking } from '../src/modules/bookings/booking.model.js';
import { preparePickup } from '../src/modules/bookings/pickup-preparation.service.js';
import { driverTripRouter } from '../src/modules/drivers/driver-trip.routes.js';
import { DriverPayout } from '../src/modules/payments/payment.model.js';
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
it('returns live home overview totals and the earliest upcoming trip', async () => {
  Booking.aggregate.mockResolvedValue([{ completedTrips: 3, distanceKm: 27.36, confirmedEarnings: 640, rating: 4.64 }]);
  Booking.countDocuments.mockResolvedValue(2);
  Booking.findOne.mockReturnValue({ sort: () => ({ select: () => ({ lean: async () => ({
    _id: id,
    bookingNumber: 'RJS123456',
    pickup: { address: 'MG Road' },
    requestedVehicleVariant: 'SEDAN',
    scheduledStartAt: new Date(Date.now() + 3600000),
    status: 'ASSIGNED',
  }) }) }) });
  const response = await request(app).get('/trips/dashboard');
  expect(response.status).toBe(200);
  expect(response.body.data.today).toEqual({ completedTrips: 3, distanceKm: 27.4, earnings: 640, rating: 4.6 });
  expect(response.body.data.upcomingCount).toBe(2);
  expect(response.body.data.nextTrip.bookingNumber).toBe('RJS123456');
});
it('returns dynamic earnings periods, breakup, transactions and payout', async () => {
  Booking.aggregate
    .mockResolvedValueOnce([{ _id: 5, amount: 400 }, { _id: 6, amount: 600 }])
    .mockResolvedValueOnce([{ completedTrips: 2, distanceKm: 18.25, tripEarnings: 600 }])
    .mockResolvedValueOnce([{ earnings: 400 }])
    .mockResolvedValueOnce([{ earnings: 12450 }]);
  Booking.find.mockReturnValue({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [{
    _id: id,
    pickup: { address: 'MG Road' },
    destination: { address: 'Airport' },
    totalAmount: 600,
    completedAt: new Date(),
  }] }) }) }) });
  vi.spyOn(DriverPayout, 'aggregate').mockResolvedValue([{ incentives: 50, deductions: 10 }]);
  vi.spyOn(DriverPayout, 'findOne').mockReturnValue({ sort: () => ({ select: () => ({ lean: async () => ({
    status: 'PENDING', netPayout: 640, periodEnd: new Date(),
  }) }) }) });
  const response = await request(app).get('/trips/earnings?period=DAILY');
  expect(response.status).toBe(200);
  expect(response.body.data.today).toMatchObject({ earnings: 640, totalEarnings: 12450, completedTrips: 2, distanceKm: 18.3, changePercent: 50 });
  expect(response.body.data.overview.current).toBe(600);
  expect(response.body.data.breakup).toEqual({ total: 640, tripEarnings: 600, incentives: 50, deductions: 10 });
  expect(response.body.data.transactions[0]).toMatchObject({ title: 'MG Road → Airport', amount: 600 });
  expect(response.body.data.payout).toMatchObject({ status: 'PENDING', amount: 640 });
});
it('returns dynamic driver profile performance', async () => {
  Booking.aggregate.mockResolvedValue([{
    allCompleted: [{ count: 128, averageRating: 4.82 }],
    monthlyCompleted: [{ trips: 28, distanceKm: 312.46, averageRating: 4.74 }],
    monthlyAccepted: [{ count: 49 }],
    monthlyRejected: [{ count: 1 }],
  }]);
  const response = await request(app).get('/trips/profile-summary');
  expect(response.status).toBe(200);
  expect(response.body.data).toEqual({
    totalTrips: 128,
    averageRating: 4.8,
    thisMonth: {
      completedTrips: 28,
      distanceKm: 312.5,
      averageRating: 4.7,
      acceptanceRate: 98,
    },
  });
});
it('returns terminal ride history and monthly summary', async () => {
  Booking.find.mockReturnValue({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [{
    _id: id,
    bookingNumber: 'RJS-HISTORY',
    pickup: { address: 'MG Road' },
    destination: { address: 'Airport' },
    status: 'COMPLETED',
    totalAmount: 725,
    estimatedDistanceKm: 18.26,
    paymentMethod: 'UPI',
    completedAt: new Date(),
  }] }) }) }) });
  Booking.aggregate.mockResolvedValue([{ totalRides: 3, completed: 1, cancelled: 1, noShow: 1, earnings: 725 }]);
  const response = await request(app).get('/trips/history?status=ALL');
  expect(response.status).toBe(200);
  expect(response.body.data.summary).toMatchObject({ totalRides: 3, completed: 1, cancelled: 1, noShow: 1, earnings: 725 });
  expect(response.body.data.rides[0]).toMatchObject({ bookingNumber: 'RJS-HISTORY', amount: 725, distanceKm: 18.3, paymentMethod: 'UPI' });
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
