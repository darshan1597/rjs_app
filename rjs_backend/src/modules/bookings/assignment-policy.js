const assignableBookingStatuses = ['NEW', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_ACCEPTED'];

function canAssignBooking(status) {
  return assignableBookingStatuses.includes(status);
}

export { assignableBookingStatuses, canAssignBooking };
