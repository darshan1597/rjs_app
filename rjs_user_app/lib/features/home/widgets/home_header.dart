import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/notification_popup.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key, required this.onMenuTap});

  final VoidCallback onMenuTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      16,
      MediaQuery.paddingOf(context).top + 8,
      16,
      10,
    ),
    child: Row(
      children: [
        _button(Icons.menu_rounded, onPressed: onMenuTap, filled: true),
        const Spacer(),
        Stack(
          clipBehavior: Clip.none,
          children: [
            _button(
              Icons.notifications_none_rounded,
              onPressed: () => showRjsNotifications(context),
              filled: true,
            ),
            const Positioned(right: 2, top: 2, child: RjsNotificationDot()),
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
