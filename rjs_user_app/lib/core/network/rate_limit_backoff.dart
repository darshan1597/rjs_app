import 'package:http/http.dart' as http;

// Mirror the backend buckets so tracking cooldowns do not block ride actions.
class RateLimitBackoff {
  static final Map<String, DateTime> _retryAt = {};

  static String scope(String method, Uri uri) {
    final path = uri.path.replaceFirst(RegExp(r'/$'), '');
    if (method == 'PATCH' && path == '/api/v1/driver/trips/location')
      return 'gps';
    if (method == 'GET' &&
        (RegExp(r'^/api/v1/driver/trips/(active|offers|scheduled)$')
                .hasMatch(path) ||
            RegExp(r'^/api/v1/customer/bookings/[a-fA-F0-9]{24}$')
                .hasMatch(path)))
      return 'tracking';
    if (method != 'GET' &&
        (RegExp(r'^/api/v1/driver/trips(/|$)').hasMatch(path) ||
            RegExp(r'^/api/v1/customer/bookings(/|$)').hasMatch(path)))
      return 'actions';
    return 'other';
  }

  static void check(String method, Uri uri) {
    for (final key in ['ip', scope(method, uri), endpointScope(method, uri)]) {
      final until = _retryAt[key];
      if (until != null && DateTime.now().isBefore(until)) {
        final seconds = until.difference(DateTime.now()).inSeconds + 1;
        throw Exception(
          'Too many requests. Please try again in $seconds seconds.',
        );
      }
    }
  }

  static String? endpointScope(String method, Uri uri) {
    final path = uri.path.replaceFirst(RegExp(r'/$'), '');
    if (method == 'POST' && RegExp(r'^/api/v1/driver/trips/[^/]+/pickup-preview$').hasMatch(path)) return 'fare_estimate';
    if (method == 'GET' &&
        RegExp(
          r'^/api/v1/customer/maps/(autocomplete|places/[^/]+|reverse-geocode)$',
        ).hasMatch(path))
      return 'location_search';
    if ((method == 'GET' &&
            path == '/api/v1/customer/bookings/vehicle-catalog') ||
        (method == 'POST' && path == '/api/v1/customer/maps/route'))
      return 'fare_estimate';
    if (method == 'POST' && path == '/api/v1/customer/bookings')
      return 'create_booking';
    if (method == 'POST' &&
        RegExp(r'^/api/v1/customer/bookings/[^/]+/cancel$').hasMatch(path))
      return 'cancel_booking';
    if (method == 'POST' &&
        RegExp(r'^/api/v1/driver/trips/[^/]+/(accept|reject)$').hasMatch(path))
      return 'driver_offer';
    if (method == 'POST' &&
        (RegExp(r'^/api/v1/customer/bookings/[^/]+/payment-order$')
                .hasMatch(path) ||
            RegExp(r'^/api/v1/driver/trips/[^/]+/payment-qr$').hasMatch(path)))
      return 'payment_creation';
    if (method == 'POST' &&
        RegExp(r'^/api/v1/customer/wallet/(topups(/[^/]+/reconcile)?|rides/[^/]+/pay)$').hasMatch(path)) {
      return 'payment_creation';
    }
    return null;
  }

  static void record(http.Response response) {
    if (response.statusCode != 429) return;
    final seconds = int.tryParse(response.headers['retry-after'] ?? '') ?? 60;
    final key =
        response.headers['x-ratelimit-scope'] ??
        (response.request == null
            ? 'ip'
            : scope(response.request!.method, response.request!.url));
    _retryAt[key] = DateTime.now().add(
      Duration(seconds: seconds > 0 ? seconds : 1),
    );
    throw Exception(
      'Too many requests. Please try again in ${seconds > 0 ? seconds : 1} seconds.',
    );
  }
}
