import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class DriverApiException implements Exception {
  const DriverApiException(this.code, this.message, this.statusCode);

  final String code;
  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

class DriverApiService {
  static const _base = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5000',
  );
  static const _sessionKey = 'driver_session';
  static String absoluteUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    return path.startsWith('http') ? path : '$_base$path';
  }
  static Future<bool>? _refreshInProgress;

  static Map<String, dynamic> _decode(http.Response response) {
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw DriverApiException(
        decoded['error']?['code']?.toString() ?? 'REQUEST_FAILED',
        decoded['error']?['message']?.toString() ??
            'Unable to complete the request',
        response.statusCode,
      );
    }
    return decoded['data'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async => _decode(
    await http
        .post(
          Uri.parse('$_base/api/v1/$path'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15)),
  );

  static Future<void> requestOtp(String phone) async {
    await _post('driver/auth/request-otp', {'phone': phone});
  }

  static Future<void> verifyOtp(String phone, String otp) async {
    final session = await _post('driver/auth/verify-otp', {
      'phone': phone,
      'otp': otp,
    });
    await _saveSession(session);
  }

  static Future<void> _saveSession(Map<String, dynamic> value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(value));
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }

  static Future<Map<String, dynamic>?> session() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    return raw == null ? null : jsonDecode(raw) as Map<String, dynamic>;
  }

  static Future<Map<String, String>> _headers() async {
    final value = await session();
    final token = value?['tokens']?['accessToken'] as String?;
    if (token == null) throw Exception('Please sign in again');
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  static Future<bool> _refresh() {
    final current = _refreshInProgress;
    if (current != null) return current;
    final future = _performRefresh();
    _refreshInProgress = future;
    future.whenComplete(() => _refreshInProgress = null);
    return future;
  }

  static Future<bool> _performRefresh() async {
    final current = await session();
    final refreshToken = current?['tokens']?['refreshToken'] as String?;
    if (refreshToken == null) return false;
    try {
      final refreshed = await _post('driver/auth/refresh', {
        'refreshToken': refreshToken,
      });
      await _saveSession(refreshed);
      return true;
    } catch (_) {
      await clearSession();
      return false;
    }
  }

  static Future<http.Response> _authorized(
    Future<http.Response> Function(Map<String, String> headers) send,
  ) async {
    var response = await send(await _headers());
    if (response.statusCode == 401 && await _refresh()) {
      response = await send(await _headers());
    }
    return response;
  }

  static Future<Map<String, dynamic>> get(String path) async => _decode(
    await _authorized(
      (headers) => http
          .get(Uri.parse('$_base/api/v1/$path'), headers: headers)
          .timeout(const Duration(seconds: 15)),
    ),
  );

  static Future<Map<String, dynamic>> post(
    String path, [
    Map<String, dynamic> body = const {},
  ]) async => _decode(
    await _authorized(
      (headers) => http
          .post(
            Uri.parse('$_base/api/v1/$path'),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15)),
    ),
  );

  static Future<void> setOnline(bool online) async {
    _decode(
      await _authorized(
        (headers) => http
            .patch(
              Uri.parse('$_base/api/v1/driver/trips/availability'),
              headers: headers,
              body: jsonEncode({'status': online ? 'ONLINE' : 'OFFLINE'}),
            )
            .timeout(const Duration(seconds: 15)),
      ),
    );
  }

  static Future<bool> restoreSession() async {
    final current = await session();
    if (current == null) return false;
    try {
      final data = await get('driver/auth/me');
      final driver = data['driver'];
      if (driver is Map<String, dynamic>) {
        current['driver'] = driver;
        await _saveSession(current);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<List<Map<String, dynamic>>> offers() async {
    final data = await get('driver/trips/offers');
    return (data['offers'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  static Future<void> accept(String bookingId) async {
    await post('driver/trips/$bookingId/accept');
  }

  static Future<void> reject(String bookingId) async {
    await post('driver/trips/$bookingId/reject');
  }

  static Future<Map<String, dynamic>?> activeTrip() async {
    final data = await get('driver/trips/active');
    return data['trip'] as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>> markEnRoute(String bookingId) async {
    final data = await post('driver/trips/$bookingId/en-route');
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> markArrived(String bookingId) async {
    final data = await post('driver/trips/$bookingId/arrive');
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> startTrip(
    String bookingId,
    String otp,
  ) async {
    final data = await post('driver/trips/$bookingId/start', {'otp': otp});
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> completeTrip(String bookingId) async {
    final data = await post('driver/trips/$bookingId/complete');
    return data['trip'] as Map<String, dynamic>;
  }
}
