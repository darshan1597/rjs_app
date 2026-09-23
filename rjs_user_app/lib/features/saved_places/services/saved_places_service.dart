import '../../../core/network/customer_auth_service.dart';

class SavedPlacesService {
  static Future<List<Map<String, dynamic>>> getAll() async {
    final data = await CustomerAuthService.authorizedGet('customer/addresses');
    return (data['addresses'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  static Future<Map<String, dynamic>> save({
    String? id,
    required String type,
    required String label,
    required String addressLine,
    required String landmark,
    required String city,
    required String pincode,
    double? latitude,
    double? longitude,
  }) async {
    final body = {
      'type': type,
      'label': label,
      'addressLine': addressLine,
      'landmark': landmark,
      'city': city,
      'pincode': pincode,
      if (latitude != null && longitude != null)
        'location': {'latitude': latitude, 'longitude': longitude},
    };
    final data = id == null
        ? await CustomerAuthService.authorizedPost('customer/addresses', body)
        : await CustomerAuthService.authorizedPatch(
            'customer/addresses/$id',
            body,
          );
    return data['address'] as Map<String, dynamic>;
  }

  static Future<void> delete(String id) async {
    await CustomerAuthService.authorizedDelete('customer/addresses/$id');
  }
}
