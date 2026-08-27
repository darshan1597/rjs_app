import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class AppBottomBar extends StatefulWidget {
  const AppBottomBar({
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
  State<AppBottomBar> createState() => _AppBottomBarState();
}

class _AppBottomBarState extends State<AppBottomBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _glowController;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat();
  }

  @override
  void dispose() {
    _glowController.dispose();
    super.dispose();
  }

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
        children: List.generate(AppBottomBar._items.length, (i) {
          final center = i == 2, selected = widget.selectedIndex == i;
          return InkWell(
            onTap: () => widget.onSelected(i),
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
                            maxWidth: 82,
                            maxHeight: 82,
                            child: AnimatedBuilder(
                              animation: _glowController,
                              builder: (context, child) => SizedBox(
                                width: 82,
                                height: 82,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      width: 54,
                                      height: 54,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.orange.withValues(
                                              alpha: .20,
                                            ),
                                            blurRadius: 22,
                                            spreadRadius: 10,
                                          ),
                                        ],
                                      ),
                                    ),
                                    child!,
                                    ClipOval(
                                      child: SizedBox(
                                        width: 62,
                                        height: 62,
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left:
                                                  -58 +
                                                  (150 * _glowController.value),
                                              top: -17,
                                              child: Transform.rotate(
                                                angle: -.2,
                                                child: Container(
                                                  width: 34,
                                                  height: 96,
                                                  decoration:
                                                      const BoxDecoration(
                                                        gradient: LinearGradient(
                                                          colors: [
                                                            Colors.transparent,
                                                            Color(0x00FFFFFF),
                                                            Color(0x85FFFFFF),
                                                            Color(0x00FFFFFF),
                                                            Colors.transparent,
                                                          ],
                                                          stops: [
                                                            0,
                                                            .18,
                                                            .5,
                                                            .82,
                                                            1,
                                                          ],
                                                        ),
                                                      ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              child: Image.asset(
                                'assets/images/book-fleet-popout-orange-v3-transparent.png',
                                width: 70,
                                height: 70,
                                fit: BoxFit.contain,
                              ),
                            ),
                          )
                        : Icon(
                            AppBottomBar._items[i].$1,
                            color: selected
                                ? AppColors.orange
                                : AppColors.muted,
                            size: 22,
                          ),
                  ),
                  Transform.translate(
                    offset: Offset(0, center ? -7 : 0),
                    child: Text(
                      AppBottomBar._items[i].$2,
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
