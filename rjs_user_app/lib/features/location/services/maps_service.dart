import 'dart:async';

import 'package:geolocator/geolocator.dart';

import '../../../core/network/customer_auth_service.dart';
import '../models/map_place.dart';

class MapsService {
  static MapPlace? _currentPlaceCache;
  static DateTime? _currentPlaceCachedAt;
  static Future<MapPlace>? _currentPlaceRequest;

  static MapPlace? get cachedCurrentPlace {
    final cachedAt = _currentPlaceCachedAt;
    if (cachedAt == null || DateTime.now().difference(cachedAt).inSeconds > 30) return null;
    return _currentPlaceCache;
  }
  static Future<Map<String, dynamic>> route({
    required MapPlace origin,
    required MapPlace destination,
  }) async {
    final data = await CustomerAuthService.authorizedPost(
      'customer/maps/route',
      {
        'origin': {
          'latitude': origin.latitude,
          'longitude': origin.longitude,
        },
        'destination': {
          'latitude': destination.latitude,
          'longitude': destination.longitude,
        },
      },
    );
    return data['route'] as Map<String, dynamic>;
  }

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

  static Future<MapPlace> currentPlace() {
    final cached = cachedCurrentPlace;
    if (cached != null) return Future.value(cached);
    final pending = _currentPlaceRequest;
    if (pending != null) return pending;
    final request = _loadCurrentPlace();
    _currentPlaceRequest = request;
    return request.whenComplete(() => _currentPlaceRequest = null);
  }

  static Future<MapPlace> _loadCurrentPlace() async {
    if (!await Geolocator.isLocationServiceEnabled()) throw Exception('Turn on device location to use your current position');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required to select your current position');
    }
    final position = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
    final coordinates = MapPlace(
      address: 'Current Location',
      latitude: position.latitude,
      longitude: position.longitude,
    );
    _currentPlaceCache = coordinates;
    _currentPlaceCachedAt = DateTime.now();
    unawaited(_resolveCurrentAddress(coordinates));
    return coordinates;
  }

  static Future<void> _resolveCurrentAddress(MapPlace coordinates) async {
    try {
      final resolved = await reverseGeocode(coordinates.latitude, coordinates.longitude)
          .timeout(const Duration(seconds: 4));
      if (identical(_currentPlaceCache, coordinates)) _currentPlaceCache = resolved;
    } catch (_) {
      // Address lookup must not delay map positioning or routing.
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
