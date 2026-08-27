import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key, required this.onMenuTap});

  final VoidCallback onMenuTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
    child: Row(
      children: [
        _button(Icons.menu_rounded, onPressed: onMenuTap, filled: true),
        const Spacer(),
        Stack(
          clipBehavior: Clip.none,
          children: [
            _button(Icons.notifications_none_rounded),
            Positioned(
              right: 7,
              top: 7,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppColors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  Widget _button(
    IconData icon, {
    VoidCallback? onPressed,
    bool filled = false,
  }) => Container(
    decoration: BoxDecoration(
      color: filled ? Colors.white : Colors.transparent,
      shape: BoxShape.circle,
      boxShadow: filled
          ? const [
              BoxShadow(
                color: Color(0x180A244A),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ]
          : null,
    ),
    child: IconButton(
      onPressed: onPressed ?? () {},
      icon: Icon(icon, size: 29, color: AppColors.navy),
      style: IconButton.styleFrom(padding: EdgeInsets.zero),
    ),
  );
}
