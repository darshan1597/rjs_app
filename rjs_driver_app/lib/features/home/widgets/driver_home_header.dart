import 'package:flutter/material.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/notifications/driver_notification_store.dart';
import '../../../shared/widgets/notification_popup.dart';

class DriverHomeHeader extends StatelessWidget {
  const DriverHomeHeader({required this.isOnline, this.driver, super.key});

  final bool isOnline;
  final Map<String, dynamic>? driver;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) => Container(
    height: 245,
    color: const Color(0xFF003C32),
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned.fill(
          child: Transform.scale(
            scale: 1.06,
            alignment: Alignment.bottomRight,
            child: Image.asset(
              'assets/images/driver-header-city-v2.png',
              fit: BoxFit.cover,
              alignment: Alignment.bottomRight,
            ),
          ),
        ),
        const Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0x4400201C), Colors.transparent],
                stops: [0, .58],
              ),
            ),
          ),
        ),
        Positioned(
          left: 18,
          right: 17,
          top: MediaQuery.paddingOf(context).top + 8,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      padding: const EdgeInsets.all(3.5),
                      decoration: const BoxDecoration(
                        color: AppColors.green,
                        shape: BoxShape.circle,
                      ),
                      child: ClipOval(child: _driverPhoto()),
                    ),
                    Positioned(
                      right: 2,
                      bottom: 3,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: AppColors.green,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 5),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$_greeting,',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_driverName()} 👋',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Drive safe, earn more!',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
              const _HeaderIcon(
                icon: Icons.notifications_none_rounded,
                dot: true,
                notification: true,
              ),
              const SizedBox(width: 8),
              const _HeaderIcon(icon: Icons.chat_bubble_outline_rounded),
            ],
          ),
        ),
        Positioned(
          left: 18,
          top: 132,
          child: Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(color: Color(0x28000000), blurRadius: 12),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 4,
                  backgroundColor: isOnline ? AppColors.green : AppColors.muted,
                ),
                const SizedBox(width: 9),
                Text(
                  isOnline ? 'Online' : 'Offline',
                  style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  String _driverName() {
    final name = driver?['name']?.toString().trim() ?? '';
    return name.isEmpty ? 'Driver' : name;
  }

  Widget _driverPhoto() {
    final source = DriverApiService.absoluteUrl(
      driver?['profilePhoto']?.toString(),
    );
    if (source.isEmpty) {
      return Image.asset('assets/images/driver-ramesh.png', fit: BoxFit.cover);
    }
    return Image.network(
      source,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) =>
          Image.asset('assets/images/driver-ramesh.png', fit: BoxFit.cover),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({
    required this.icon,
    this.dot = false,
    this.notification = false,
  });
  final IconData icon;
  final bool dot;
  final bool notification;

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
    valueListenable: DriverNotificationStore.unreadCount,
    builder: (context, unreadCount, _) => Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: Colors.white,
          shape: const CircleBorder(),
          elevation: 2,
          child: InkWell(
            customBorder: const CircleBorder(),
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            hoverColor: Colors.transparent,
            focusColor: Colors.transparent,
            overlayColor: const WidgetStatePropertyAll(Colors.transparent),
            onTap: notification
                ? () async {
                    await showRjsNotifications(context);
                    await DriverNotificationStore.refreshUnreadCount()
                        .catchError((_) {});
                  }
                : () {},
            child: SizedBox(
              width: 43,
              height: 43,
              child: Icon(icon, color: Colors.black87, size: 24),
            ),
          ),
        ),
        if (dot && unreadCount > 0)
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
                unreadCount > 99 ? '99+' : '$unreadCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    ),
  );
}
