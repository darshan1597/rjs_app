import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import 'rjs_logo.dart';

class HeroBanner extends StatelessWidget {
  const HeroBanner({super.key});
  @override
  Widget build(BuildContext context) => AspectRatio(
    aspectRatio: 2.68,
    child: ClipRRect(
      borderRadius: BorderRadius.circular(17),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/rjs_hero.png', fit: BoxFit.cover),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0x7D052B68), Colors.transparent],
                stops: [0, .56],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(21, 16, 12, 13),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Travel with',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const RjsLogo(light: true, size: 30),
                const Spacer(),
                const Text(
                  'Safe. Reliable. Anytime.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 30,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
