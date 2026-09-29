package com.rjstours.customer

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "com.rjstours.customer/config",
        ).setMethodCallHandler { call, result ->
            if (call.method == "getGoogleMapsMapId") {
                result.success(getString(R.string.google_maps_map_id).ifBlank { null })
            } else if (call.method == "getSupportConfig") {
                result.success(mapOf(
                    "phone" to BuildConfig.RJS_SUPPORT_PHONE,
                    "email" to BuildConfig.RJS_SUPPORT_EMAIL,
                ))
            } else {
                result.notImplemented()
            }
        }
    }
}
