import '../../../core/network/customer_auth_service.dart';

class CustomerBookingService {
  static Future<Map<String, dynamic>> vehicleCatalog({required double pickupLatitude, required double pickupLongitude, required double destinationLatitude, required double destinationLongitude}) async {
    final query = Uri(queryParameters: {
      'pickupLatitude': '$pickupLatitude',
      'pickupLongitude': '$pickupLongitude',
      'destinationLatitude': '$destinationLatitude',
      'destinationLongitude': '$destinationLongitude',
    }).query;
    return CustomerAuthService.authorizedGet('customer/bookings/vehicle-catalog?$query');
  }

  static Future<List<Map<String, dynamic>>> list() async {
    final data = await CustomerAuthService.authorizedGet('customer/bookings');
    return (data['bookings'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<Map<String, dynamic>> create({
    required String pickupAddress,
    required String destinationAddress,
    required double pickupLatitude,
    required double pickupLongitude,
    required double destinationLatitude,
    required double destinationLongitude,
    required String categoryId,
    required String variantId,
    String? paymentMethod,
  }) async {
    final data = await CustomerAuthService.authorizedPost('customer/bookings', {
      'pickupAddress': pickupAddress,
      'destinationAddress': destinationAddress,
      'pickupLatitude': pickupLatitude,
      'pickupLongitude': pickupLongitude,
      'destinationLatitude': destinationLatitude,
      'destinationLongitude': destinationLongitude,
      'categoryId': categoryId,
      'variantId': variantId,
      'paymentMethod': ?paymentMethod,
    });
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getById(String bookingId) async {
    final data = await CustomerAuthService.authorizedGet(
      'customer/bookings/$bookingId',
    );
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> cancel(String bookingId) async {
    final data = await CustomerAuthService.authorizedPost(
      'customer/bookings/$bookingId/cancel',
      const {},
    );
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> retrySearch(String bookingId) async {
    final data = await CustomerAuthService.authorizedPost(
      'customer/bookings/$bookingId/retry-search',
      const {},
    );
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> confirmTestPayment(
    String bookingId,
  ) async {
    final data = await CustomerAuthService.authorizedPost(
      'customer/bookings/$bookingId/confirm-test-payment',
      const {},
    );
    return data['booking'] as Map<String, dynamic>;
  }
}
