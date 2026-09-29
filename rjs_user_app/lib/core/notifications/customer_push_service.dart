import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import '../network/customer_auth_service.dart';
import 'customer_notification_store.dart';

class CustomerPushService {
  CustomerPushService._();

  static final navigatorKey = GlobalKey<NavigatorState>();
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();
  static bool _configured = false;
  static bool _openBookingsWhenReady = false;

  static Future<void> initialize() async {
    if (!Platform.isAndroid) return;
    try {
      await Firebase.initializeApp();
      _configured = true;
      FirebaseMessaging.instance.onTokenRefresh.listen(_registerIfSignedIn);
      FirebaseMessaging.onMessage.listen((message) {
        CustomerNotificationStore.refreshUnreadCount().catchError((_) {});
        final title = message.notification?.title ?? 'Ride update';
        final body = message.notification?.body ?? '';
        messengerKey.currentState?.showSnackBar(
          SnackBar(
            content: Text(body.isEmpty ? title : '$title\n$body'),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 6),
            action: SnackBarAction(label: 'View', onPressed: _openBookings),
          ),
        );
      });
      FirebaseMessaging.onMessageOpenedApp.listen((_) {
        CustomerNotificationStore.refreshUnreadCount().catchError((_) {});
        _openBookings();
      });
      if (await FirebaseMessaging.instance.getInitialMessage() != null) {
        _openBookingsWhenReady = true;
      }
    } catch (_) {
      _configured = false;
    }
  }

  static Future<void> registerCurrentDevice() async {
    if (!_configured || await CustomerAuthService.getCachedCustomer() == null) {
      return;
    }
    try {
      final settings = await FirebaseMessaging.instance.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _registerIfSignedIn(token);
    } catch (_) {}
  }

  static Future<void> _registerIfSignedIn(String token) async {
    if (await CustomerAuthService.getCachedCustomer() == null) return;
    try {
      await CustomerAuthService.registerPushToken(token);
    } catch (_) {}
  }

  static Future<void> applyPreferences(Map<String, bool> preferences) async {
    if (preferences['pushEnabled'] == false) {
      await unregisterTokenOnly();
    } else {
      await registerCurrentDevice();
    }
  }

  static Future<void> unregisterTokenOnly() async {
    if (!_configured) return;
    try {
      await CustomerAuthService.unregisterPushToken();
    } catch (_) {}
  }

  static Future<void> unregisterCurrentDevice() async {
    await unregisterTokenOnly();
    if (_configured) {
      try {
        await FirebaseMessaging.instance.deleteToken();
      } catch (_) {}
    }
    CustomerNotificationStore.clear();
  }

  static void handlePendingNavigation() {
    if (!_openBookingsWhenReady) return;
    _openBookingsWhenReady = false;
    _openBookings();
  }

  static void _openBookings() {
    final navigator = navigatorKey.currentState;
    if (navigator == null) {
      _openBookingsWhenReady = true;
      return;
    }
    navigator.pushNamed('/bookings');
  }
}
