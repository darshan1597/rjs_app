import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class ActiveTripCard extends StatelessWidget {
  const ActiveTripCard({
    super.key,
    required this.trip,
    required this.busy,
    required this.onAction,
  });

  final Map<String, dynamic> trip;
  final bool busy;
  final VoidCallback onAction;

  String get status => trip['status']?.toString() ?? '';

  String get actionLabel => switch (status) {
    'AWAITING_PAYMENT' => 'Waiting for Customer Payment',
    'PAYMENT_CONFIRMED' => 'Start to Pickup',
    'DRIVER_EN_ROUTE' => "I've Arrived",
    'ARRIVED' => 'Enter Trip OTP',
    'IN_PROGRESS' => 'Complete Trip',
    _ => 'Refresh Trip',
  };

  @override
  Widget build(BuildContext context) {
    final pickup = trip['pickup'] as Map<String, dynamic>? ?? const {};
    final destination = trip['destination'] as Map<String, dynamic>?;
    final customer = trip['customer'] as Map<String, dynamic>? ?? const {};
    final waiting = status == 'AWAITING_PAYMENT';
    final inProgress = status == 'IN_PROGRESS';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FCFA),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFD7E9E0)),
        boxShadow: const [BoxShadow(color: Color(0x1013365F), blurRadius: 14, offset: Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _pill(status.replaceAll('_', ' ')),
            const Spacer(),
            Text(trip['bookingNumber']?.toString() ?? '', style: const TextStyle(color: AppColors.blue, fontSize: 10, fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 14),
          const Text('Pickup', style: TextStyle(color: AppColors.green, fontSize: 10, fontWeight: FontWeight.w800)),
          const SizedBox(height: 3),
          Text(pickup['address']?.toString() ?? 'Pickup location', style: const TextStyle(color: AppColors.navy, fontSize: 15, fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          Row(children: [
            const CircleAvatar(radius: 17, backgroundColor: Color(0xFFE8F7ED), child: Icon(Icons.person_outline_rounded, color: AppColors.green)),
            const SizedBox(width: 9),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(customer['name']?.toString() ?? 'Customer', style: const TextStyle(color: AppColors.navy, fontSize: 12, fontWeight: FontWeight.w800)),
              Text(customer['phone']?.toString() ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 10)),
            ])),
            Text('${trip['estimatedDistanceKm'] ?? '--'} km', style: const TextStyle(color: AppColors.navy, fontSize: 11, fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(color: AppColors.orange.withValues(alpha: .07), borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Icon(inProgress ? Icons.location_on_rounded : Icons.lock_outline_rounded, color: inProgress ? AppColors.orange : AppColors.navy),
              const SizedBox(width: 9),
              Expanded(child: Text(
                inProgress
                    ? (destination?['address']?.toString() ?? 'Destination')
                    : waiting
                    ? 'Waiting for the customer to confirm payment'
                    : status == 'ARRIVED'
                    ? 'Ask the customer for the 6-digit trip OTP'
                    : 'Destination unlocks after OTP verification',
                style: const TextStyle(color: AppColors.navy, fontSize: 10.5, fontWeight: FontWeight.w700),
              )),
            ]),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 43,
            child: FilledButton.icon(
              onPressed: waiting || busy ? null : onAction,
              style: FilledButton.styleFrom(backgroundColor: inProgress ? AppColors.orange : AppColors.green),
              icon: busy ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Icon(inProgress ? Icons.check_circle_outline_rounded : Icons.navigation_rounded),
              label: Text(busy ? 'Updating...' : actionLabel, style: const TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(color: AppColors.green.withValues(alpha: .1), borderRadius: BorderRadius.circular(20)),
    child: Text(text, style: const TextStyle(color: AppColors.green, fontSize: 9, fontWeight: FontWeight.w800)),
  );
}
