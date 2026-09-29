import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/notifications/driver_notification_store.dart';
import '../../core/theme/app_colors.dart';

Future<void> showRjsNotifications(BuildContext context, {Rect? anchorRect}) =>
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 420),
      pageBuilder: (_, _, _) => const SizedBox.shrink(),
      transitionBuilder: (dialogContext, animation, _, _) {
        final progress = Curves.easeOutCubic.transform(animation.value);
        final screenWidth = MediaQuery.sizeOf(dialogContext).width;
        final anchor =
            anchorRect ??
            Rect.fromLTWH(
              screenWidth - 111,
              MediaQuery.paddingOf(dialogContext).top + 8,
              43,
              43,
            );
        return Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.pop(dialogContext),
                child: const ColoredBox(color: Colors.transparent),
              ),
            ),
            Positioned.fill(
              child: IgnorePointer(
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
              top: anchor.top,
              left: anchor.left,
              child: Material(
                color: Colors.white,
                elevation: 2,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: () => Navigator.pop(dialogContext),
                  customBorder: const CircleBorder(),
                  child: const SizedBox(
                    width: 43,
                    height: 43,
                    child: Icon(Icons.notifications_none_rounded),
                  ),
                ),
              ),
            ),
            Positioned(
              top: anchor.bottom + 12,
              left: 16,
              right: 16,
              child: Opacity(
                opacity: progress,
                child: Transform.translate(
                  offset: Offset(0, -36 * (1 - progress)),
                  child: Transform.scale(
                    alignment: Alignment.topRight,
                    scale: .82 + .18 * progress,
                    child: const _NotificationCard(),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );

class _NotificationCard extends StatefulWidget {
  const _NotificationCard();

  @override
  State<_NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends State<_NotificationCard> {
  late Future<List<Map<String, dynamic>>> _reminders =
      DriverNotificationStore.loadReminders();

  Future<void> _markAllRead() async {
    try {
      await DriverNotificationStore.markAllRead();
      if (mounted) {
        setState(() => _reminders = DriverNotificationStore.loadReminders());
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not update reminders. Try again.'),
          ),
        );
      }
    }
  }

  String _timeLabel(Object? value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return '';
    final age = DateTime.now().difference(date);
    if (age.inMinutes < 1) return 'Just now';
    if (age.inMinutes < 60) return '${age.inMinutes} min ago';
    if (age.inHours < 24) return '${age.inHours} hr ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: Container(
      constraints: const BoxConstraints(maxHeight: 430),
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
            padding: const EdgeInsets.fromLTRB(17, 16, 12, 11),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: const BoxDecoration(
                    color: Color(0xFFEDF4FF),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_active_outlined,
                    color: AppColors.blue,
                    size: 21,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notifications',
                        style: TextStyle(
                          color: AppColors.navy,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Scheduled ride updates',
                        style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _markAllRead,
                  child: const Text(
                    'Mark all read',
                    style: TextStyle(
                      color: AppColors.blue,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE8EBF1)),
          SizedBox(
            height: 284,
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _reminders,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Unable to load reminders. Reopen notifications to retry.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                }
                final items = snapshot.data ?? const <Map<String, dynamic>>[];
                if (items.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No scheduled ride reminders yet.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  itemCount: items.length,
                  separatorBuilder: (_, _) =>
                      const Divider(height: 1, color: Color(0xFFE8EBF1)),
                  itemBuilder: (_, index) {
                    final item = items[index];
                    final departure = item['kind'] != 'PREPARE';
                    final color = departure ? AppColors.orange : AppColors.blue;
                    return Container(
                      color: item['readAt'] == null
                          ? const Color(0xFFF7FAFF)
                          : Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 11,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 19,
                            backgroundColor: color.withValues(alpha: .1),
                            child: Icon(
                              departure
                                  ? Icons.route_rounded
                                  : Icons.event_available_rounded,
                              color: color,
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
                                            'Scheduled ride',
                                        style: const TextStyle(
                                          color: AppColors.navy,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    if (item['readAt'] == null)
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
                                    fontSize: 9.5,
                                    height: 1.35,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _timeLabel(item['createdAt']),
                                  style: const TextStyle(
                                    color: AppColors.blue,
                                    fontSize: 8.5,
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
            padding: const EdgeInsets.fromLTRB(14, 5, 14, 13),
            child: SizedBox(
              width: double.infinity,
              height: 40,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.blue,
                  side: const BorderSide(color: Color(0xFFC7DAF8)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(11),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                child: const Text('Close Notifications'),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
