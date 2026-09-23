import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'rate_limit_backoff.dart';

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
  static Uri _apiUri(String path, String method) {
    final uri = Uri.parse('$_base/api/v1/$path');
    RateLimitBackoff.check(method, uri);
    return uri;
  }

  static Map<String, dynamic> _decode(http.Response response) {
    RateLimitBackoff.record(response);
    Map<String, dynamic> decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw DriverApiException(
        'INVALID_RESPONSE',
        'The server is temporarily unavailable. Please try again later.',
        response.statusCode,
      );
    }
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
  ) async {
    return _decode(
      await http
          .post(
            _apiUri(path, 'POST'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15)),
    );
  }

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

  static Future<void> registerPushToken(String token) async {
    _decode(
      await _authorized(
        (headers) => http
            .put(
              _apiUri('driver/reminders/device', 'PUT'),
              headers: headers,
              body: jsonEncode({'token': token, 'platform': 'android'}),
            )
            .timeout(const Duration(seconds: 15)),
      ),
    );
  }

  static Future<void> unregisterPushToken() async {
    _decode(
      await _authorized(
        (headers) => http
            .delete(
              _apiUri('driver/reminders/device', 'DELETE'),
              headers: headers,
            )
            .timeout(const Duration(seconds: 15)),
      ),
    );
  }

  static Future<List<Map<String, dynamic>>> reminders() async {
    final data = await get('driver/reminders');
    return (data['reminders'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<void> markRemindersRead() async {
    await post('driver/reminders/read-all');
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
          .get(_apiUri(path, 'GET'), headers: headers)
          .timeout(const Duration(seconds: 15)),
    ),
  );

  static Future<Map<String, dynamic>> post(
    String path, [
    Map<String, dynamic> body = const {},
  ]) async => _decode(
    await _authorized(
      (headers) => http
          .post(_apiUri(path, 'POST'), headers: headers, body: jsonEncode(body))
          .timeout(const Duration(seconds: 15)),
    ),
  );

  static Future<void> setOnline(bool online) async {
    _decode(
      await _authorized(
        (headers) => http
            .patch(
              _apiUri('driver/trips/availability', 'PATCH'),
              headers: headers,
              body: jsonEncode({'status': online ? 'ONLINE' : 'OFFLINE'}),
            )
            .timeout(const Duration(seconds: 15)),
      ),
    );
    final cached = await session();
    if (cached != null && cached['driver'] is Map) {
      cached['driver']['operationalStatus'] = online ? 'ONLINE' : 'OFFLINE';
      await _saveSession(cached);
    }
    if (online) {
      // One preparation update, not continuous idle/scheduled tracking.
      try {
        await updateCurrentLocation(requestPermission: false);
      } catch (_) {}
    }
  }

  static Future<void> updateCurrentLocation({
    bool requestPermission = true,
  }) async {
    if (!await Geolocator.isLocationServiceEnabled()) return;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied && requestPermission) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return;
    }
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    _decode(
      await _authorized(
        (headers) => http
            .patch(
              _apiUri('driver/trips/location', 'PATCH'),
              headers: headers,
              body: jsonEncode({
                'latitude': position.latitude,
                'longitude': position.longitude,
                'accuracyMetres': position.accuracy,
                'heading': position.heading < 0 ? 0 : position.heading,
                'speedMetresPerSecond': position.speed < 0 ? 0 : position.speed,
                'recordedAt': position.timestamp.toUtc().toIso8601String(),
              }),
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

  static Future<List<Map<String, dynamic>>> scheduledTrips() async {
    final data = await get('driver/trips/scheduled');
    return (data['trips'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<Map<String, dynamic>> markEnRoute(String bookingId) async {
    final data = await post(
      'driver/trips/$bookingId/en-route',
      await pickupLocation(),
    );
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> pickupLocation({
    bool requirePrecise = false,
  }) async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Turn on phone location');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required');
    }
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    ).timeout(const Duration(seconds: 15));
    if (requirePrecise) {
      final age = DateTime.now().difference(position.timestamp);
      if (age > const Duration(seconds: 30) ||
          age < const Duration(seconds: -30) ||
          !position.accuracy.isFinite ||
          position.accuracy < 0 ||
          position.accuracy > 50) {
        throw Exception(
          'Your GPS location is not accurate enough yet. Enable precise location, move outdoors, and try again.',
        );
      }
    }
    return {
      'latitude': position.latitude,
      'longitude': position.longitude,
      'recordedAt': position.timestamp.toUtc().toIso8601String(),
    };
  }

  static Future<Map<String, dynamic>> pickupPreview(String bookingId) async =>
      post('driver/trips/$bookingId/pickup-preview', await pickupLocation());

  static Future<Map<String, dynamic>> markArrived(String bookingId) async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Turn on device location before marking arrived');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required to mark arrived');
    }
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    final data = await post('driver/trips/$bookingId/arrive', {
      'latitude': position.latitude,
      'longitude': position.longitude,
    });
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> markCustomerNoShow(String bookingId) async {
    final data = await post('driver/trips/$bookingId/customer-no-show', {});
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> startTrip(
    String bookingId,
    String otp,
  ) async {
    final data = await post('driver/trips/$bookingId/start', {'otp': otp});
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> paymentQr(String bookingId) async {
    final data = await post('driver/trips/$bookingId/payment-qr', {});
    return data['trip'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> completeTrip(
    String bookingId, {
    required double parkingCharge,
    required double tollCharge,
  }) async {
    final data = await post('driver/trips/$bookingId/complete', {
      'parkingCharge': parkingCharge,
      'tollCharge': tollCharge,
    });
    return data['trip'] as Map<String, dynamic>;
  }
}
