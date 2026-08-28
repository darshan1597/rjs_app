import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class LocationCard extends StatelessWidget {
  const LocationCard({super.key});

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(15, 13, 15, 13),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      boxShadow: const [
        BoxShadow(
          color: Color(0x150A244A),
          blurRadius: 18,
          offset: Offset(0, 7),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 42,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD2DE),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          '$_greeting, Darshan',
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.muted,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Where can we take you?',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: 11),
        _field(
          Icons.location_on_rounded,
          AppColors.orange,
          'Enter your destination',
          const Color(0xFF9BA1AF),
          Icons.arrow_forward_rounded,
        ),
        const SizedBox(height: 13),
        const IntrinsicHeight(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _Shortcut(Icons.home_rounded, 'Home', 'Add', AppColors.orange),
              VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
              _Shortcut(Icons.work_rounded, 'Work', 'Add', AppColors.blue),
              VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
              _Shortcut(
                Icons.star_rounded,
                'Favorites',
                'Add',
                AppColors.orange,
              ),
              VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
              _Shortcut(
                Icons.access_time_filled_rounded,
                'Recent',
                'View',
                AppColors.blue,
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _field(
    IconData icon,
    Color iconColor,
    String text,
    Color textColor,
    IconData? trailing,
  ) => Container(
    height: 44,
    padding: const EdgeInsets.symmetric(horizontal: 12),
    decoration: BoxDecoration(
      border: Border.all(color: const Color(0xFFE2E5EB)),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Icon(icon, color: iconColor, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 14.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        if (trailing != null)
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5FB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(trailing, color: AppColors.blue, size: 19),
          ),
      ],
    ),
  );
}

class _Shortcut extends StatelessWidget {
  const _Shortcut(this.icon, this.title, this.subtitle, this.color);
  final IconData icon;
  final String title, subtitle;
  final Color color;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: 70,
    child: Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 3),
        Text(
          title,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 11.5,
            color: AppColors.navy,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          subtitle,
          style: const TextStyle(fontSize: 10.5, color: AppColors.muted),
        ),
      ],
    ),
  );
}
