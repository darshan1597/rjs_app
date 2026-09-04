import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';

class RideHistoryScreen extends StatefulWidget {
  const RideHistoryScreen({super.key});

  @override
  State<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends State<RideHistoryScreen> {
  int _filter = 0;
  bool _isOnline = true;

  static const _rides = [
    _RideData(
      '10:35 AM',
      '24 May 2025',
      'Koramangala 4th Block',
      'Near Forum Mall, Bengaluru',
      'HSR Layout Sector 2',
      '16th Main Road, Bengaluru',
      '₹142',
      '18.2 km',
      true,
    ),
    _RideData(
      '01:50 PM',
      '24 May 2025',
      'Indiranagar 100 Feet Road',
      'Near Metro Station',
      'Destination',
      'After Trip Started',
      '₹168',
      '12.6 km',
      true,
    ),
    _RideData(
      '05:20 PM',
      '24 May 2025',
      'BTM Layout 2nd Stage',
      'Near Water Tank',
      'Destination',
      'After Trip Started',
      '₹156',
      '9.8 km',
      true,
    ),
    _RideData(
      '08:15 PM',
      '23 May 2025',
      'Jayanagar 4th Block',
      'Near Ashoka Pillar',
      'Destination',
      'After Trip Started',
      '₹136',
      '7.4 km',
      true,
    ),
    _RideData(
      '11:30 AM',
      '23 May 2025',
      'Koramangala 6th Block',
      'Near Sony World Junction',
      'HSR Layout Sector 3',
      'Bengaluru',
      '₹0',
      'Cancelled by Customer',
      false,
    ),
  ];

  void _selectTab(int index) {
    final Widget? page = switch (index) {
      0 => const DriverHomeScreen(),
      1 => const ScheduledRidesScreen(),
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
  Widget build(BuildContext context) {
    final visible = _filter == 1
        ? _rides.where((ride) => ride.completed).toList()
        : _filter == 2
        ? _rides.where((ride) => !ride.completed).toList()
        : _rides;
    return AnnotatedRegion<SystemUiOverlayStyle>(
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
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 17, 15),
                sliver: SliverToBoxAdapter(
                  child: _HistoryHeader(
                    onBack: () => Navigator.of(context).pop(),
                  ),
                ),
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
                    _FilterTabs(
                      selected: _filter,
                      onSelected: (value) => setState(() => _filter = value),
                    ),
                    const SizedBox(height: 12),
                    const _SummaryCard(),
                    const SizedBox(height: 14),
                    if (visible.isNotEmpty) ...[
                      const _DateHeading('Today  ·  24 May 2025'),
                      const SizedBox(height: 8),
                    ],
                    ...visible.indexed.expand((entry) {
                      final index = entry.$1;
                      final ride = entry.$2;
                      return [
                        if (index == 3) ...[
                          const SizedBox(height: 5),
                          const _DateHeading('Yesterday  ·  23 May 2025'),
                          const SizedBox(height: 8),
                        ],
                        _RideCard(ride),
                        const SizedBox(height: 9),
                      ];
                    }),
                    const _DownloadCard(),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: DriverBottomBar(
          selectedIndex: -1,
          isOnline: _isOnline,
          onSelected: _selectTab,
          onStatusTap: () => setState(() => _isOnline = !_isOnline),
        ),
      ),
    );
  }
}

class _HistoryHeader extends StatelessWidget {
  const _HistoryHeader({required this.onBack});
  final VoidCallback onBack;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          onTap: onBack,
          customBorder: const CircleBorder(),
          child: const SizedBox(
            width: 43,
            height: 43,
            child: Icon(
              Icons.arrow_back_rounded,
              color: AppColors.navy,
              size: 25,
            ),
          ),
        ),
      ),
      const SizedBox(width: 12),
      const Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ride History',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'All your completed and cancelled trips',
              style: TextStyle(color: AppColors.muted, fontSize: 10.5),
            ),
          ],
        ),
      ),
      const DriverHeaderActions(),
    ],
  );
}

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({required this.selected, required this.onSelected});
  final int selected;
  final ValueChanged<int> onSelected;
  static const labels = ['All', 'Completed', 'Cancelled', 'No Show'];
  static const icons = [
    null,
    Icons.check_circle_outline_rounded,
    Icons.cancel_outlined,
    Icons.cancel_outlined,
  ];
  static const colors = [
    AppColors.green,
    AppColors.green,
    AppColors.red,
    AppColors.orange,
  ];
  @override
  Widget build(BuildContext context) => Container(
    height: 50,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: List.generate(
        labels.length,
        (i) => Expanded(
          child: InkWell(
            onTap: () => onSelected(i),
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: selected == i ? colors[i] : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icons[i] != null) ...[
                    Icon(icons[i], color: colors[i], size: 15),
                    const SizedBox(width: 4),
                  ],
                  Flexible(
                    child: Text(
                      labels[i],
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: selected == i ? colors[i] : AppColors.navy,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                      ),
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard();
  static const items = [
    (Icons.calendar_month_rounded, '28', 'Total Rides', AppColors.green),
    (Icons.check_circle_outline_rounded, '25', 'Completed', AppColors.green),
    (Icons.cancel_outlined, '2', 'Cancelled', AppColors.red),
    (
      Icons.currency_rupee_rounded,
      '₹4,320',
      'Total Earnings',
      AppColors.orange,
    ),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Summary (This Month)',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 13),
        Row(
          children: List.generate(
            items.length,
            (i) => Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: i == 3
                      ? null
                      : const Border(
                          right: BorderSide(color: AppColors.border),
                        ),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: items[i].$4.withValues(alpha: .09),
                      child: Icon(items[i].$1, color: items[i].$4, size: 17),
                    ),
                    const SizedBox(height: 5),
                    FittedBox(
                      child: Text(
                        items[i].$2,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Text(
                      items[i].$3,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 8,
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

class _RideCard extends StatelessWidget {
  const _RideCard(this.ride);
  final _RideData ride;
  @override
  Widget build(BuildContext context) => _Panel(
    color: ride.completed ? Colors.white : const Color(0xFFFFF8F8),
    child: Row(
      children: [
        SizedBox(
          width: 76,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ride.time,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                ride.date,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                decoration: BoxDecoration(
                  color: (ride.completed ? AppColors.green : AppColors.red)
                      .withValues(alpha: .09),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Text(
                  ride.completed ? 'COMPLETED' : 'CANCELLED',
                  style: TextStyle(
                    color: ride.completed ? AppColors.green : AppColors.red,
                    fontSize: 7.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 75, child: VerticalDivider()),
        const SizedBox(width: 8),
        Column(
          children: [
            const Icon(Icons.circle, color: AppColors.green, size: 10),
            Container(height: 29, width: 1, color: const Color(0xFFB9C1CF)),
            const Icon(
              Icons.location_on_rounded,
              color: AppColors.red,
              size: 15,
            ),
          ],
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ride.pickup,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                ride.pickupNote,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
              const SizedBox(height: 10),
              Text(
                ride.drop,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                ride.dropNote,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        const SizedBox(width: 7),
        SizedBox(
          width: 61,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                ride.fare,
                style: TextStyle(
                  color: ride.completed ? AppColors.green : AppColors.red,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                ride.completed ? 'Cash' : ride.distance,
                textAlign: TextAlign.right,
                style: TextStyle(
                  color: ride.completed ? AppColors.green : AppColors.muted,
                  fontSize: 8.5,
                ),
              ),
              if (ride.completed) ...[
                const SizedBox(height: 12),
                Text(
                  ride.distance,
                  style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
                ),
              ],
            ],
          ),
        ),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.navy,
          size: 20,
        ),
      ],
    ),
  );
}

class _DownloadCard extends StatelessWidget {
  const _DownloadCard();
  @override
  Widget build(BuildContext context) => _Panel(
    color: const Color(0xFFF7FCF9),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 18,
          backgroundColor: Color(0xFFE7F7EC),
          child: Icon(
            Icons.receipt_long_outlined,
            color: AppColors.green,
            size: 20,
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Need invoice for any ride?',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Download invoice and trip details',
                style: TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.download_rounded, size: 16),
          label: const Text('Download History'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.green,
            side: const BorderSide(color: Color(0xFFBFE4CB)),
            textStyle: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.color = Colors.white});
  final Widget child;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color,
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
    child: child,
  );
}

class _RideData {
  const _RideData(
    this.time,
    this.date,
    this.pickup,
    this.pickupNote,
    this.drop,
    this.dropNote,
    this.fare,
    this.distance,
    this.completed,
  );
  final String time;
  final String date;
  final String pickup;
  final String pickupNote;
  final String drop;
  final String dropNote;
  final String fare;
  final String distance;
  final bool completed;
}
