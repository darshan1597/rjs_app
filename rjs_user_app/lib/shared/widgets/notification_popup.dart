import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

Future<void> showRjsNotifications(BuildContext context) =>
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
                  top: MediaQuery.paddingOf(context).top + 8,
                  right: 16,
                  child: Opacity(
                    opacity: progress,
                    child: _ActiveNotificationButton(
                      onTap: () => Navigator.pop(dialogContext),
                    ),
                  ),
                ),
                Positioned(
                  top: MediaQuery.paddingOf(context).top + 63,
                  left: 16,
                  right: 16,
                  child: Opacity(
                    opacity: Curves.easeOut.transform(
                      (progress * 1.3).clamp(0.0, 1.0),
                    ),
                    child: Transform.translate(
                      offset: Offset(0, -48 * (1 - progress)),
                      child: Transform.scale(
                        alignment: Alignment.topRight,
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
          right: 18,
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
                              icon: Icons.local_taxi_rounded,
                              color: Color(0xFF18A33B),
                              title: 'Your driver is arriving soon',
                              message: 'Ramesh will reach your pickup point in 18 minutes.',
                              time: 'Just now',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.account_balance_wallet_rounded,
                              color: AppColors.blue,
                              title: 'Cashback added to your wallet',
                              message:
                                  '₹249.90 cashback was credited successfully.',
                              time: '20 min ago',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.event_available_rounded,
                              color: AppColors.orange,
                              title: 'Upcoming trip reminder',
                              message: 'Your Bangalore City Tour is scheduled for tomorrow.',
                              time: '2 hrs ago',
                              unread: true,
                            ),
                            _NotificationItem(
                              icon: Icons.local_offer_rounded,
                              color: Color(0xFF9148DD),
                              title: 'A new offer is waiting',
                              message: 'Add money and get up to ₹250 cashback.',
                              time: 'Yesterday',
                            ),
                            _NotificationItem(
                              icon: Icons.route_rounded,
                              color: Color(0xFF168FA8),
                              title: 'Trip completed successfully',
                              message: 'Your Mysore trip is complete. We hope you enjoyed the ride.',
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

class _ActiveNotificationButton extends StatelessWidget {
  const _ActiveNotificationButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 4,
    shadowColor: const Color(0x180A244A),
    child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 48,
        height: 48,
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(
              Icons.notifications_none_rounded,
              color: AppColors.navy,
              size: 29,
            ),
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
