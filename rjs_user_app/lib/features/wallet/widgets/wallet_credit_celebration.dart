import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class WalletCreditCelebration extends StatefulWidget {
  const WalletCreditCelebration({super.key, required this.event});

  final Map<String, dynamic> event;

  @override
  State<WalletCreditCelebration> createState() =>
      _WalletCreditCelebrationState();
}

class _WalletCreditCelebrationState extends State<WalletCreditCelebration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final amount = (widget.event['amountPaise'] as num? ?? 0) / 100;
    final formatted = amount.toStringAsFixed(
      amount == amount.roundToDouble() ? 0 : 2,
    );

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28),
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, _) {
          final progress = Curves.easeOutCubic.transform(_controller.value);
          return Opacity(
            opacity: progress,
            child: Transform.scale(
              scale:
                  0.9 + 0.1 * Curves.easeOutBack.transform(_controller.value),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  color: Colors.white,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        height: 130,
                        width: double.infinity,
                        child: DecoratedBox(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [AppColors.blue, Color(0xFF1646B4)],
                            ),
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Positioned(
                                left: -22,
                                top: -55,
                                child: Container(
                                  width: 125,
                                  height: 125,
                                  decoration: const BoxDecoration(
                                    color: Color(0x1FFFFFFF),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              Positioned(
                                right: -18,
                                bottom: -70,
                                child: Container(
                                  width: 140,
                                  height: 140,
                                  decoration: const BoxDecoration(
                                    color: Color(0x16FFFFFF),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              for (final sparkle in const [
                                (Alignment(-0.72, -0.45), 19.0),
                                (Alignment(-0.48, 0.56), 14.0),
                                (Alignment(0.68, -0.54), 15.0),
                                (Alignment(0.79, 0.4), 20.0),
                              ])
                                Align(
                                  alignment: sparkle.$1,
                                  child: Opacity(
                                    opacity: progress,
                                    child: Transform.rotate(
                                      angle: (1 - progress) * 1.2,
                                      child: Icon(
                                        Icons.auto_awesome_rounded,
                                        size: sparkle.$2,
                                        color: AppColors.orange,
                                      ),
                                    ),
                                  ),
                                ),
                              Transform.scale(
                                scale: 0.75 + 0.25 * progress,
                                child: Container(
                                  width: 72,
                                  height: 72,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(
                                          alpha: 0.14,
                                        ),
                                        blurRadius: 18,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.celebration_rounded,
                                    color: AppColors.orange,
                                    size: 37,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'RJS WALLET',
                              style: TextStyle(
                                color: AppColors.blue,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '\u20B9$formatted credited!',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppColors.navy,
                                fontSize: 25,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 7),
                            Text(
                              widget.event['title']?.toString() ??
                                  'Money added to your RJS wallet',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 22),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: () => Navigator.pop(context),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.orange,
                                  foregroundColor: Colors.white,
                                  minimumSize: const Size.fromHeight(48),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('Great!'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
