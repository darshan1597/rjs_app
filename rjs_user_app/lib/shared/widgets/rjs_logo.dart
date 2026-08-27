import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class RjsLogo extends StatelessWidget {
  const RjsLogo({super.key, this.light = false, this.size = 29});
  final bool light;
  final double size;
  @override
  Widget build(BuildContext context) {
    if (!light) {
      return Image.asset(
        'assets/images/rjs-logo-official.png',
        width: size * 1.5,
        height: size * 1.5,
        fit: BoxFit.contain,
      );
    }
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: size,
          fontWeight: FontWeight.w900,
          fontStyle: FontStyle.italic,
          letterSpacing: -2,
        ),
        children: [
          const TextSpan(
            text: 'R',
            style: TextStyle(color: AppColors.orange),
          ),
          TextSpan(
            text: 'JS',
            style: TextStyle(color: light ? Colors.white : AppColors.blue),
          ),
        ],
      ),
    );
  }
}
