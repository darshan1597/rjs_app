import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/notifications/customer_notification_store.dart';
import '../../core/theme/app_colors.dart';

Future<void> showRjsNotifications(BuildContext context) =>
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 420),
      pageBuilder: (_, _, _) => const SizedBox.shrink(),
      transitionBuilder: (dialogContext, animation, _, _) {
        final progress = Curves.easeOutCubic.transform(animation.value);
        return Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.pop(dialogContext),
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: 7 * progress,
                    sigmaY: 7 * progress,
                  ),
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: .13 * progress),
                  ),
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(dialogContext).top + 65,
              left: 16,
              right: 16,
              child: Opacity(
                opacity: progress,
                child: Transform.translate(
                  offset: Offset(0, -36 * (1 - progress)),
                  child: Transform.scale(
                    alignment: Alignment.topRight,
                    scale: .84 + (.16 * progress),
                    child: const _NotificationCard(),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );

class RjsNotificationDot extends StatefulWidget {
  const RjsNotificationDot({super.key});
  @override
  State<RjsNotificationDot> createState() => _RjsNotificationDotState();
}

class _RjsNotificationDotState extends State<RjsNotificationDot> {
  @override
  void initState() {
    super.initState();
    CustomerNotificationStore.refreshUnreadCount().catchError((_) {});
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
    valueListenable: CustomerNotificationStore.unreadCount,
    builder: (_, count, _) => count <= 0
        ? const SizedBox.shrink()
        : Container(
            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: AppColors.orange,
              borderRadius: BorderRadius.circular(9),
              border: Border.all(color: Colors.white, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              count > 99 ? '99+' : '$count',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
  );
}

class _NotificationCard extends StatefulWidget {
  const _NotificationCard();
  @override
  State<_NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends State<_NotificationCard> {
  late Future<List<Map<String, dynamic>>> _items =
      CustomerNotificationStore.load();

  Future<void> _markAllRead() async {
    try {
      await CustomerNotificationStore.markAllRead();
      if (mounted) setState(() => _items = CustomerNotificationStore.load());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update notifications.')),
        );
      }
    }
  }

  String _time(Object? value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return '';
    final age = DateTime.now().difference(date);
    if (age.inMinutes < 1) return 'Just now';
    if (age.inMinutes < 60) return '${age.inMinutes} min ago';
    if (age.inHours < 24) return '${age.inHours} hr ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  IconData _icon(String status) => switch (status) {
    'DRIVER_EN_ROUTE' || 'ARRIVED' => Icons.near_me_rounded,
    'PAYMENT_PENDING' || 'COMPLETED' => Icons.receipt_long_rounded,
    'CANCELLED' ||
    'NO_SHOW' ||
    'NO_DRIVER_AVAILABLE' => Icons.info_outline_rounded,
    _ => Icons.directions_car_rounded,
  };

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: Container(
      constraints: const BoxConstraints(maxHeight: 450),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2B09204A),
            blurRadius: 28,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(17, 14, 10, 10),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0xFFEDF4FF),
                  child: Icon(
                    Icons.notifications_active_outlined,
                    color: AppColors.blue,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Notifications',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: _markAllRead,
                  child: const Text('Mark all read'),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          SizedBox(
            height: 310,
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _items,
              builder: (_, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Unable to load notifications. Reopen to retry.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                }
                final items = snapshot.data ?? const [];
                if (items.isEmpty) {
                  return const Center(child: Text('No ride updates yet.'));
                }
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (_, index) {
                    final item = items[index];
                    final unread = item['readAt'] == null;
                    return Container(
                      color: unread ? const Color(0xFFF7FAFF) : Colors.white,
                      padding: const EdgeInsets.all(13),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            backgroundColor: const Color(0xFFEDF4FF),
                            child: Icon(
                              _icon(item['status']?.toString() ?? ''),
                              color: AppColors.blue,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['title']?.toString() ??
                                            'Ride update',
                                        style: const TextStyle(
                                          color: AppColors.navy,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    if (unread)
                                      const CircleAvatar(
                                        radius: 3.5,
                                        backgroundColor: AppColors.orange,
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  item['body']?.toString() ?? '',
                                  style: const TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 11,
                                    height: 1.35,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _time(item['createdAt']),
                                  style: const TextStyle(
                                    color: AppColors.blue,
                                    fontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close Notifications'),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
