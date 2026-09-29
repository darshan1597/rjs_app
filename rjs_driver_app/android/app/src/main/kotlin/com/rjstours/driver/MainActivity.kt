package com.rjstours.driver

import android.app.Activity
import android.content.Intent
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val exportRequestCode = 7301
    private var pendingExport: MethodChannel.Result? = null
    private var pendingCsv: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "rjs.driver/files")
            .setMethodCallHandler { call, result ->
                if (call.method != "exportCsv") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                if (pendingExport != null) {
                    result.error("EXPORT_BUSY", "Another export is already open", null)
                    return@setMethodCallHandler
                }
                pendingExport = result
                pendingCsv = call.argument<String>("content") ?: ""
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "text/csv"
                    putExtra(Intent.EXTRA_TITLE, call.argument<String>("fileName") ?: "RJS-ride-history.csv")
                }
                startActivityForResult(intent, exportRequestCode)
            }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "rjs.driver/config")
            .setMethodCallHandler { call, result ->
                if (call.method == "support") {
                    result.success(mapOf("phone" to BuildConfig.RJS_SUPPORT_PHONE, "email" to BuildConfig.RJS_SUPPORT_EMAIL))
                } else result.notImplemented()
            }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != exportRequestCode) return
        val result = pendingExport
        try {
            if (resultCode != Activity.RESULT_OK || data?.data == null) {
                result?.success(false)
            } else {
                contentResolver.openOutputStream(data.data!!)?.use {
                    it.write((pendingCsv ?: "").toByteArray(Charsets.UTF_8))
                } ?: throw IllegalStateException("Unable to open the selected file")
                result?.success(true)
            }
        } catch (error: Exception) {
            result?.error("EXPORT_FAILED", error.message, null)
        } finally {
            pendingExport = null
            pendingCsv = null
        }
    }
}
