import 'package:geolocator/geolocator.dart';

import '../../../core/network/customer_auth_service.dart';
import '../models/map_place.dart';

class MapsService {
  static Future<List<Map<String, dynamic>>> autocomplete({required String input, required String sessionToken, double? latitude, double? longitude}) async {
    final query = <String, String>{
      'input': input,
      'sessionToken': sessionToken,
      if (latitude != null) 'latitude': '$latitude',
      if (longitude != null) 'longitude': '$longitude',
    };
    final data = await CustomerAuthService.authorizedGet('customer/maps/autocomplete?${Uri(queryParameters: query).query}');
    return (data['predictions'] as List<dynamic>? ?? const []).cast<Map<String, dynamic>>();
  }

  static Future<MapPlace> placeDetails(String placeId, String sessionToken) async {
    final data = await CustomerAuthService.authorizedGet('customer/maps/places/${Uri.encodeComponent(placeId)}?sessionToken=$sessionToken');
    return MapPlace.fromJson(data['place'] as Map<String, dynamic>);
  }

  static Future<MapPlace> currentPlace() async {
    if (!await Geolocator.isLocationServiceEnabled()) throw Exception('Turn on device location to use your current position');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required to select your current position');
    }
    final position = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
    try {
      return await reverseGeocode(position.latitude, position.longitude)
          .timeout(const Duration(seconds: 4));
    } catch (_) {
      // Exact coordinates are enough for routing. Do not block the customer if
      // Google reverse geocoding is temporarily slow or unavailable.
      return MapPlace(
        address: 'Current Location',
        latitude: position.latitude,
        longitude: position.longitude,
      );
    }
  }

  static Future<MapPlace> reverseGeocode(double latitude, double longitude) async {
    final query = Uri(queryParameters: {
      'latitude': '$latitude',
      'longitude': '$longitude',
    }).query;
    final data = await CustomerAuthService.authorizedGet(
      'customer/maps/reverse-geocode?$query',
    );
    return MapPlace.fromJson(data['place'] as Map<String, dynamic>);
  }
}
