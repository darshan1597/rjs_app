import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class HomeBottomBar extends StatelessWidget {
  const HomeBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
  });
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  static const _items = [
    (Icons.home_rounded, 'Home'),
    (Icons.calendar_month_outlined, 'Bookings'),
    (Icons.directions_car_filled_rounded, 'Book Ride'),
    (Icons.account_balance_wallet_outlined, 'Wallet'),
    (Icons.person_outline_rounded, 'Profile'),
  ];
  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Container(
      height: 98,
      padding: EdgeInsets.only(bottom: bottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x18000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_items.length, (i) {
          final center = i == 2, selected = selectedIndex == i;
          return InkWell(
            onTap: () => onSelected(i),
            child: SizedBox(
              width: 68,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: center ? 50 : 29,
                    height: center ? 50 : 29,
                    transform: center
                        ? Matrix4.translationValues(0, -12, 0)
                        : null,
                    child: center
                        ? OverflowBox(
                            maxWidth: 70,
                            maxHeight: 70,
                            child: Image.asset(
                              'assets/images/book-fleet-popout-orange-transparent.png',
                              width: 70,
                              height: 70,
                              fit: BoxFit.contain,
                            ),
                          )
                        : Icon(
                            _items[i].$1,
                            color: selected
                                ? AppColors.orange
                                : AppColors.muted,
                            size: 22,
                          ),
                  ),
                  Transform.translate(
                    offset: Offset(0, center ? -7 : 0),
                    child: Text(
                      _items[i].$2,
                      style: TextStyle(
                        fontSize: center ? 12.5 : 10.5,
                        color: center
                            ? const Color(0xFF294A80)
                            : (selected ? AppColors.orange : AppColors.muted),
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
