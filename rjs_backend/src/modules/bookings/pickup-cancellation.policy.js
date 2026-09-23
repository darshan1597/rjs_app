export const IMMEDIATE_PICKUP_FALLBACK_MINUTES = 30;
export const PICKUP_LATE_BUFFER_MINUTES = 15;
export const CUSTOMER_NO_SHOW_WAIT_MINUTES = 10;

const pendingPickupStatuses = new Set(['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE']);

export function immediatePickupDueAt(acceptedAt, etaMinutes) {
  const minutes = Number.isFinite(etaMinutes) && etaMinutes >= 0
    ? Math.ceil(etaMinutes) + PICKUP_LATE_BUFFER_MINUTES
    : IMMEDIATE_PICKUP_FALLBACK_MINUTES;
  return new Date(new Date(acceptedAt).getTime() + minutes * 60000);
}

export function pickupCancellationState(booking, now = Date.now()) {
  if (!booking.currentDriverId || !pendingPickupStatuses.has(booking.status)) {
    return { canCancelLatePickup: false, pickupDueAt: null };
  }
  const accepted = [...(booking.statusHistory || [])].reverse().find((entry) =>
    ['DRIVER_ACCEPTED', 'ASSIGNED'].includes(entry.status));
  const dueAt = booking.timing === 'SCHEDULED'
    ? booking.scheduledStartAt
    : booking.pickupDueAt || (accepted?.changedAt ? immediatePickupDueAt(accepted.changedAt) : null);
  const dueTime = new Date(dueAt).getTime();
  return {
    canCancelLatePickup: dueAt != null && Number.isFinite(dueTime) && now >= dueTime,
    pickupDueAt: dueAt || null,
  };
}

export function customerNoShowState(booking, now = Date.now()) {
  const arrivedAt = new Date(booking.arrivedAt).getTime();
  const noShowAvailableAt = booking.status === 'ARRIVED' && Number.isFinite(arrivedAt)
    ? new Date(arrivedAt + CUSTOMER_NO_SHOW_WAIT_MINUTES * 60000)
    : null;
  return {
    canMarkCustomerNoShow: noShowAvailableAt != null && now >= noShowAvailableAt.getTime(),
    noShowAvailableAt,
  };
}
