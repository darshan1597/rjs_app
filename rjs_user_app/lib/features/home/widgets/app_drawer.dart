import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import 'rjs_logo.dart';

Future<void> showRjsDrawer(BuildContext context) => showGeneralDialog<void>(
  context: context,
  barrierDismissible: true,
  barrierLabel: 'Close navigation menu',
  barrierColor: Colors.black.withValues(alpha: .32),
  transitionDuration: const Duration(milliseconds: 360),
  pageBuilder: (context, animation, secondaryAnimation) => const Align(
    alignment: Alignment.centerLeft,
    child: Material(color: Colors.transparent, child: AppDrawer()),
  ),
  transitionBuilder: (context, animation, secondaryAnimation, child) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(-1.04, 0),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  },
);

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) => Drawer(
    elevation: 0,
    width: MediaQuery.sizeOf(context).width * .82,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
    ),
    child: SafeArea(
      child: Column(
        children: [
          _header(context),
          const Divider(height: 1, color: Color(0xFFE9ECF1)),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
              children: [
                _item(context, Icons.home_rounded, 'Home', selected: true),
                _item(context, Icons.route_rounded, 'My Rides'),
                _item(context, Icons.account_balance_wallet_rounded, 'Wallet'),
                _item(context, Icons.location_on_rounded, 'Saved Places'),
                _item(
                  context,
                  Icons.notifications_rounded,
                  'Notifications',
                  badge: '2',
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  child: Divider(color: Color(0xFFE9ECF1)),
                ),
                _item(context, Icons.verified_user_rounded, 'Safety Centre'),
                _item(context, Icons.help_rounded, 'Help & Support'),
                _item(context, Icons.settings_rounded, 'Settings'),
                _item(context, Icons.info_rounded, 'About RJS'),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE9ECF1)),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(
                  Icons.logout_rounded,
                  color: AppColors.orange,
                  size: 21,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Log out',
                  style: TextStyle(
                    color: AppColors.orange,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Text(
                  'v1.0.0',
                  style: TextStyle(
                    color: AppColors.muted.withValues(alpha: .75),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  Widget _header(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(20, 12, 14, 18),
    child: Column(
      children: [
        Row(
          children: [
            const RjsLogo(size: 34),
            const Spacer(),
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close_rounded, color: AppColors.navy),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: const BoxDecoration(
                color: Color(0xFFEAF2FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_rounded,
                color: AppColors.blue,
                size: 32,
              ),
            ),
            const SizedBox(width: 13),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome to RJS',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'View and edit profile',
                    style: TextStyle(color: AppColors.muted, fontSize: 12.5),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ],
    ),
  );

  Widget _item(
    BuildContext context,
    IconData icon,
    String title, {
    bool selected = false,
    String? badge,
  }) => ListTile(
    onTap: () {
      if (selected) Navigator.pop(context);
    },
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    tileColor: selected ? const Color(0xFFEFF5FF) : Colors.transparent,
    leading: Icon(
      icon,
      color: selected ? AppColors.blue : AppColors.muted,
      size: 22,
    ),
    title: Text(
      title,
      style: TextStyle(
        color: selected ? AppColors.blue : AppColors.navy,
        fontSize: 14,
        fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
      ),
    ),
    trailing: badge == null
        ? const Icon(
            Icons.chevron_right_rounded,
            color: Color(0xFFB1B7C2),
            size: 19,
          )
        : Container(
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.orange,
              shape: BoxShape.circle,
            ),
            child: Text(
              badge,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
  );
}
