import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';
import '../widgets/profile_sections.dart';

class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  bool _isOnline = true;

  void _selectTab(int index) {
    final Widget? page = switch (index) {
      0 => const DriverHomeScreen(),
      1 => const ScheduledRidesScreen(),
      3 => const EarningsScreen(),
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
              sliver: SliverToBoxAdapter(child: _ProfileHeader()),
            ),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                15,
                0,
                15,
                20 + MediaQuery.paddingOf(context).bottom,
              ),
              sliver: SliverList.list(
                children: const [
                  DriverIdentityCard(),
                  SizedBox(height: 11),
                  DriverVehicleCard(),
                  SizedBox(height: 11),
                  PerformanceCard(),
                  SizedBox(height: 11),
                  ProfileMenuCard(),
                  SizedBox(height: 11),
                  ContactSupportCard(),
                  SizedBox(height: 11),
                  LogoutCard(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: DriverBottomBar(
        selectedIndex: 4,
        isOnline: _isOnline,
        onSelected: _selectTab,
        onStatusTap: () => setState(() => _isOnline = !_isOnline),
      ),
    ),
  );
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) => const Row(
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Profile',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Manage your account and settings',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
      ),
      DriverHeaderActions(secondIcon: Icons.settings_outlined),
    ],
  );
}
