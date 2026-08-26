import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../models/ride_option.dart';
import '../widgets/app_drawer.dart';
import '../widgets/hero_banner.dart';
import '../widgets/home_bottom_bar.dart';
import '../widgets/home_header.dart';
import '../widgets/location_card.dart';
import '../widgets/ride_card.dart';
import '../widgets/safety_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedRide = 0, _selectedNav = 0;
  @override
  Widget build(BuildContext context) => Scaffold(
    extendBody: true,
    body: SafeArea(
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: HomeHeader(onMenuTap: () => showRjsDrawer(context)),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 22),
            sliver: SliverList.list(
              children: [
                const HeroBanner(),
                const SizedBox(height: 16),
                const LocationCard(),
                const SizedBox(height: 15),
                Row(
                  children: [
                    const Text(
                      'Choose a ride',
                      style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {},
                      child: const Text(
                        'View all',
                        style: TextStyle(
                          color: AppColors.blue,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 7),
                for (var i = 0; i < rideOptions.length; i++) ...[
                  RideCard(
                    ride: rideOptions[i],
                    selected: i == _selectedRide,
                    darkVehicle: i == 2,
                    onTap: () => setState(() => _selectedRide = i),
                  ),
                  if (i != rideOptions.length - 1) const SizedBox(height: 8),
                ],
                const SizedBox(height: 16),
                const SafetyBanner(),
                const SizedBox(height: 92),
              ],
            ),
          ),
        ],
      ),
    ),
    bottomNavigationBar: HomeBottomBar(
      selectedIndex: _selectedNav,
      onSelected: (value) => setState(() => _selectedNav = value),
    ),
  );
}
