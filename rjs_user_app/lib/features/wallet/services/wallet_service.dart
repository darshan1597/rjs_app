import '../../../core/network/customer_auth_service.dart';

class WalletService {
  static Future<Map<String, dynamic>> get() => CustomerAuthService.authorizedGet('customer/wallet');
  static Future<Map<String, dynamic>> topup(int amountPaise, String retryKey) =>
      CustomerAuthService.authorizedPost('customer/wallet/topups', {'amountPaise': amountPaise, 'retryKey': retryKey});
  static Future<Map<String, dynamic>> verify(String id, String paymentId, String signature) =>
      CustomerAuthService.authorizedPost('customer/wallet/topups/$id/verify', {'paymentId': paymentId, 'signature': signature});
  static Future<Map<String, dynamic>> reconcile(String id) =>
      CustomerAuthService.authorizedPost('customer/wallet/topups/$id/reconcile', const {});
  static Future<Map<String, dynamic>> markEventSeen(String id) =>
      CustomerAuthService.authorizedPost('customer/wallet/events/$id/seen', const {});
  static Future<Map<String, dynamic>?> claimCreditEvent() async {
    final data = await CustomerAuthService.authorizedPost('customer/wallet/events/claim', const {});
    final event = data['event'];
    return event is Map ? Map<String, dynamic>.from(event) : null;
  }
  static Future<Map<String, dynamic>> withdraw(int amountPaise, String vpa, String idempotencyKey) =>
      CustomerAuthService.authorizedPost('customer/wallet/withdrawals', {
        'amountPaise': amountPaise, 'vpa': vpa, 'idempotencyKey': idempotencyKey,
      });
  static Future<Map<String, dynamic>> quote(String bookingId) =>
      CustomerAuthService.authorizedGet('customer/wallet/rides/$bookingId/quote');
  static Future<Map<String, dynamic>> pay(String bookingId) =>
      CustomerAuthService.authorizedPost('customer/wallet/rides/$bookingId/pay', const {});
}
