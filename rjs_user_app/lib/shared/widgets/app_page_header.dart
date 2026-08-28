import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'notification_popup.dart';

class AppPageHeader extends StatelessWidget {
  const AppPageHeader({
    super.key,
    required this.title,
    required this.onMenuTap,
    this.backgroundAsset,
  });

  final String title;
  final VoidCallback onMenuTap;
  final String? backgroundAsset;

  @override
  Widget build(BuildContext context) {
    final scenic = backgroundAsset != null;
    final statusTop = MediaQuery.paddingOf(context).top;
    return Container(
      height: scenic ? statusTop + 137 : null,
      alignment: Alignment.topCenter,
      decoration: scenic
          ? BoxDecoration(
              image: DecorationImage(
                image: AssetImage(backgroundAsset!),
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
                filterQuality: FilterQuality.high,
              ),
            )
          : null,
      padding: EdgeInsets.fromLTRB(16, statusTop + 8, 16, scenic ? 0 : 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0x180A244A),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: IconButton(
              onPressed: onMenuTap,
              icon: const Icon(
                Icons.menu_rounded,
                color: AppColors.navy,
                size: 29,
              ),
              constraints: const BoxConstraints.tightFor(width: 48, height: 48),
              padding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 21,
                height: 1.05,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x180A244A),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: IconButton(
                  onPressed: () => showRjsNotifications(context),
                  icon: const Icon(
                    Icons.notifications_none_rounded,
                    color: AppColors.navy,
                    size: 29,
                  ),
                  constraints: const BoxConstraints.tightFor(
                    width: 48,
                    height: 48,
                  ),
                  padding: EdgeInsets.zero,
                ),
              ),
              const Positioned(
                right: 7,
                top: 7,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    shape: BoxShape.circle,
                    border: Border.fromBorderSide(
                      BorderSide(color: Colors.white, width: 1.5),
                    ),
                  ),
                  child: SizedBox(width: 9, height: 9),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
