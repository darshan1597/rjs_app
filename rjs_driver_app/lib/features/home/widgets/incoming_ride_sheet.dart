import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class IncomingRideSheet extends StatefulWidget {
  const IncomingRideSheet({
    required this.offer,
    required this.onAccept,
    required this.onReject,
    super.key,
  });

  final Map<String, dynamic> offer;
  final Future<void> Function() onAccept;
  final Future<void> Function() onReject;

  @override
  State<IncomingRideSheet> createState() => _IncomingRideSheetState();
}

class _IncomingRideSheetState extends State<IncomingRideSheet> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pickup = widget.offer['pickup'] as Map<String, dynamic>? ?? const {};
    final distance = widget.offer['estimatedDistanceKm'];
    final duration = widget.offer['durationMinutes'];
    final passengers = widget.offer['passengerCount'] ?? 1;
    final variant = (widget.offer['vehicleVariant'] ?? 'Ride')
        .toString()
        .replaceAll('_', ' ');

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD5DAE2),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Color(0xFFE8F7ED),
                  child: Icon(Icons.local_taxi_rounded, color: AppColors.green),
                ),
                SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'New ride request',
                        style: TextStyle(
                          color: AppColors.navy,
                          fontSize: 21,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'A customer near you needs a ride',
                        style: TextStyle(color: AppColors.muted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(17),
              decoration: BoxDecoration(
                color: const Color(0xFFF4FBF7),
                border: Border.all(color: const Color(0xFFDCEFE2)),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'PICKUP',
                    style: TextStyle(
                      color: AppColors.green,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .8,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.location_on_rounded,
                        color: AppColors.green,
                        size: 23,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          pickup['address']?.toString() ?? 'Pickup location',
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 16,
                            height: 1.25,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _Detail(
                        icon: Icons.route_rounded,
                        text: distance == null
                            ? 'Distance updating'
                            : '$distance km',
                      ),
                      _Detail(
                        icon: Icons.schedule_rounded,
                        text: duration == null
                            ? 'Time updating'
                            : '$duration min',
                      ),
                      _Detail(
                        icon: Icons.person_outline_rounded,
                        text:
                            '$passengers passenger${passengers == 1 ? '' : 's'}',
                      ),
                      _Detail(
                        icon: Icons.directions_car_outlined,
                        text: variant,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Row(
              children: [
                Icon(
                  Icons.lock_outline_rounded,
                  color: AppColors.muted,
                  size: 18,
                ),
                SizedBox(width: 7),
                Expanded(
                  child: Text(
                    'Destination and fare are shown only at the appropriate trip stage.',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _busy ? null : () => _run(widget.onReject),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 53),
                      foregroundColor: AppColors.red,
                      side: const BorderSide(color: Color(0xFFFFCDD1)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                    child: const Text(
                      'Reject',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: _busy ? null : () => _run(widget.onAccept),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 53),
                      backgroundColor: AppColors.green,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                    child: Text(
                      _busy ? 'Please wait...' : 'Accept Ride',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppColors.green, size: 16),
        const SizedBox(width: 5),
        Text(
          text,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}
