import '../../../core/network/customer_auth_service.dart';

class CustomerBookingService {
  static Future<Map<String, dynamic>> vehicleCatalog({
    required double pickupLatitude,
    required double pickupLongitude,
    required double destinationLatitude,
    required double destinationLongitude,
  }) async {
    final query = Uri(
      queryParameters: {
        'pickupLatitude': '$pickupLatitude',
        'pickupLongitude': '$pickupLongitude',
        'destinationLatitude': '$destinationLatitude',
        'destinationLongitude': '$destinationLongitude',
      },
    ).query;
    return CustomerAuthService.authorizedGet(
      'customer/bookings/vehicle-catalog?$query',
    );
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
    DateTime? scheduledFor,
    String? idempotencyKey,
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
      'scheduledFor': ?scheduledFor?.toUtc().toIso8601String(),
      'idempotencyKey': ?idempotencyKey,
    });
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getById(String bookingId) async {
    final data = await CustomerAuthService.authorizedGet(
      'customer/bookings/$bookingId',
    );
    return data['booking'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getReceipt(String bookingId) async {
    final data = await CustomerAuthService.authorizedGet(
      'customer/bookings/$bookingId/receipt',
    );
    return data['receipt'] as Map<String, dynamic>;
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

  static Future<Map<String, dynamic>> createPaymentOrder(String bookingId) =>
      CustomerAuthService.authorizedPost(
        'customer/bookings/$bookingId/payment-order',
        const {},
      );

  static Future<Map<String, dynamic>> verifyPayment({
    required String bookingId,
    required String paymentId,
    required String orderId,
    required String signature,
  }) async {
    final data = await CustomerAuthService.authorizedPost(
      'customer/bookings/$bookingId/verify-payment',
      {
        'razorpayPaymentId': paymentId,
        'razorpayOrderId': orderId,
        'razorpaySignature': signature,
      },
    );
    return data['booking'] as Map<String, dynamic>;
  }
}
