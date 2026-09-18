import { vi } from 'vitest';
vi.mock('../src/modules/maps/maps.service.js', () => ({ computeRoute: vi.fn() }));
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { updateOne: vi.fn() } }));
import { computeRoute } from '../src/modules/maps/maps.service.js';
import { Booking } from '../src/modules/bookings/booking.model.js';
import { preparePickup, preparationIsFresh, pickupPreparationState } from '../src/modules/bookings/pickup-preparation.service.js';
const now = Date.now();
const route = { durationMinutes: 20, distanceKm: 10, encodedPolyline: '' };
const driver = { id: 'driver', _id: 'driver' };
const location = () => ({ latitude: 12, longitude: 77, recordedAt: new Date() });
const booking = () => ({ id: 'booking', _id: 'booking', timing: 'SCHEDULED', status: 'ASSIGNED', scheduledStartAt: new Date(now + 30 * 60000), pickup: { latitude: 13, longitude: 78 }, pickupPreparation: { driverId: driver.id, origin: location(), route, checkedAt: new Date() } });
beforeEach(() => { vi.clearAllMocks(); computeRoute.mockResolvedValue(route); Booking.updateOne.mockResolvedValue({ matchedCount: 1 }); });
it('reuses a recent nearby ETA without a Google call or GPS database write', async () => {
  await preparePickup(booking(), driver, location());
  expect(computeRoute).not.toHaveBeenCalled();
  expect(Booking.updateOne).not.toHaveBeenCalled();
});
it('refreshes after significant movement', async () => {
  await preparePickup(booking(), driver, { ...location(), latitude: 12.01 });
  expect(computeRoute).toHaveBeenCalledTimes(1);
});
it('forces a new ETA when starting pickup', async () => {
  await preparePickup(booking(), driver, location(), { force: true });
  expect(computeRoute).toHaveBeenCalledTimes(1);
});
it('rejects stale GPS instead of making an inaccurate start decision', async () => {
  await expect(preparePickup(booking(), driver, { ...location(), recordedAt: new Date(Date.now() - 180000) })).rejects.toMatchObject({ code: 'FRESH_LOCATION_REQUIRED' });
  expect(computeRoute).not.toHaveBeenCalled();
});
it('does not use an expired estimate or one belonging to a previous driver', () => {
  expect(preparationIsFresh({ ...booking().pickupPreparation, checkedAt: new Date(now - 300000) }, driver.id, now)).toBe(false);
  expect(preparationIsFresh(booking().pickupPreparation, 'different-driver')).toBe(false);
  expect(pickupPreparationState(booking(), 'different-driver').canStartPickup).toBe(false);
});
