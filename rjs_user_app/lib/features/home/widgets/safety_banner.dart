import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class SafetyBanner extends StatelessWidget {
  const SafetyBanner({super.key});

  @override
  Widget build(BuildContext context) => Container(
    height: 78,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
    child: Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/images/safety-banner.png',
          fit: BoxFit.cover,
          alignment: Alignment.centerRight,
        ),
        const Padding(
          padding: EdgeInsets.only(left: 76),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'RJS Safe Rides',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Your safety is our\ntop priority',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11.5,
                  height: 1.22,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const Positioned(
          left: 18,
          top: 18,
          child: CircleAvatar(
            radius: 21,
            backgroundColor: Colors.white,
            child: Icon(
              Icons.verified_user_rounded,
              color: AppColors.blue,
              size: 26,
            ),
          ),
        ),
      ],
    ),
  );
}
