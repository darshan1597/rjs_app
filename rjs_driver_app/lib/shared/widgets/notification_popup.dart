import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

Future<void> showRjsNotifications(BuildContext context, {Rect? anchorRect}) =>
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 520),
      pageBuilder: (_, _, _) => const SizedBox.shrink(),
      transitionBuilder: (dialogContext, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: const Cubic(.2, .85, .25, 1),
          reverseCurve: Curves.easeInCubic,
        );
        return AnimatedBuilder(
          animation: curved,
          builder: (context, _) {
            final progress = curved.value;
            final screenWidth = MediaQuery.sizeOf(context).width;
            final anchor =
                anchorRect ??
                Rect.fromLTWH(
                  screenWidth - 111,
                  MediaQuery.paddingOf(context).top + 8,
                  43,
                  43,
                );
            final cardWidth = screenWidth - 32;
            final transformX = ((2 * (anchor.center.dx - 16) / cardWidth) - 1)
                .clamp(-1.0, 1.0);
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
                  child: _SharpNotificationButton(
                    onTap: () => Navigator.pop(dialogContext),
                  ),
                ),
                Positioned(
                  top: anchor.bottom + 12,
                  left: 16,
                  right: 16,
                  child: Opacity(
                    opacity: Curves.easeOut.transform(
                      (progress * 1.3).clamp(0.0, 1.0),
                    ),
                    child: Transform.translate(
                      offset: Offset(0, -48 * (1 - progress)),
                      child: Transform.scale(
                        alignment: Alignment(transformX, -1),
                        scaleX: .22 + (.78 * progress),
                        scaleY: .5 + (.5 * progress),
                        child: const _NotificationCard(),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );

class _NotificationCard extends StatefulWidget {
  const _NotificationCard();

  @override
  State<_NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends State<_NotificationCard> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          right: 69,
          top: 0,
          child: Transform.rotate(
            angle: .785398,
            child: Container(
              width: 18,
              height: 18,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(topLeft: Radius.circular(3)),
              ),
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.only(top: 8),
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
                            'You have 3 new updates',
                            style: TextStyle(
                              color: AppColors.muted,
                              fontSize: 9.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: null,
                      child: Text(
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
                child: Stack(
                  children: [
                    RawScrollbar(
                      controller: _scrollController,
                      thumbVisibility: true,
                      trackVisibility: true,
                      thickness: 3,
                      radius: const Radius.circular(4),
                      padding: EdgeInsets.zero,
                      mainAxisMargin: 0,
                      crossAxisMargin: 3,
                      thumbColor: const Color(0xFF8FB5EE),
                      trackColor: const Color(0xFFE8EFF9),
                      child: SingleChildScrollView(
                        controller: _scrollController,
                        physics: const BouncingScrollPhysics(),
                        child: const Column(
                          children: [
                            _NotificationItem(
                              icon: Icons.route_rounded,
                              color: Color(0xFF18A33B),
                              title: 'New trip request nearby',
                              message: 'A pickup request is available 1.8 km from you.',
                              time: 'Just now',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.account_balance_wallet_rounded,
                              color: AppColors.blue,
                              title: 'Today’s earnings updated',
                              message: '₹142 was added after your latest completed trip.',
                              time: '20 min ago',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.event_available_rounded,
                              color: AppColors.orange,
                              title: 'Upcoming pickup reminder',
                              message: 'Your Indiranagar pickup is scheduled for 11:30 AM.',
                              time: '2 hrs ago',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.local_offer_rounded,
                              color: Color(0xFF9148DD),
                              title: 'Weekly incentive available',
                              message: 'Complete 8 more trips to unlock your weekly bonus.',
                              time: 'Yesterday',
                            ),
                            _NotificationItem(
                              icon: Icons.route_rounded,
                              color: Color(0xFF168FA8),
                              title: 'New customer rating received',
                              message:
                                  'A customer rated your recent trip 5 stars.',
                              time: '2 days ago',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
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
      ],
    ),
  );
}

class _SharpNotificationButton extends StatelessWidget {
  const _SharpNotificationButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 2,
    child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      overlayColor: const WidgetStatePropertyAll(Colors.transparent),
      child: SizedBox(
        width: 43,
        height: 43,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            const Icon(
              Icons.notifications_none_rounded,
              color: Colors.black87,
              size: 24,
            ),
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
        ),
      ),
    ),
  );
}

class _NotificationItem extends StatelessWidget {
  const _NotificationItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
    required this.time,
    this.unread = false,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String message;
  final String time;
  final bool unread;

  @override
  Widget build(BuildContext context) => Container(
    color: unread ? const Color(0xFFF7FAFF) : Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
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
                      title,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (unread)
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.orange,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                message,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 9.5,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                time,
                style: const TextStyle(color: AppColors.blue, fontSize: 8.5),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
