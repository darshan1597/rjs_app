import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../models/ride_option.dart';

class RideCard extends StatelessWidget {
  const RideCard({
    super.key,
    required this.ride,
    required this.selected,
    required this.onTap,
    required this.darkVehicle,
  });
  final RideOption ride;
  final bool selected, darkVehicle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(15),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      constraints: const BoxConstraints(minHeight: 62),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFFFFAF6) : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: selected ? AppColors.orange : const Color(0xFFE5E7EC),
          width: selected ? 1.3 : 1,
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 82,
            height: 46,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                ride.imageAsset,
                fit: BoxFit.cover,
                alignment: const Alignment(0, .12),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        ride.name,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Icon(
                      Icons.person_outline_rounded,
                      size: 17,
                      color: AppColors.muted,
                    ),
                    Text(
                      '${ride.seats}',
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  ride.description,
                  maxLines: 2,
                  style: const TextStyle(
                    color: Color(0xFF4F5667),
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                ride.price,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                ride.arrival,
                style: TextStyle(
                  color: selected ? AppColors.orange : AppColors.blue,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}
