import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class VehicleCard extends StatelessWidget {
  const VehicleCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(14, 13, 14, 11),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      boxShadow: [
        BoxShadow(
          color: Color(0x12031832),
          blurRadius: 18,
          offset: Offset(0, -5),
        ),
      ],
    ),
    child: Row(
      children: [
        Container(
          width: 48,
          height: 48,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF7EF),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFD9EEE2)),
          ),
          child: Image.asset(
            'assets/images/driver-auto-thumbnail.png',
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your Auto',
                style: TextStyle(color: AppColors.muted, fontSize: 11),
              ),
              SizedBox(height: 2),
              Text(
                'KA 05 AB 1234',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Bajaj RE Compact  •  CNG',
                style: TextStyle(color: AppColors.muted, fontSize: 11),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: AppColors.green.withValues(alpha: .09),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.verified_user_rounded,
                color: AppColors.green,
                size: 16,
              ),
              SizedBox(width: 5),
              Text(
                'Verified',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 4),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.muted,
          size: 22,
        ),
      ],
    ),
  );
}
