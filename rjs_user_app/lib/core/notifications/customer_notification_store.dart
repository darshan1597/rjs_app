import 'package:flutter/foundation.dart';

import '../network/customer_auth_service.dart';

class CustomerNotificationStore {
  CustomerNotificationStore._();

  static final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);
  static Future<Map<String, dynamic>>? _inProgress;

  static Future<Map<String, dynamic>> _load() {
    final existing = _inProgress;
    if (existing != null) return existing;
    final request = CustomerAuthService.authorizedGet('customer/notifications');
    _inProgress = request;
    request.whenComplete(() => _inProgress = null);
    return request;
  }

  static Future<List<Map<String, dynamic>>> load() async {
    final data = await _load();
    unreadCount.value = (data['unreadCount'] as num?)?.toInt() ?? 0;
    return (data['notifications'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<void> refreshUnreadCount() async {
    final data = await _load();
    unreadCount.value = (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  static Future<void> markAllRead() async {
    await CustomerAuthService.authorizedPost(
      'customer/notifications/read-all',
      const {},
    );
    unreadCount.value = 0;
  }

  static void clear() => unreadCount.value = 0;
}
