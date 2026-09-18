import 'package:http/http.dart' as http;
import '../lib/core/network/rate_limit_backoff.dart';

void main() {
  final tracking = Uri.parse('https://example.test/api/v1/driver/trips/active');
  final action = Uri.parse('https://example.test/api/v1/driver/trips/abc/complete');
  final gps = Uri.parse('https://example.test/api/v1/driver/trips/location');
  final booking = Uri.parse('https://example.test/api/v1/customer/bookings/6aad00f0e899a8a635eca74e');
  assert(RateLimitBackoff.scope('GET', booking) == 'tracking');
  assert(RateLimitBackoff.scope('POST', action) == 'actions');
  assert(RateLimitBackoff.scope('PATCH', gps) == 'gps');
  assert(RateLimitBackoff.endpointScope('GET', Uri.parse('https://example.test/api/v1/customer/maps/autocomplete')) == 'location_search');
  assert(RateLimitBackoff.endpointScope('POST', Uri.parse('https://example.test/api/v1/customer/bookings/abc/verify-payment')) == null);
  try {
    RateLimitBackoff.record(http.Response('Too many requests', 429,
      headers: {'retry-after': '60', 'x-ratelimit-scope': 'tracking'},
      request: http.Request('GET', tracking)));
  } catch (_) {}
  var blocked = false;
  try { RateLimitBackoff.check('GET', tracking); } catch (_) { blocked = true; }
  assert(blocked);
  RateLimitBackoff.check('POST', action);
  RateLimitBackoff.check('PATCH', gps);
  final payment = Uri.parse('https://example.test/api/v1/customer/bookings/abc/payment-order');
  try {
    RateLimitBackoff.record(http.Response('Too many requests', 429,
      headers: {'retry-after': '60', 'x-ratelimit-scope': 'payment_creation'},
      request: http.Request('POST', payment)));
  } catch (_) {}
  blocked = false;
  try { RateLimitBackoff.check('POST', payment); } catch (_) { blocked = true; }
  assert(blocked);
  RateLimitBackoff.check('POST', Uri.parse('https://example.test/api/v1/customer/bookings/abc/verify-payment'));
  RateLimitBackoff.check('POST', Uri.parse('https://example.test/api/v1/customer/bookings/abc/cancel'));
  try {
    RateLimitBackoff.record(http.Response('Too many requests', 429,
      headers: {'retry-after': '60', 'x-ratelimit-scope': 'ip'}));
  } catch (_) {}
  blocked = false;
  try { RateLimitBackoff.check('POST', action); } catch (_) { blocked = true; }
  assert(blocked);
  print('Rate-limit scope and cooldown checks passed.');
}
