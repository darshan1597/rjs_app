import 'package:flutter/foundation.dart';

import '../network/driver_api_service.dart';

class DriverNotificationStore {
  DriverNotificationStore._();

  static final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);
  static Future<Map<String, dynamic>>? _loadInProgress;

  static Future<Map<String, dynamic>> _load() {
    final current = _loadInProgress;
    if (current != null) return current;
    final future = DriverApiService.reminderInbox();
    _loadInProgress = future;
    future.then<void>(
      (_) => _loadInProgress = null,
      onError: (_, _) => _loadInProgress = null,
    );
    return future;
  }

  static Future<List<Map<String, dynamic>>> loadReminders() async {
    final data = await _load();
    unreadCount.value = (data['unreadCount'] as num?)?.toInt() ?? 0;
    return (data['reminders'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<void> refreshUnreadCount() async {
    final data = await _load();
    unreadCount.value = (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  static Future<void> markAllRead() async {
    await DriverApiService.markRemindersRead();
    unreadCount.value = 0;
  }

  static void clear() => unreadCount.value = 0;
}
