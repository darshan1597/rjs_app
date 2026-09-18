import 'package:flutter_test/flutter_test.dart';
import 'package:driver/core/navigation/pickup_navigation.dart';

void main() {
  test('passes the current GPS origin separately from the pickup', () {
    final url = pickupNavigationUrl(
      origin: {'latitude': 12.34, 'longitude': 77.56},
      destination: {'latitude': 12.35, 'longitude': 77.57},
    );
    expect(url.queryParameters['origin'], '12.34,77.56');
    expect(url.queryParameters['destination'], '12.35,77.57');
    expect(url.queryParameters['dir_action'], 'navigate');
    expect(url.queryParameters['travelmode'], 'driving');
  });
  test('rejects invalid coordinates rather than opening a wrong route', () {
    expect(() => pickupNavigationUrl(
      origin: {'latitude': double.nan, 'longitude': 77},
      destination: {'latitude': 12, 'longitude': 77},
    ), throwsFormatException);
  });
}
