import { scheduledPickupState } from '../src/modules/bookings/scheduled-pickup-policy.js';

const pickup = Date.parse('2026-09-18T09:45:00Z'); // 3:15 PM IST
const booking = { timing: 'SCHEDULED', status: 'ASSIGNED', scheduledStartAt: new Date(pickup) };
it('requires a fresh ETA rather than defaulting to an hour', () => {
  expect(scheduledPickupState(booking, pickup - 60000).canStartPickup).toBe(false);
  expect(scheduledPickupState(booking, pickup - 60000).etaRefreshRequired).toBe(true);
});
it('opens ETA plus 15 minutes before pickup and closes at the scheduled time', () => {
  expect(scheduledPickupState(booking, pickup - 35 * 60000 - 1, 20).canStartPickup).toBe(false);
  expect(scheduledPickupState(booking, pickup - 35 * 60000, 20).canStartPickup).toBe(true);
  expect(scheduledPickupState(booking, pickup - 1, 20).canStartPickup).toBe(true);
  expect(scheduledPickupState(booking, pickup, 20)).toMatchObject({ canStartPickup: false, pickupOverdue: true });
  expect(scheduledPickupState(booking, pickup - 60000, 20).recommendedDepartureAt.getTime()).toBe(pickup - 35 * 60000);
});
it('marks an unstarted 3:15 PM ride overdue at 5:20 PM', () => {
  expect(scheduledPickupState(booking, Date.parse('2026-09-18T11:50:00Z'))).toMatchObject({ canStartPickup: false, pickupOverdue: true });
});
it.each(['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'])('does not mark an already active %s ride overdue', (status) => {
  expect(scheduledPickupState({ ...booking, status }, pickup + 7200000).pickupOverdue).toBe(false);
});
it('does not expire immediate accepted rides', () => {
  expect(scheduledPickupState({ ...booking, timing: 'IMMEDIATE', status: 'DRIVER_ACCEPTED' }, pickup + 7200000)).toEqual({ canStartPickup: true, pickupOverdue: false });
});
it.each(['NEW', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'DRIVER_ACCEPTED'])('marks unstarted %s scheduled bookings overdue without allowing pickup', (status) => {
  expect(scheduledPickupState({ ...booking, status }, pickup)).toMatchObject({ canStartPickup: false, pickupOverdue: true });
});
it('allows earlier preparation for long-distance drivers', () => {
  expect(scheduledPickupState(booking, pickup - 105 * 60000, 90).canStartPickup).toBe(true);
});
