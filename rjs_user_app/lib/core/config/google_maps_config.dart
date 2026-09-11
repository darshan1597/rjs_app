import 'package:flutter/services.dart';

class GoogleMapsConfig {
  GoogleMapsConfig._();

  static const MethodChannel _channel = MethodChannel(
    'com.rjstours.customer/config',
  );

  static String? mapId;

  static Future<void> initialize() async {
    try {
      final value = await _channel.invokeMethod<String>('getGoogleMapsMapId');
      final normalized = value?.trim();
      mapId = normalized == null || normalized.isEmpty ? null : normalized;
    } on PlatformException {
      mapId = null;
    } on MissingPluginException {
      mapId = null;
    }
  }
}
