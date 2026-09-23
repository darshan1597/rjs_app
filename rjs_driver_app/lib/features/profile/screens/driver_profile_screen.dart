import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/notifications/driver_push_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../auth/screens/driver_login_screen.dart';
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
  bool _loggingOut = false;
  Map<String, dynamic>? _driver;

  @override
  void initState() {
    super.initState();
    DriverApiService.session().then((session) {
      if (!mounted) return;
      setState(() => _driver = session?['driver'] as Map<String, dynamic>?);
    });
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Logout?',
          style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800),
        ),
        content: const Text(
          'You will need to verify your phone number again to access the driver app.',
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted || _loggingOut) return;

    setState(() => _loggingOut = true);
    try {
      try {
        await DriverApiService.setOnline(false);
      } catch (_) {
        // Logout must still succeed if the server cannot be reached.
      }
      await DriverPushService.unregisterCurrentDevice();
      await DriverApiService.clearSession();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const DriverLoginScreen()),
        (_) => false,
      );
    } finally {
      if (mounted) setState(() => _loggingOut = false);
    }
  }

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
                children: [
                  DriverIdentityCard(driver: _driver),
                  const SizedBox(height: 11),
                  DriverVehicleCard(
                    vehicle: _driver?['vehicle'] as Map<String, dynamic>?,
                  ),
                  const SizedBox(height: 11),
                  const PerformanceCard(),
                  const SizedBox(height: 11),
                  const ProfileMenuCard(),
                  const SizedBox(height: 11),
                  const ContactSupportCard(),
                  const SizedBox(height: 11),
                  LogoutCard(onTap: _loggingOut ? null : _logout),
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
