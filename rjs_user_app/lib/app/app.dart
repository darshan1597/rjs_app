import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../features/splash/screens/splash_screen.dart';

class RjsApp extends StatelessWidget {
  const RjsApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'RJS Rides',
    theme: AppTheme.light,
    home: const SplashScreen(),
  );
}
