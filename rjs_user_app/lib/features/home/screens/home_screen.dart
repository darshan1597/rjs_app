import 'package:flutter/material.dart';

import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../city_round_trip/screens/city_round_trip_screen.dart';
import '../../rental/screens/rental_packages_screen.dart';
import '../../schedule/screens/schedule_ride_screen.dart';
import '../../tours/screens/tour_packages_screen.dart';
import '../widgets/journey_planner.dart';
import '../widgets/map_booking_header.dart';
import '../widgets/safety_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedNav = 0;

  @override
  Widget build(BuildContext context) {
    return BookRideScaffold(
      selectedIndex: _selectedNav,
      onSelected: (value) => setState(() => _selectedNav = value),
      body: SafeArea(
        top: false,
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: MapBookingHeader(onMenuTap: () => showRjsDrawer(context)),
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
