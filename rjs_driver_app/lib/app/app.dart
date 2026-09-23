import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../core/network/driver_api_service.dart';
import '../core/notifications/driver_push_service.dart';
import '../features/auth/screens/driver_login_screen.dart';
import '../features/home/screens/driver_home_screen.dart';

class RjsDriverApp extends StatelessWidget {
  const RjsDriverApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'RJS Driver',
    scaffoldMessengerKey: DriverPushService.messengerKey,
    theme: AppTheme.light,
    home: const _DriverAuthGate(),
  );
}

class _DriverAuthGate extends StatelessWidget {
  const _DriverAuthGate();

  @override
  Widget build(BuildContext context) => FutureBuilder<bool>(
    future: DriverApiService.restoreSession(),
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Scaffold(
          backgroundColor: Colors.white,
          body: Center(child: CircularProgressIndicator()),
        );
      }
      return snapshot.data == true
          ? const DriverHomeScreen()
          : const DriverLoginScreen();
    },
  );
}
