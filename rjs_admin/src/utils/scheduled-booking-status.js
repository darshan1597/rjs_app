export function isPickupOverdue(booking, now = Date.now()) {
  if (booking.timing !== 'SCHEDULED' || !['NEW', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_ACCEPTED'].includes(booking.status)) return false;
  const pickupAt = new Date(booking.scheduledStartAt).getTime();
  return booking.pickupOverdue === true || (Number.isFinite(pickupAt) && now >= pickupAt);
}
