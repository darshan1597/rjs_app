import 'package:flutter/material.dart';

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
    duration: const Duration(milliseconds: 1300),
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
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, _) {
          final bounce = Curves.elasticOut.transform(_controller.value);
          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              for (var i = 0; i < 12; i++)
                Positioned(
                  left: 18.0 + (i % 4) * 72,
                  top: 12.0 + (i ~/ 4) * 72,
                  child: Transform.rotate(
                    angle: _controller.value * (i.isEven ? 3 : -3),
                    child: Opacity(
                      opacity: _controller.value,
                      child: Text(
                        ['🎉', '✨', '●', '◆'][i % 4],
                        style: TextStyle(
                          fontSize: 15 + (i % 3) * 3,
                          color: [
                            Colors.orange,
                            Colors.blue,
                            Colors.green,
                            Colors.pink,
                          ][i % 4],
                        ),
                      ),
                    ),
                  ),
                ),
              Transform.scale(
                scale: bounce,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(24, 30, 24, 22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(color: Color(0x33000000), blurRadius: 30),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 74,
                        height: 74,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [Color(0xFF24B96B), Color(0xFF0B8F4D)],
                          ),
                        ),
                        child: const Icon(
                          Icons.celebration_rounded,
                          color: Colors.white,
                          size: 38,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        '₹$formatted credited!',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF071332),
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        widget.event['title']?.toString() ??
                            'Money added to your RJS wallet',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF68738A),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Great!'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
