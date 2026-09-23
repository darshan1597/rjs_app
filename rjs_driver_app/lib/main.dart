import 'package:flutter/material.dart';

import 'app/app.dart';
import 'core/location/driver_location_service.dart';
import 'core/notifications/driver_push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DriverLocationService.initialize();
  await DriverPushService.initialize();
  runApp(const RjsDriverApp());
}
