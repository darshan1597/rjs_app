import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

Future<String?> chooseLatePickupCancelReason(BuildContext context) async {
  final reason = await showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    builder: (sheetContext) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Why are you cancelling?', style: TextStyle(color: AppColors.navy, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('This option is available because your driver is late to pickup.', style: TextStyle(color: AppColors.muted)),
            const SizedBox(height: 12),
            for (final (code, label) in const [
              ('DRIVER_LATE', 'Driver is late'),
              ('DRIVER_NOT_MOVING', 'Driver is not moving toward pickup'),
              ('CANNOT_CONTACT_DRIVER', 'Cannot contact the driver'),
            ])
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.report_problem_outlined, color: AppColors.orange),
                title: Text(label),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.pop(sheetContext, code),
              ),
          ],
        ),
      ),
    ),
  );
  if (reason == null || !context.mounted) return null;
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: Colors.white,
      title: const Text('Cancel this ride?'),
      content: const Text('The driver will be notified and this booking will end. This cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Keep ride')),
        FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Cancel ride')),
      ],
    ),
  );
  return confirmed == true ? reason : null;
}
