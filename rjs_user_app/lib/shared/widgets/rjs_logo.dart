import 'package:flutter/material.dart';

class RjsLogo extends StatelessWidget {
  const RjsLogo({super.key, this.light = false, this.size = 29});
  final bool light;
  final double size;
  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/images/login-logo-transparent.png',
    width: size * 1.65,
    height: size * 1.65,
    fit: BoxFit.contain,
    filterQuality: FilterQuality.high,
    semanticLabel: 'RJS',
  );
}
