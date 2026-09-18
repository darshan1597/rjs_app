import '../lib/features/bookings/models/scheduled_booking_status.dart';

void main() {
  final pickupAt = DateTime.parse('2026-09-18T09:45:00Z');
  final later = DateTime.parse('2026-09-18T11:50:00Z');
  final booking = <String, dynamic>{
    'timing': 'SCHEDULED',
    'status': 'ASSIGNED',
    'scheduledStartAt': pickupAt.toIso8601String(),
  };
  assert(
    !isScheduledPickupOverdue(
      booking,
      now: pickupAt.subtract(const Duration(seconds: 1)),
    ),
  );
  assert(isScheduledPickupOverdue(booking, now: pickupAt));
  assert(isScheduledPickupOverdue(booking, now: later));
  for (final status in [
    'NEW',
    'PAYMENT_CONFIRMED',
    'ASSIGNMENT_PENDING',
    'DRIVER_ACCEPTED',
  ]) {
    assert(
      isScheduledPickupOverdue({...booking, 'status': status}, now: later),
    );
  }
  for (final status in [
    'DRIVER_EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'PAYMENT_PENDING',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'NO_DRIVER_AVAILABLE',
  ]) {
    assert(
      !isScheduledPickupOverdue({
        ...booking,
        'status': status,
        'pickupOverdue': true,
      }, now: later),
    );
  }
  assert(
    !isScheduledPickupOverdue({...booking, 'timing': 'IMMEDIATE'}, now: later),
  );
  assert(
    !isScheduledPickupOverdue({
      ...booking,
      'scheduledStartAt': 'invalid',
    }, now: later),
  );
  print('Customer scheduled booking overdue checks passed.');
}
