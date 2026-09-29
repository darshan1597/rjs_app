import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/notifications/driver_notification_store.dart';
import 'notification_popup.dart';

class DriverHeaderActions extends StatefulWidget {
  const DriverHeaderActions({
    super.key,
    this.darkIcons = true,
    this.secondIcon = Icons.chat_bubble_outline_rounded,
    this.onSecondTap,
    this.showSecondAction = true,
  });

  final bool darkIcons;
  final IconData secondIcon;
  final VoidCallback? onSecondTap;
  final bool showSecondAction;

  @override
  State<DriverHeaderActions> createState() => _DriverHeaderActionsState();
}

class _DriverHeaderActionsState extends State<DriverHeaderActions> {
  @override
  void initState() {
    super.initState();
    DriverNotificationStore.refreshUnreadCount().catchError((_) {});
  }

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      ValueListenableBuilder<int>(
        valueListenable: DriverNotificationStore.unreadCount,
        builder: (_, count, _) => _ActionButton(
          icon: Icons.notifications_none_rounded,
          badgeCount: count,
          color: widget.darkIcons ? Colors.black87 : Colors.white,
          onTap: (buttonContext) async {
            final box = buttonContext.findRenderObject() as RenderBox?;
            final anchor = box == null
                ? null
                : box.localToGlobal(Offset.zero) & box.size;
            await showRjsNotifications(context, anchorRect: anchor);
            await DriverNotificationStore.refreshUnreadCount().catchError(
              (_) {},
            );
          },
        ),
      ),
      if (widget.showSecondAction) ...[
        const SizedBox(width: 8),
        _ActionButton(
          icon: widget.secondIcon,
          color: widget.darkIcons ? Colors.black87 : Colors.white,
          onTap: (_) => widget.onSecondTap?.call(),
        ),
      ],
    ],
  );
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final Color color;
  final ValueChanged<BuildContext> onTap;
  final int badgeCount;

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
      if (badgeCount > 0)
        Positioned(
          right: 1,
          top: 0,
          child: Container(
            constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
            padding: const EdgeInsets.symmetric(horizontal: 3),
            height: 15,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.red,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              badgeCount > 99 ? '99+' : '$badgeCount',
              style: const TextStyle(
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
