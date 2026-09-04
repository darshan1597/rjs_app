import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';

class ScheduledRidesScreen extends StatefulWidget {
  const ScheduledRidesScreen({super.key});

  @override
  State<ScheduledRidesScreen> createState() => _ScheduledRidesScreenState();
}

class _ScheduledRidesScreenState extends State<ScheduledRidesScreen> {
  bool _isOnline = true;

  static const _rides = [
    _ScheduledRide(
      '10:15\nAM',
      '24 May',
      'Koramangala 4th Block',
      'Near Forum Mall, Bengaluru',
      '18.2 km',
      '10:15 AM',
      'Darshan',
      '4.8',
    ),
    _ScheduledRide(
      '01:45\nPM',
      '24 May',
      'Indiranagar 100 Feet Road',
      'Near Metro Station',
      '12.6 km',
      '01:45 PM',
      'Rahul',
      '4.6',
    ),
    _ScheduledRide(
      '05:00\nPM',
      '24 May',
      'BTM Layout 2nd Stage',
      'Near Water Tank',
      '9.8 km',
      '05:00 PM',
      'Meena',
      '4.7',
    ),
    _ScheduledRide(
      '09:30\nAM',
      '25 May',
      'JP Nagar 7th Phase',
      'Near Capital School',
      '14.3 km',
      '09:30 AM',
      'Suresh',
      '4.5',
    ),
  ];

  void _selectTab(int index) {
    final Widget? page = switch (index) {
      0 => const DriverHomeScreen(),
      3 => const EarningsScreen(),
      4 => const DriverProfileScreen(),
      _ => null,
    };
    if (page != null) {
      Navigator.of(context)
          .pushReplacement(MaterialPageRoute<void>(builder: (_) => page));
    }
  }

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
    child: Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const SliverPadding(
              padding: EdgeInsets.fromLTRB(18, 8, 17, 15),
              sliver: SliverToBoxAdapter(child: _TripsHeader()),
            ),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                15,
                0,
                15,
                20 + MediaQuery.paddingOf(context).bottom,
              ),
              sliver: SliverList.list(
                children: [
                  const _UpcomingBanner(),
                  const SizedBox(height: 15),
                  const _DateHeading('Today  ·  24 May 2025'),
                  const SizedBox(height: 9),
                  ..._rides
                      .take(3)
                      .expand(
                        (ride) => [
                          _ScheduledRideCard(ride),
                          const SizedBox(height: 10),
                        ],
                      ),
                  const _DateHeading('Tomorrow  ·  25 May 2025'),
                  const SizedBox(height: 9),
                  _ScheduledRideCard(_rides.last),
                  const SizedBox(height: 11),
                  const _NoteCard(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: DriverBottomBar(
        selectedIndex: 1,
        isOnline: _isOnline,
        onSelected: _selectTab,
        onStatusTap: () => setState(() => _isOnline = !_isOnline),
      ),
    ),
  );
}

class _TripsHeader extends StatelessWidget {
  const _TripsHeader();
  @override
  Widget build(BuildContext context) => const Row(
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Scheduled Rides',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Your upcoming scheduled rides',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
      ),
      DriverHeaderActions(),
    ],
  );
}

class _UpcomingBanner extends StatelessWidget {
  const _UpcomingBanner();
  @override
  Widget build(BuildContext context) => Container(
    height: 94,
    padding: const EdgeInsets.fromLTRB(15, 12, 12, 12),
    decoration: BoxDecoration(
      color: const Color(0xFFF5FCF7),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFCFE9D7)),
    ),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 25,
          backgroundColor: Color(0xFFE4F6EA),
          child: Icon(
            Icons.calendar_month_rounded,
            color: AppColors.green,
            size: 27,
          ),
        ),
        const SizedBox(width: 13),
        const Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upcoming Scheduled Rides',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 5),
              Text(
                'These are the rides assigned to you in advance.',
                style: TextStyle(color: AppColors.muted, fontSize: 9.5),
              ),
            ],
          ),
        ),
        SizedBox(
          width: 92,
          child: Stack(
            alignment: Alignment.centerRight,
            children: [
              Positioned(
                right: 34,
                child: Image.asset(
                  'assets/images/driver-auto-thumbnail.png',
                  width: 65,
                  height: 58,
                  fit: BoxFit.contain,
                ),
              ),
              const Positioned(
                right: 0,
                child: CircleAvatar(
                  radius: 22,
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.event_available_rounded,
                    color: AppColors.green,
                    size: 27,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _DateHeading extends StatelessWidget {
  const _DateHeading(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: AppColors.navy,
      fontSize: 11.5,
      fontWeight: FontWeight.w800,
    ),
  );
}

class _ScheduledRideCard extends StatelessWidget {
  const _ScheduledRideCard(this.ride);
  final _ScheduledRide ride;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(11),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 13,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 58,
          child: Column(
            children: [
              Text(
                ride.time,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.green,
                  fontSize: 15,
                  height: 1.25,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                ride.date,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
              const SizedBox(height: 67),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.green.withValues(alpha: .09),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Scheduled',
                  style: TextStyle(
                    color: AppColors.green,
                    fontSize: 7.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 145, child: VerticalDivider()),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '●  Pickup',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                ride.pickup,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                ride.note,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 9),
              ),
              const SizedBox(height: 12),
              const Text(
                'Drop (After Trip Starts)  🔒',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              const Text(
                'Destination will be available',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Text(
                'after OTP verification',
                style: TextStyle(color: AppColors.muted, fontSize: 9),
              ),
              const Divider(height: 22),
              Row(
                children: [
                  const CircleAvatar(
                    radius: 12,
                    backgroundColor: Color(0xFFEAF7EF),
                    child: Icon(
                      Icons.person_outline_rounded,
                      color: AppColors.green,
                      size: 15,
                    ),
                  ),
                  const SizedBox(width: 7),
                  Text(
                    ride.customer,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Icon(
                    Icons.star_rounded,
                    color: Color(0xFFFFB000),
                    size: 16,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    ride.rating,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 9.5,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 65,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                width: 65,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FAF3),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.lock_outline_rounded,
                      color: AppColors.muted,
                      size: 18,
                    ),
                    const Text(
                      'After trip',
                      style: TextStyle(color: AppColors.muted, fontSize: 8),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 13),
              Text(
                ride.distance,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Text(
                'Est. Distance',
                style: TextStyle(color: AppColors.muted, fontSize: 7.5),
              ),
              const SizedBox(height: 14),
              Text(
                ride.pickupTime,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Text(
                'Pickup Time',
                style: TextStyle(color: AppColors.muted, fontSize: 7.5),
              ),
              const SizedBox(height: 24),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.navy,
                size: 21,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _NoteCard extends StatelessWidget {
  const _NoteCard();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
    decoration: BoxDecoration(
      color: const Color(0xFFF7FCF9),
      borderRadius: BorderRadius.circular(11),
      border: Border.all(color: const Color(0xFFCFE9D7)),
    ),
    child: const Row(
      children: [
        Icon(Icons.info_outline_rounded, color: AppColors.green, size: 17),
        SizedBox(width: 9),
        Text(
          'Note',
          style: TextStyle(
            color: AppColors.green,
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        SizedBox(width: 6),
        Expanded(
          child: Text(
            'Destination details will be shared after you start the trip.',
            style: TextStyle(color: AppColors.muted, fontSize: 8.5),
          ),
        ),
      ],
    ),
  );
}

class _ScheduledRide {
  const _ScheduledRide(
    this.time,
    this.date,
    this.pickup,
    this.note,
    this.distance,
    this.pickupTime,
    this.customer,
    this.rating,
  );
  final String time;
  final String date;
  final String pickup;
  final String note;
  final String distance;
  final String pickupTime;
  final String customer;
  final String rating;
}
