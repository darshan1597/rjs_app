import 'package:flutter/material.dart';

import 'app/app.dart';
import 'core/location/driver_location_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DriverLocationService.initialize();
  runApp(const RjsDriverApp());
}
