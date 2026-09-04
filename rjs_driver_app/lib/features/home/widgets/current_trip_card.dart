import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class CurrentTripCard extends StatelessWidget {
  const CurrentTripCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: const Color(0xFFF8FCFA),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFDDE9E4)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0C13365F),
          blurRadius: 14,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: Column(
      children: [
        Row(
          children: [
            _pill('Current Trip', AppColors.green),
            const Spacer(),
            const Text(
              'View Details',
              style: TextStyle(
                color: AppColors.blue,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 3),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.blue,
              size: 19,
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pickup',
                    style: TextStyle(
                      color: AppColors.green,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Koramangala 4th Block',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Near Forum Mall',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                  ),
                  const SizedBox(height: 6),
                  _pill('1.8 km away  •  6 min', AppColors.green),
                  const SizedBox(height: 9),
                  const Row(
                    children: [
                      CircleAvatar(
                        radius: 15,
                        backgroundColor: Color(0xFFEAF8F0),
                        child: Icon(
                          Icons.person_outline_rounded,
                          color: AppColors.green,
                        ),
                      ),
                      SizedBox(width: 9),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Darshan',
                                  style: TextStyle(
                                    color: AppColors.navy,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 5),
                                Icon(
                                  Icons.star_rounded,
                                  color: AppColors.orange,
                                  size: 15,
                                ),
                                Text(
                                  '4.8',
                                  style: TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 3),
                            Text(
                              '+91 98765 43210',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontSize: 10.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 100,
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Fare',
                    style: TextStyle(color: AppColors.muted, fontSize: 10),
                  ),
                  SizedBox(height: 4),
                  Icon(
                    Icons.lock_outline_rounded,
                    color: AppColors.muted,
                    size: 18,
                  ),
                  SizedBox(height: 3),
                  Text(
                    'After completion',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Divider(height: 12),
                  Text(
                    'Distance',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                  Text(
                    '5.2 km',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Divider(height: 12),
                  Text(
                    'Est. Time',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                  Text(
                    '18 mins',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.orange.withValues(alpha: .075),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            children: [
              CircleAvatar(
                radius: 15,
                backgroundColor: Colors.white,
                child: Icon(
                  Icons.lock_outline_rounded,
                  color: AppColors.navy,
                  size: 19,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Destination will be available after trip starts',
                      style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Collect OTP from customer to start the trip',
                      style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8),
              _DestinationGraphic(),
            ],
          ),
        ),
        const SizedBox(height: 7),
        Row(
          children: [
            Expanded(
              child: _action(
                Icons.navigation_rounded,
                'Navigate to Pickup',
                false,
              ),
            ),
            const SizedBox(width: 7),
            Expanded(
              child: _action(Icons.pin_drop_outlined, "I've Arrived", true),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.schedule_rounded, color: AppColors.blue, size: 16),
            SizedBox(width: 6),
            Text(
              'Pickup at 10:15 AM',
              style: TextStyle(
                color: AppColors.blue,
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ],
    ),
  );

  static Widget _pill(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Text(
      text,
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700),
    ),
  );

  static Widget _action(IconData icon, String label, bool filled) => SizedBox(
    height: 34,
    child: OutlinedButton.icon(
      onPressed: () {},
      icon: Icon(icon, size: 17),
      label: FittedBox(child: Text(label)),
      style: OutlinedButton.styleFrom(
        backgroundColor: filled ? AppColors.green : Colors.white,
        foregroundColor: filled ? Colors.white : AppColors.green,
        side: BorderSide(color: filled ? AppColors.green : AppColors.green),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800),
      ),
    ),
  );
}

class _DestinationGraphic extends StatelessWidget {
  const _DestinationGraphic();

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 82,
    height: 38,
    child: Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFFFDDBB)),
          ),
          child: const Icon(
            Icons.location_on_outlined,
            color: AppColors.orange,
            size: 18,
          ),
        ),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(
              3,
              (_) => Container(
                width: 4,
                height: 1.5,
                color: const Color(0xFF95A0B4),
              ),
            ),
          ),
        ),
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFFFDDBB)),
          ),
          child: const Icon(
            Icons.lock_rounded,
            color: AppColors.navy,
            size: 17,
          ),
        ),
      ],
    ),
  );
}
