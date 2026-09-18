export function scheduledPickupState(booking, now = Date.now(), etaMinutes = null) {
  const pending = ['ASSIGNED', 'DRIVER_ACCEPTED'].includes(booking.status);
  if (booking.timing !== 'SCHEDULED') return { canStartPickup: pending, pickupOverdue: false };
  const pickupAt = new Date(booking.scheduledStartAt).getTime();
  const awaitingPickup = ['NEW', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_ACCEPTED'].includes(booking.status);
  const pickupOverdue = awaitingPickup && Number.isFinite(pickupAt) && now >= pickupAt;
  const etaAvailable = Number.isFinite(etaMinutes) && etaMinutes >= 0;
  const recommendedDepartureAt = etaAvailable && Number.isFinite(pickupAt) ? new Date(pickupAt - (Math.ceil(etaMinutes) + 15) * 60000) : null;
  return {
    canStartPickup: pending && etaAvailable && recommendedDepartureAt !== null && now >= recommendedDepartureAt.getTime() && now < pickupAt,
    pickupOverdue,
    recommendedDepartureAt,
    etaRefreshRequired: pending && !pickupOverdue && !etaAvailable,
  };
}
