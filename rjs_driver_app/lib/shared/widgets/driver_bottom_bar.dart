import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class DriverBottomBar extends StatelessWidget {
  const DriverBottomBar({
    super.key,
    required this.selectedIndex,
    required this.isOnline,
    required this.onSelected,
    required this.onStatusTap,
  });

  final int selectedIndex;
  final bool isOnline;
  final ValueChanged<int> onSelected;
  final VoidCallback onStatusTap;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Container(
      height: 82 + bottomInset,
      padding: EdgeInsets.fromLTRB(8, 5, 8, bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
        boxShadow: [
          BoxShadow(
            color: Color(0x1A17345F),
            blurRadius: 24,
            offset: Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          _item(0, Icons.home_rounded, 'Home'),
          _item(1, Icons.calendar_month_rounded, 'Trips'),
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(40),
              onTap: onStatusTap,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 51,
                    height: 51,
                    decoration: BoxDecoration(
                      color: isOnline ? AppColors.green : AppColors.orange,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (isOnline ? AppColors.green : AppColors.orange)
                              .withValues(alpha: .28),
                          blurRadius: 14,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.power_settings_new_rounded,
                      color: Colors.white,
                      size: 29,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Go Online',
                    style: TextStyle(
                      color: isOnline ? AppColors.green : AppColors.orange,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          _item(3, Icons.account_balance_wallet_rounded, 'Earnings'),
          _item(4, Icons.person_outline_rounded, 'Profile'),
        ],
      ),
    );
  }

  Widget _item(int index, IconData icon, String label) => Expanded(
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => onSelected(index),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: selectedIndex == index ? AppColors.blue : AppColors.muted,
            size: 25,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: selectedIndex == index ? AppColors.blue : AppColors.muted,
              fontSize: 10.5,
              fontWeight: selectedIndex == index
                  ? FontWeight.w800
                  : FontWeight.w600,
            ),
          ),
        ],
      ),
    ),
  );
}
