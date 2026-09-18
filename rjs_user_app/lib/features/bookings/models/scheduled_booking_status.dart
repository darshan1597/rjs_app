bool isScheduledPickupOverdue(Map<String, dynamic> booking, {DateTime? now}) {
  if (booking['timing'] != 'SCHEDULED' ||
      !{
        'NEW',
        'PAYMENT_CONFIRMED',
        'ASSIGNMENT_PENDING',
        'ASSIGNED',
        'DRIVER_ACCEPTED',
      }.contains(booking['status']))
    return false;
  if (booking['pickupOverdue'] == true) return true;
  final pickupAt = DateTime.tryParse(
    booking['scheduledStartAt']?.toString() ?? '',
  );
  return pickupAt != null && !pickupAt.isAfter(now ?? DateTime.now());
}
