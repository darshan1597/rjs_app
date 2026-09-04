import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CustomerAuthService {
  static const _base = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5000',
  );
  static const _sessionKey = 'customer_session';
  static bool _refreshing = false;

  static Uri _uri(String path) =>
      Uri.parse('$_base/api/v1/customer/auth/$path');
  static Uri _apiUri(String path) => Uri.parse('$_base/api/v1/$path');

  static Map<String, dynamic> _decode(http.Response response) {
    Map<String, dynamic> decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception('The server returned an invalid response');
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        decoded['error']?['message'] ?? 'Unable to complete the request',
      );
    }
    return decoded['data'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await http
        .post(
          _uri(path),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15));
    return _decode(response);
  }

  static Future<void> requestOtp(String phone) async {
    await _post('request-otp', {'phone': phone});
  }

  static Future<Map<String, dynamic>> verifyOtp(String phone, String otp) =>
      _post('verify-otp', {'phone': phone, 'otp': otp});

  static Future<Map<String, dynamic>> completeProfile(
    String token,
    String name,
    String email,
  ) => _post('complete-profile', {
    'registrationToken': token,
    'name': name,
    'email': email,
  });

  static Future<Map<String, dynamic>?> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      await prefs.remove(_sessionKey);
      return null;
    }
  }

  static Future<void> saveSession(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(data));
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }

  static Future<bool> _refreshSession() async {
    if (_refreshing) {
      for (var attempt = 0; attempt < 30 && _refreshing; attempt++) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
      }
      return await _loadSession() != null;
    }

    _refreshing = true;
    try {
      final session = await _loadSession();
      final refreshToken = session?['tokens']?['refreshToken'] as String?;
      if (refreshToken == null) return false;
      final refreshed = await _post('refresh', {'refreshToken': refreshToken});
      await saveSession(refreshed);
      return true;
    } catch (_) {
      await clearSession();
      return false;
    } finally {
      _refreshing = false;
    }
  }

  static Future<http.Response?> _authorizedRequest(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retryAfterRefresh = true,
  }) async {
    final session = await _loadSession();
    final accessToken = session?['tokens']?['accessToken'] as String?;
    if (accessToken == null) return null;

    final headers = {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    };
    final uri = _apiUri(path);
    final request = switch (method) {
      'GET' => http.get(uri, headers: headers),
      'POST' => http.post(uri, headers: headers, body: jsonEncode(body ?? {})),
      'PATCH' => http.patch(
        uri,
        headers: headers,
        body: jsonEncode(body ?? {}),
      ),
      'DELETE' => http.delete(
        uri,
        headers: headers,
        body: jsonEncode(body ?? {}),
      ),
      _ => throw ArgumentError('Unsupported request method: $method'),
    };
    final response = await request.timeout(const Duration(seconds: 15));

    if (response.statusCode == 401 &&
        retryAfterRefresh &&
        await _refreshSession()) {
      return _authorizedRequest(
        method,
        path,
        body: body,
        retryAfterRefresh: false,
      );
    }
    return response;
  }

  static Future<Map<String, dynamic>> authorizedGet(String path) async {
    final response = await _authorizedRequest('GET', path);
    if (response == null) throw Exception('Please sign in again');
    return _decode(response);
  }

  static Future<Map<String, dynamic>> authorizedPost(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await _authorizedRequest('POST', path, body: body);
    if (response == null) throw Exception('Please sign in again');
    return _decode(response);
  }

  static Future<Map<String, dynamic>> authorizedPatch(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await _authorizedRequest('PATCH', path, body: body);
    if (response == null) throw Exception('Please sign in again');
    return _decode(response);
  }

  static Future<Map<String, dynamic>> authorizedDelete(String path) async {
    final response = await _authorizedRequest('DELETE', path);
    if (response == null) throw Exception('Please sign in again');
    return _decode(response);
  }

  static Future<Map<String, dynamic>?> getMe() async {
    final response = await _authorizedRequest('GET', 'customer/auth/me');
    if (response == null || response.statusCode == 401) {
      await clearSession();
      return null;
    }
    return _decode(response)['customer'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>?> getCachedCustomer() async {
    final session = await _loadSession();
    return session?['customer'] as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>> updateProfile(
    String name,
    String email,
  ) async {
    final data = await authorizedPatch('customer/auth/me', {
      'name': name,
      'email': email,
    });
    final customer = data['customer'] as Map<String, dynamic>;
    final session = await _loadSession();
    if (session != null) {
      session['customer'] = customer;
      await saveSession(session);
    }
    return customer;
  }

  static Future<bool> restoreSession() async {
    try {
      return await getMe() != null;
    } catch (_) {
      // Keep the session during temporary network outages. Protected requests
      // will retry refresh when connectivity returns.
      return await _loadSession() != null;
    }
  }

  static Future<void> logout() async {
    final session = await _loadSession();
    final refreshToken = session?['tokens']?['refreshToken'] as String?;
    try {
      if (refreshToken != null) {
        await _post('logout', {'refreshToken': refreshToken});
      }
    } catch (_) {
      // Local logout must still succeed if the device is offline.
    } finally {
      await clearSession();
    }
  }
}
