import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'notification_popup.dart';

class DriverHeaderActions extends StatelessWidget {
  const DriverHeaderActions({
    super.key,
    this.darkIcons = true,
    this.secondIcon = Icons.chat_bubble_outline_rounded,
    this.onSecondTap,
  });

  final bool darkIcons;
  final IconData secondIcon;
  final VoidCallback? onSecondTap;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      _ActionButton(
        icon: Icons.notifications_none_rounded,
        dot: true,
        color: darkIcons ? Colors.black87 : Colors.white,
        onTap: (buttonContext) {
          final box = buttonContext.findRenderObject() as RenderBox?;
          final anchor = box == null
              ? null
              : box.localToGlobal(Offset.zero) & box.size;
          showRjsNotifications(context, anchorRect: anchor);
        },
      ),
      const SizedBox(width: 8),
      _ActionButton(
        icon: secondIcon,
        color: darkIcons ? Colors.black87 : Colors.white,
        onTap: (_) => onSecondTap?.call(),
      ),
    ],
  );
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
    this.dot = false,
  });

  final IconData icon;
  final Color color;
  final ValueChanged<BuildContext> onTap;
  final bool dot;

  @override
  Widget build(BuildContext context) => Stack(
    clipBehavior: Clip.none,
    children: [
      Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          onTap: () => onTap(context),
          customBorder: const CircleBorder(),
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
          overlayColor: const WidgetStatePropertyAll(Colors.transparent),
          child: SizedBox(
            width: 43,
            height: 43,
            child: Icon(icon, color: color, size: 24),
          ),
        ),
      ),
      if (dot)
        Positioned(
          right: 1,
          top: 0,
          child: Container(
            width: 15,
            height: 15,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.red,
              shape: BoxShape.circle,
            ),
            child: const Text(
              '3',
              style: TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
    ],
  );
}
