import 'package:flutter/material.dart';

import 'home_header.dart';
import 'location_card.dart';

class MapBookingHeader extends StatelessWidget {
  const MapBookingHeader({super.key, required this.onMenuTap});

  final VoidCallback onMenuTap;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 400,
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned.fill(
          bottom: 104,
          child: Image.asset(
            'assets/images/home-map-placeholder.png',
            fit: BoxFit.cover,
            alignment: const Alignment(0, -0.35),
          ),
        ),
        const Positioned(
          left: 0,
          right: 0,
          top: 214,
          height: 84,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0xFFFBFCFE)],
              ),
            ),
          ),
        ),
        HomeHeader(onMenuTap: onMenuTap),
        const Positioned(left: 16, right: 16, top: 221, child: LocationCard()),
      ],
    ),
  );
}
