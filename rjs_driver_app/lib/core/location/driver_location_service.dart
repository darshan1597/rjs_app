import 'dart:async';
import 'dart:ui';

import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';

import '../network/driver_api_service.dart';

const _activeStatuses = {
  'DRIVER_EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'PAYMENT_PENDING',
};

class DriverLocationService {
  static final FlutterBackgroundService _service = FlutterBackgroundService();

  static Future<void> initialize() async {
    await _service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: driverLocationServiceEntryPoint,
        autoStart: false,
        autoStartOnBoot: false,
        isForegroundMode: true,
        initialNotificationTitle: 'RJS active ride',
        initialNotificationContent: 'Preparing location sharing…',
        foregroundServiceNotificationId: 2401,
        foregroundServiceTypes: const [AndroidForegroundType.location],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: driverLocationServiceEntryPoint,
        onBackground: driverLocationIosBackground,
      ),
    );
  }

  static Future<bool> _locationReady() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Turn on phone location to begin the ride');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception(
        'Precise location permission is required during an active ride',
      );
    }
    return true;
  }

  static Future<void> ensureRunning(Map<String, dynamic>? trip) async {
    final status = trip?['status']?.toString();
    if (status == null || !_activeStatuses.contains(status)) {
      await stop();
      return;
    }
    if (await _service.isRunning()) return;
    await _locationReady();
    await _service.startService();
  }

  static Future<void> stop() async {
    if (await _service.isRunning()) _service.invoke('stop');
  }

  static Future<void> prepareForAcceptedRide() async {
    await _locationReady();
  }
}

@pragma('vm:entry-point')
Future<bool> driverLocationIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void driverLocationServiceEntryPoint(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  Timer? timer;
  bool updateInFlight = false;

  service.on('stop').listen((_) async {
    timer?.cancel();
    await service.stopSelf();
  });

  if (service is AndroidServiceInstance) {
    await service.setAsForegroundService();
    await service.setForegroundNotificationInfo(
      title: 'RJS active ride',
      content: 'Sharing your live location with the customer',
    );
  }

  Future<void> sendLocation() async {
    if (updateInFlight) return;
    updateInFlight = true;
    try {
      final trip = await DriverApiService.activeTrip();
      final status = trip?['status']?.toString();
      if (status == null || !_activeStatuses.contains(status)) {
        timer?.cancel();
        await service.stopSelf();
        return;
      }
      await DriverApiService.updateCurrentLocation(requestPermission: false);
      if (service is AndroidServiceInstance) {
        await service.setForegroundNotificationInfo(
          title: 'RJS ride ${trip?['bookingNumber'] ?? ''}',
          content: 'Live location sharing is active',
        );
      }
    } catch (_) {
      // Keep the service alive and retry after transient GPS, token or network failures.
    } finally {
      updateInFlight = false;
    }
  }

  await sendLocation();
  timer = Timer.periodic(const Duration(seconds: 5), (_) => sendLocation());
}
