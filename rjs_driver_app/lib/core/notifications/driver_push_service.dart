import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/driver_api_service.dart';
import 'driver_notification_store.dart';

class DriverPushService {
  static const _foregroundAlertsKey = 'driver_foreground_alerts';
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();
  static bool _configured = false;

  static Future<void> initialize() async {
    if (!Platform.isAndroid) {
      return; // Android is the currently configured driver target.
    }
    try {
      await Firebase.initializeApp();
      _configured = true;
      FirebaseMessaging.instance.onTokenRefresh.listen(
        (token) => _registerIfSignedIn(token),
      );
      FirebaseMessaging.onMessage.listen((message) {
        DriverNotificationStore.refreshUnreadCount().catchError((_) {});
        SharedPreferences.getInstance().then((preferences) {
          if (preferences.getBool(_foregroundAlertsKey) == false) return;
          final title = message.notification?.title ?? 'Scheduled ride update';
          final body = message.notification?.body ?? '';
          messengerKey.currentState?.showSnackBar(
            SnackBar(content: Text(body.isEmpty ? title : '$title\n$body'), behavior: SnackBarBehavior.floating, duration: const Duration(seconds: 6)),
          );
        });
      });
      FirebaseMessaging.onMessageOpenedApp.listen(
        (_) => DriverNotificationStore.refreshUnreadCount().catchError((_) {}),
      );
    } catch (_) {
      // No google-services.json yet: keep the rest of the driver app usable.
      _configured = false;
    }
  }

  static Future<void> registerCurrentDevice() async {
    if (!_configured || await DriverApiService.session() == null) return;
    try {
      final settings = await FirebaseMessaging.instance.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _registerIfSignedIn(token);
    } catch (_) {
      // A fresh token will be registered on the next driver home load.
    }
  }

  static Future<void> _registerIfSignedIn(String token) async {
    if (await DriverApiService.session() == null) return;
    try {
      await DriverApiService.registerPushToken(token);
    } catch (_) {
      // Keep the token locally; registration is retried at the next home load.
    }
  }

  static Future<void> unregisterCurrentDevice() async {
    if (!_configured) return;
    try {
      await DriverApiService.unregisterPushToken();
    } catch (_) {}
    try {
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {}
    DriverNotificationStore.clear();
  }

  static Future<void> applyPreferences(Map<String, bool> preferences) async {
    final storage = await SharedPreferences.getInstance();
    await storage.setBool(_foregroundAlertsKey, preferences['foregroundAlerts'] ?? true);
    if (preferences['pushEnabled'] == false) {
      await unregisterPushTokenOnly();
    } else {
      await registerCurrentDevice();
    }
  }

  static Future<void> unregisterPushTokenOnly() async {
    if (!_configured) return;
    try { await DriverApiService.unregisterPushToken(); } catch (_) {}
  }
}
