import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';
import '../widgets/earnings_sections.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  bool _isOnline = true;

  void _selectTab(int index) {
    if (index == 1) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const ScheduledRidesScreen()),
      );
      return;
    }
    if (index == 0) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const DriverHomeScreen()),
      );
      return;
    }
    if (index == 4) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const DriverProfileScreen()),
      );
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
      systemNavigationBarDividerColor: Colors.transparent,
    ),
    child: Scaffold(
      backgroundColor: AppColors.background,
      extendBody: false,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const SliverPadding(
              padding: EdgeInsets.fromLTRB(18, 8, 17, 15),
              sliver: SliverToBoxAdapter(child: _EarningsHeader()),
            ),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                15,
                0,
                15,
                100 + MediaQuery.paddingOf(context).bottom,
              ),
              sliver: SliverList.list(
                children: const [
                  TodayEarningsCard(),
                  SizedBox(height: 11),
                  EarningsOverviewCard(),
                  SizedBox(height: 11),
                  EarningsBreakupCard(),
                  SizedBox(height: 11),
                  RecentTransactionsCard(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: DriverBottomBar(
        selectedIndex: 3,
        isOnline: _isOnline,
        onSelected: _selectTab,
        onStatusTap: () => setState(() => _isOnline = !_isOnline),
      ),
    ),
  );
}

class _EarningsHeader extends StatelessWidget {
  const _EarningsHeader();

  @override
  Widget build(BuildContext context) => const Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Earnings',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Track your income and trips',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
      ),
      DriverHeaderActions(),
    ],
  );
}
