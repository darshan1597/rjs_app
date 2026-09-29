import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

const _headingStyle = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

class TodayOverview extends StatelessWidget {
  const TodayOverview({super.key, required this.data, required this.onSeeAll});
  final Map<String, dynamic>? data;
  final VoidCallback onSeeAll;

  String _number(Object? value, {int decimals = 0}) {
    final number = value as num?;
    return number == null ? '—' : number.toStringAsFixed(decimals);
  }

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        Icons.work_outline_rounded,
        'Trips Completed',
        _number(data?['completedTrips']),
        AppColors.blue,
      ),
      (
        Icons.route_rounded,
        'Distance Travelled',
        '${_number(data?['distanceKm'], decimals: 1)} km',
        AppColors.green,
      ),
      (
        Icons.currency_rupee_rounded,
        'Confirmed Fare',
        '₹${_number(data?['earnings'])}',
        AppColors.orange,
      ),
      (
        Icons.star_outline_rounded,
        'Rating',
        _number(data?['rating'], decimals: 1),
        const Color(0xFF8A42DC),
      ),
    ];
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Today’s Overview', style: _headingStyle),
              const Spacer(),
              InkWell(
                onTap: onSeeAll,
                child: const Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        color: AppColors.blue,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      color: AppColors.blue,
                      size: 17,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          Row(
            children: List.generate(
              items.length,
              (i) => Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    border: i == items.length - 1
                        ? null
                        : const Border(
                            right: BorderSide(color: AppColors.border),
                          ),
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 17,
                        backgroundColor: items[i].$4.withValues(alpha: .09),
                        child: Icon(items[i].$1, color: items[i].$4, size: 18),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        items[i].$2,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 8.5,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        items[i].$3,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class NextTripCard extends StatelessWidget {
  const NextTripCard({
    super.key,
    required this.trip,
    required this.upcomingCount,
    required this.onTap,
  });
  final Map<String, dynamic>? trip;
  final int upcomingCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Next Trip', style: _headingStyle),
            const Spacer(),
            _StatusChip('$upcomingCount Upcoming'),
          ],
        ),
        const SizedBox(height: 12),
        if (trip == null)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 9),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: Color(0xFFF0F6FF),
                  child: Icon(
                    Icons.event_available_outlined,
                    color: AppColors.blue,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No upcoming scheduled trips',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  _TimeBox(trip!['scheduledStartAt']),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (trip!['pickup'] as Map?)?['address']?.toString() ??
                              'Pickup location',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${trip!['vehicleVariant']?.toString().replaceAll('_', ' ') ?? 'Vehicle'} · ${trip!['bookingNumber'] ?? ''}',
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Destination available after trip starts',
                          style: TextStyle(
                            color: AppColors.navy,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Tooltip(
                    message: 'Fare is shown after trip completion',
                    child: Icon(
                      Icons.lock_outline_rounded,
                      color: AppColors.muted,
                      size: 19,
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.muted,
                  ),
                ],
              ),
            ),
          ),
      ],
    ),
  );
}

class QuickActions extends StatelessWidget {
  const QuickActions({
    required this.onLocation,
    required this.onEarnings,
    required this.onHistory,
    required this.onEmergency,
    super.key,
  });
  final VoidCallback onLocation;
  final VoidCallback onEarnings;
  final VoidCallback onHistory;
  final VoidCallback onEmergency;
  static const items = [
    (Icons.navigation_rounded, 'Go to Location', AppColors.blue),
    (Icons.account_balance_wallet_rounded, 'My Earnings', AppColors.green),
    (Icons.history_rounded, 'Ride History', AppColors.orange),
    (Icons.sos_rounded, 'Emergency', AppColors.red),
  ];

  @override
  Widget build(BuildContext context) => Row(
    children: List.generate(
      items.length,
      (i) => Expanded(
        child: Padding(
          padding: EdgeInsets.only(right: i == items.length - 1 ? 0 : 7),
          child: InkWell(
            borderRadius: BorderRadius.circular(13),
            onTap: [onLocation, onEarnings, onHistory, onEmergency][i],
            child: Container(
              height: 84,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 19,
                    backgroundColor: items[i].$3.withValues(alpha: .09),
                    child: Icon(items[i].$1, color: items[i].$3, size: 20),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    items[i].$2,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: items[i].$3,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 13,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: child,
  );
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: AppColors.green.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.green,
          fontSize: 8.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

class _TimeBox extends StatelessWidget {
  const _TimeBox(this.value);
  final Object? value;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = date == null ? null : DateTime(date.year, date.month, date.day);
    final dayLabel = day == today
        ? 'Today'
        : day == today.add(const Duration(days: 1))
        ? 'Tomorrow'
        : date == null
        ? '--'
        : '${date.day}/${date.month}';
    final timeLabel = date == null
        ? '--'
        : TimeOfDay.fromDateTime(date).format(context);
    return Container(
      width: 60,
      height: 63,
      decoration: BoxDecoration(
        color: const Color(0xFFF0F6FF),
        borderRadius: BorderRadius.circular(11),
      ),
      child: Center(
        child: Text(
          '$dayLabel\n$timeLabel',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.blue,
            fontSize: 12,
            height: 1.35,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
