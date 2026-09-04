import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../rides/screens/ride_history_screen.dart';
import '../../registration/screens/driver_registration_screen.dart';

const _headingStyle = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

class TodayOverview extends StatelessWidget {
  const TodayOverview({super.key});
  static const items = [
    (Icons.work_outline_rounded, 'Trips Completed', '6', AppColors.blue),
    (Icons.route_rounded, 'Distance Travelled', '42 km', AppColors.green),
    (Icons.currency_rupee_rounded, 'Earnings', '₹892', AppColors.orange),
    (Icons.star_outline_rounded, 'Rating', '4.8', Color(0xFF8A42DC)),
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text('Today’s Overview', style: _headingStyle),
            Spacer(),
            Text(
              'See All',
              style: TextStyle(
                color: AppColors.blue,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(width: 2),
            Icon(Icons.chevron_right_rounded, color: AppColors.blue, size: 17),
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

class NextTripCard extends StatelessWidget {
  const NextTripCard({super.key});
  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Next Trip', style: _headingStyle),
            Spacer(),
            _StatusChip('1 Upcoming'),
          ],
        ),
        SizedBox(height: 12),
        Row(
          children: [
            _TimeBox(),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Indiranagar 100 Feet Road',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Near Metro Station',
                    style: TextStyle(color: AppColors.muted, fontSize: 10),
                  ),
                  SizedBox(height: 8),
                  Text(
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
            SizedBox(width: 6),
            Tooltip(
              message: 'Fare is shown after trip completion',
              child: Icon(
                Icons.lock_outline_rounded,
                color: AppColors.muted,
                size: 19,
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ],
    ),
  );
}

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});
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
            onTap: () {
              if (i == 2) {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const RideHistoryScreen(),
                  ),
                );
              }
            },
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

class RegistrationReviewCard extends StatelessWidget {
  const RegistrationReviewCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: const Color(0xFFF4FAF6),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFCFE9D7)),
    ),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 21,
          backgroundColor: Color(0xFFE1F4E7),
          child: Icon(Icons.assignment_ind_outlined, color: AppColors.green),
        ),
        const SizedBox(width: 11),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Review Driver Registration',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Temporary preview of the onboarding flow',
                style: TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const DriverRegistrationScreen(),
            ),
          ),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.green,
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
          ),
          child: const Text(
            'Open',
            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800),
          ),
        ),
      ],
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
  const _TimeBox();
  @override
  Widget build(BuildContext context) => Container(
    width: 60,
    height: 63,
    decoration: BoxDecoration(
      color: const Color(0xFFF0F6FF),
      borderRadius: BorderRadius.circular(11),
    ),
    child: const Center(
      child: Text(
        '11:30\nAM',
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
