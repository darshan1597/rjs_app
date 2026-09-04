import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../features/splash/screens/splash_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/support/screens/help_support_screen.dart';
import '../features/bookings/screens/bookings_screen.dart';
import '../features/about/screens/about_rjs_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/wallet/screens/wallet_screen.dart';
import '../features/saved_places/screens/saved_places_screen.dart';

class RjsApp extends StatelessWidget {
  const RjsApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'RJS Rides',
    theme: AppTheme.light,
    home: const SplashScreen(),
    routes: {
      '/home': (_) => const HomeScreen(),
      '/help-support': (_) => const HelpSupportScreen(),
      '/bookings': (_) => const BookingsScreen(),
      '/about': (_) => const AboutRjsScreen(),
      '/wallet': (_) => const WalletScreen(),
      '/profile': (_) => const ProfileScreen(),
      '/saved-places': (_) => const SavedPlacesScreen(),
    },
  );
}
