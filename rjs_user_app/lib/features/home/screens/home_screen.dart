import 'package:flutter/material.dart';

import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../city_round_trip/screens/city_round_trip_screen.dart';
import '../../location/screens/full_map_trip_picker_screen.dart';
import '../../rental/screens/rental_packages_screen.dart';
import '../../schedule/screens/schedule_ride_screen.dart';
import '../../tours/screens/tour_packages_screen.dart';
import '../../wallet/services/wallet_service.dart';
import '../../wallet/widgets/wallet_credit_celebration.dart';
import '../../../core/notifications/customer_push_service.dart';
import '../widgets/journey_planner.dart';
import '../widgets/map_booking_header.dart';
import '../widgets/safety_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _selectedNav = 0;
  double _topPullDistance = 0;
  bool _openingFullMap = false;
  bool _fullMapQueued = false;
  bool _checkingWalletCredit = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      CustomerPushService.handlePendingNavigation();
      _showPendingWalletCredit();
    });
    CustomerPushService.registerCurrentDevice();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _showPendingWalletCredit();
  }

  Future<void> _showPendingWalletCredit() async {
    if (_checkingWalletCredit) return;
    _checkingWalletCredit = true;
    try {
      final event = await WalletService.claimCreditEvent();
      if (event != null && mounted) {
        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (_) => WalletCreditCelebration(event: event),
        );
      }
    } catch (_) {
      // A wallet notification must never prevent the customer from using the app.
    } finally {
      _checkingWalletCredit = false;
    }
  }

  void _queueFullMap() {
    if (_openingFullMap || _fullMapQueued) return;
    _fullMapQueued = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fullMapQueued = false;
      if (mounted) _openFullMap();
    });
  }

  bool _handleHomeScroll(ScrollNotification notification) {
    if (_openingFullMap) return false;
    if (notification is ScrollStartNotification) {
      if (_topPullDistance != 0) setState(() => _topPullDistance = 0);
    } else if (notification is ScrollUpdateNotification &&
        notification.metrics.pixels < notification.metrics.minScrollExtent) {
      final distance =
          notification.metrics.minScrollExtent - notification.metrics.pixels;
      if ((distance - _topPullDistance).abs() > .5) {
        setState(() => _topPullDistance = distance.clamp(0, 150));
      }
      if (distance >= 64 && notification.dragDetails != null) {
        _queueFullMap();
      }
    } else if (notification is OverscrollNotification &&
        notification.metrics.pixels <= notification.metrics.minScrollExtent &&
        notification.overscroll < 0) {
      setState(() {
        _topPullDistance = (_topPullDistance - notification.overscroll).clamp(
          0,
          150,
        );
      });
      if (_topPullDistance >= 64 && notification.dragDetails != null) {
        _queueFullMap();
      }
    } else if (notification is ScrollEndNotification) {
      if (_topPullDistance >= 54) {
        _openFullMap();
      } else if (_topPullDistance != 0) {
        setState(() => _topPullDistance = 0);
      }
    }
    return false;
  }

  Future<void> _openFullMap() async {
    if (_openingFullMap) return;
    _openingFullMap = true;
    await Navigator.of(context).push(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 380),
        reverseTransitionDuration: const Duration(milliseconds: 280),
        pageBuilder: (_, _, _) => const FullMapTripPickerScreen(),
        transitionsBuilder: (_, animation, _, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
            reverseCurve: Curves.easeInCubic,
          );
          return FadeTransition(opacity: curved, child: child);
        },
      ),
    );
    _openingFullMap = false;
    if (mounted && _topPullDistance != 0) {
      setState(() => _topPullDistance = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BookRideScaffold(
      selectedIndex: _selectedNav,
      onSelected: (value) => setState(() => _selectedNav = value),
      body: SafeArea(
        top: false,
        bottom: false,
        child: NotificationListener<ScrollNotification>(
          onNotification: _handleHomeScroll,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: MapBookingHeader(
                  onMenuTap: () => showRjsDrawer(context),
                  onOpenFullMap: _openFullMap,
                  pullDistance: _topPullDistance,
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 38, 16, 22),
                sliver: SliverList.list(
                  children: [
                    JourneyPlanner(
                      onScheduleRide: _openScheduleRide,
                      onCityRoundTrip: _openCityRoundTrip,
                      onTourPackages: _openTourPackages,
                      onRentalPackage: _openRentalPackages,
                    ),
                    const SizedBox(height: 10),
                    const SafetyBanner(),
                    SizedBox(height: 92 + MediaQuery.paddingOf(context).bottom),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openScheduleRide() {
    _openJourneyPage(const ScheduleRideScreen());
  }

  void _openCityRoundTrip() {
    _openJourneyPage(const CityRoundTripScreen());
  }

  void _openRentalPackages() {
    _openJourneyPage(const RentalPackagesScreen());
  }

  void _openTourPackages() {
    _openJourneyPage(const TourPackagesScreen());
  }

  void _openJourneyPage(Widget page) {
    Navigator.of(context).push(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 360),
        reverseTransitionDuration: const Duration(milliseconds: 280),
        pageBuilder: (_, _, _) => page,
        transitionsBuilder: (_, animation, _, child) => FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
          child: SlideTransition(
            position:
                Tween<Offset>(
                  begin: const Offset(.04, 0),
                  end: Offset.zero,
                ).animate(
                  CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  ),
                ),
            child: child,
          ),
        ),
      ),
    );
  }
}
