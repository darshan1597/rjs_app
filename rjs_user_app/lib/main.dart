import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app/app.dart';
import 'core/config/google_maps_config.dart';
import 'core/notifications/customer_push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GoogleMapsConfig.initialize();
  await CustomerPushService.initialize();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );
  runApp(const RjsApp());
}
