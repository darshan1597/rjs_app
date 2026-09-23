import { Booking } from './booking.model.js';
import { Driver } from '../drivers/driver.model.js';

export async function releaseDriverAfterPickupEnds(driverId) {
  if (!driverId) return;
  const busy = await Booking.exists({
    currentDriverId: driverId,
    status: { $in: ['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
  });
  if (!busy) {
    await Driver.updateOne(
      { _id: driverId, operationalStatus: 'ON_TRIP' },
      { $set: { operationalStatus: 'ONLINE' } },
    );
  }
}
