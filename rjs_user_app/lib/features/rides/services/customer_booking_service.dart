import '../../../core/network/customer_auth_service.dart';

class CustomerBookingService {
  static Future<List<Map<String, dynamic>>> list() async {
    final data = await CustomerAuthService.authorizedGet('customer/bookings');
    return (data['bookings'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  static Future<Map<String, dynamic>> create({
    required String pickupAddress,
    required String destinationAddress,
    required String vehicleVariant,
    String? paymentMethod,
  }) async {
    final data = await CustomerAuthService.authorizedPost('customer/bookings', {
      'pickupAddress': pickupAddress,
      'destinationAddress': destinationAddress,
      'vehicleVariant': vehicleVariant,
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
