import { AppError } from '../../common/errors/app-error.js';
import { computeRoute } from '../maps/maps.service.js';
import { scheduledPickupState } from './scheduled-pickup-policy.js';
import { createSingleFlight } from '../../common/single-flight.js';
import { Booking } from './booking.model.js';

const flight = createSingleFlight();
export const PICKUP_ETA_CACHE_MS = 5 * 60000;
export function preparationIsFresh(preparation, driverId, now = Date.now()) {
  const age = now - new Date(preparation?.checkedAt).getTime();
  return String(preparation?.driverId) === String(driverId) && age >= 0 && age < PICKUP_ETA_CACHE_MS && Number.isFinite(preparation?.route?.durationMinutes);
}
export function pickupPreparationState(booking, driverId, now = Date.now()) {
  const preparation = booking.pickupPreparation;
  return scheduledPickupState(booking, now, preparationIsFresh(preparation, driverId, now) ? preparation.route.durationMinutes : null);
}
export function movedMetres(first, second) {
  const rad = (n) => n * Math.PI / 180;
  const value = Math.sin(rad(second.latitude - first.latitude) / 2) ** 2
    + Math.cos(rad(first.latitude)) * Math.cos(rad(second.latitude)) * Math.sin(rad(second.longitude - first.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
}
export async function preparePickup(booking, driver, location, { force = false } = {}) {
  const age = Date.now() - new Date(location?.recordedAt).getTime();
  if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude) || !Number.isFinite(age) || age < -30000 || age > 120000) {
    throw new AppError(422, 'FRESH_LOCATION_REQUIRED', 'Refresh your current location to check pickup availability');
  }
  const cached = booking.pickupPreparation;
  if (!force && preparationIsFresh(cached, driver.id) && movedMetres(cached.origin, location) < 250) return cached;
  return flight(`${booking.id}:${driver.id}:${force ? 'start' : 'preview'}`, async () => {
    const route = await computeRoute({ origin: { latitude: location.latitude, longitude: location.longitude }, destination: { latitude: booking.pickup.latitude, longitude: booking.pickup.longitude } });
    const preparation = { driverId: driver.id, origin: { latitude: location.latitude, longitude: location.longitude }, route, checkedAt: new Date() };
    const updated = await Booking.updateOne({ _id: booking._id, currentDriverId: driver._id, status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'] } }, { $set: { pickupPreparation: preparation } });
    if (!updated.matchedCount) throw new AppError(409, 'PICKUP_PREVIEW_UNAVAILABLE', 'The assignment changed. Refresh your scheduled rides');
    return preparation;
  });
}
