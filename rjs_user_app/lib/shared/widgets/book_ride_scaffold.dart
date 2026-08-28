import 'dart:ui';

import 'package:flutter/material.dart';

import 'app_bottom_bar.dart';
import 'book_ride_popup.dart';

class BookRideScaffold extends StatefulWidget {
  const BookRideScaffold({
    super.key,
    required this.body,
    required this.selectedIndex,
    required this.onSelected,
    this.backgroundColor,
  });

  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final Color? backgroundColor;

  @override
  State<BookRideScaffold> createState() => _BookRideScaffoldState();
}

class _BookRideScaffoldState extends State<BookRideScaffold>
    with SingleTickerProviderStateMixin {
  bool _showPopup = false;
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
      reverseDuration: const Duration(milliseconds: 320),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      extendBody: true,
      backgroundColor: widget.backgroundColor,
      body: Stack(
        children: [
          widget.body,
          Positioned.fill(
            child: IgnorePointer(
              ignoring: !_showPopup,
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  final progress = Curves.easeOutCubic.transform(
                    _controller.value,
                  );
                  return BackdropFilter(
                    filter: ImageFilter.blur(
                      sigmaX: 7 * progress,
                      sigmaY: 7 * progress,
                    ),
                    child: ColoredBox(
                      color: Colors.black.withValues(alpha: .12 * progress),
                      child: child,
                    ),
                  );
                },
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: _closePopup,
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 104 + bottomInset,
            child: IgnorePointer(
              ignoring: !_showPopup,
              child: AnimatedBuilder(
                animation: _controller,
                child: BookRidePopup(onVehicleSelected: (_) => _closePopup()),
                builder: (context, child) {
                  final progress = const Cubic(
                    .2,
                    .85,
                    .25,
                    1,
                  ).transform(_controller.value);
                  final opacity = Curves.easeOut.transform(
                    (progress * 1.35).clamp(0.0, 1.0),
                  );
                  return Opacity(
                    opacity: opacity,
                    child: Transform.translate(
                      offset: Offset(0, 155 * (1 - progress)),
                      child: Transform(
                        alignment: Alignment.bottomCenter,
                        transform: Matrix4.diagonal3Values(
                          .18 + (.82 * progress),
                          .52 + (.48 * progress),
                          1,
                        ),
                        child: child,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: AppBottomBar(
        selectedIndex: widget.selectedIndex,
        onSelected: (index) {
          if (index == 2) {
            _togglePopup();
            return;
          }
          if (_showPopup) _closePopup();
          if (index == widget.selectedIndex) return;
          final route = switch (index) {
            0 => '/home',
            1 => '/bookings',
            3 => '/wallet',
            4 => '/profile',
            _ => null,
          };
          if (route != null) {
            Navigator.of(context).pushNamedAndRemoveUntil(route, (_) => false);
            return;
          }
          widget.onSelected(index);
        },
      ),
    );
  }

  void _togglePopup() {
    if (_showPopup) {
      _closePopup();
    } else {
      setState(() => _showPopup = true);
      _controller.forward(from: 0);
    }
  }

  void _closePopup() {
    if (!_showPopup) return;
    setState(() => _showPopup = false);
    _controller.reverse();
  }
}
