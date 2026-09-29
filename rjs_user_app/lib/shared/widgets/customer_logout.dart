import 'package:flutter/material.dart';

import '../../core/network/customer_auth_service.dart';
import '../../core/notifications/customer_notification_store.dart';
import '../../core/notifications/customer_push_service.dart';
import '../../core/theme/app_colors.dart';
import '../../features/auth/screens/login_screen.dart';

Future<void> confirmCustomerLogout(BuildContext context) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      icon: Container(
        width: 54,
        height: 54,
        decoration: const BoxDecoration(
          color: Color(0xFFFFF0EB),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.logout_rounded, color: AppColors.orange),
      ),
      title: const Text(
        'Log out?',
        style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800),
      ),
      content: const Text(
        'You will need to verify your mobile number to sign in again.',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.muted, fontSize: 13),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        OutlinedButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.navy,
            side: const BorderSide(color: Color(0xFFDCE2EB)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(11),
            ),
          ),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(dialogContext, true),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.orange,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(11),
            ),
          ),
          child: const Text('Log out'),
        ),
      ],
    ),
  );

  if (confirmed != true || !context.mounted) return;
  await CustomerPushService.unregisterCurrentDevice();
  await CustomerAuthService.logout();
  CustomerNotificationStore.clear();
  if (!context.mounted) return;
  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => const LoginScreen()),
    (_) => false,
  );
}
