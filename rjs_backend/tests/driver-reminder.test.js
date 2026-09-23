import { reminderToCreate } from '../src/modules/drivers/driver-reminder.service.js';

const pickup = Date.parse('2026-09-18T09:45:00Z');
const base = {
  _id: 'booking-1',
  bookingNumber: 'RJS-123',
  timing: 'SCHEDULED',
  status: 'ASSIGNED',
  scheduledStartAt: new Date(pickup),
  currentDriverId: 'driver-1',
};

it('queues preparation at 60 minutes, not earlier', () => {
  expect(reminderToCreate(base, 'PREPARE', pickup - 61 * 60000)).toBeNull();
  expect(reminderToCreate(base, 'PREPARE', pickup - 60 * 60000)).toMatchObject({
    kind: 'PREPARE', driverId: 'driver-1', bookingId: 'booking-1',
  });
});

it('asks for a route check at 30 minutes when no fresh ETA exists', () => {
  expect(reminderToCreate(base, 'ROUTE_CHECK', pickup - 31 * 60000)).toBeNull();
  expect(reminderToCreate(base, 'ROUTE_CHECK', pickup - 30 * 60000).title).toBe('Check your pickup route now');
  expect(reminderToCreate(base, 'DEPARTURE', pickup - 30 * 60000)).toBeNull();
});

it('uses a fresh 20-minute ETA plus 15-minute buffer for departure', () => {
  const booking = { ...base, pickupPreparation: {
    driverId: 'driver-1', checkedAt: new Date(pickup - 36 * 60000), route: { durationMinutes: 20 },
  } };
  expect(reminderToCreate(booking, 'DEPARTURE', pickup - 36 * 60000)).toBeNull();
  expect(reminderToCreate(booking, 'DEPARTURE', pickup - 35 * 60000).title).toBe('Time to start toward pickup');
  const refreshed = { ...booking, pickupPreparation: { ...booking.pickupPreparation,
    checkedAt: new Date(pickup - 31 * 60000) } };
  expect(reminderToCreate(refreshed, 'ROUTE_CHECK', pickup - 30 * 60000)).toBeNull();
});

it('does not use stale or another driver\'s ETA', () => {
  const booking = { ...base, pickupPreparation: {
    driverId: 'driver-old', checkedAt: new Date(pickup - 31 * 60000), route: { durationMinutes: 20 },
  } };
  expect(reminderToCreate(booking, 'DEPARTURE', pickup - 30 * 60000)).toBeNull();
  expect(reminderToCreate(booking, 'ROUTE_CHECK', pickup - 30 * 60000)).not.toBeNull();
});

it('requests a route refresh before the departure implied by an older ETA', () => {
  const booking = { ...base, pickupPreparation: {
    driverId: 'driver-1', checkedAt: new Date(pickup - 60 * 60000), route: { durationMinutes: 20 },
  } };
  expect(reminderToCreate(booking, 'ROUTE_CHECK', pickup - 41 * 60000)).toBeNull();
  expect(reminderToCreate(booking, 'ROUTE_CHECK', pickup - 40 * 60000).kind).toBe('ROUTE_CHECK');
  expect(reminderToCreate(booking, 'DEPARTURE', pickup - 35 * 60000)).toBeNull();
});

it.each(['CANCELLED', 'COMPLETED', 'DRIVER_EN_ROUTE', 'NEW'])('skips %s rides', (status) => {
  expect(reminderToCreate({ ...base, status }, 'PREPARE', pickup - 30 * 60000)).toBeNull();
});

it('skips overdue rides and keys reminders by assignment', () => {
  expect(reminderToCreate(base, 'PREPARE', pickup)).toBeNull();
  const first = reminderToCreate(base, 'PREPARE', pickup - 30 * 60000);
  const second = reminderToCreate({ ...base, currentDriverId: 'driver-2' }, 'PREPARE', pickup - 30 * 60000);
  expect(first.key).not.toBe(second.key);
});
