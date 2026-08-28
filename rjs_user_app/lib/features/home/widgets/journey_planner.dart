import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class JourneyPlanner extends StatelessWidget {
  const JourneyPlanner({
    super.key,
    required this.onScheduleRide,
    required this.onCityRoundTrip,
    required this.onTourPackages,
    required this.onRentalPackage,
  });

  final VoidCallback onScheduleRide;
  final VoidCallback onCityRoundTrip;
  final VoidCallback onTourPackages;
  final VoidCallback onRentalPackage;

  static const _options = [
    _JourneyOption(
      title: 'Schedule Ride',
      subtitle: 'Book for later',
      icon: Icons.calendar_month_rounded,
      color: AppColors.blue,
      background: Colors.white,
    ),
    _JourneyOption(
      title: 'City Round Trip',
      subtitle: 'Ride and return',
      icon: Icons.sync_alt_rounded,
      color: AppColors.orange,
      background: Colors.white,
    ),
    _JourneyOption(
      title: 'Tour Packages',
      subtitle: 'Discover destinations',
      icon: Icons.explore_rounded,
      color: Color(0xFF6554C0),
      background: Colors.white,
    ),
    _JourneyOption(
      title: 'Rental Package',
      subtitle: 'Hourly bookings',
      icon: Icons.car_rental_rounded,
      color: Color(0xFF07846D),
      background: Colors.white,
    ),
  ];

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Plan your journey',
        style: TextStyle(
          color: AppColors.navy,
          fontSize: 17,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 12),
      GridView.builder(
        itemCount: _options.length,
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          mainAxisExtent: 92,
        ),
        itemBuilder: (context, index) => _JourneyCard(
          option: _options[index],
          onTap: switch (index) {
            0 => onScheduleRide,
            1 => onCityRoundTrip,
            2 => onTourPackages,
            3 => onRentalPackage,
            _ => () {},
          },
        ),
      ),
    ],
  );
}

class _JourneyCard extends StatelessWidget {
  const _JourneyCard({required this.option, required this.onTap});

  final _JourneyOption option;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE8EBF1)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A11182D),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: option.background,
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: const Color(0xFFE8EBF1)),
              ),
              child: Icon(option.icon, color: option.color, size: 23),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 13,
                      height: 1.15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    option.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _JourneyOption {
  const _JourneyOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.background,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color background;
}
