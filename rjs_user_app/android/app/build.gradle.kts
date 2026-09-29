import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val rjsEnvironment = Properties().apply {
    val environmentFile = rootProject.file("../.env")
    if (environmentFile.exists()) environmentFile.inputStream().use { stream -> load(stream) }
}

if (file("google-services.json").exists()) {
    pluginManager.apply("com.google.gms.google-services")
}

android {
    namespace = "com.rjstours.customer"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    buildFeatures {
        resValues = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.rjstours.customer"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["GOOGLE_MAPS_API_KEY"] =
            rjsEnvironment.getProperty("GOOGLE_MAPS_ANDROID_API_KEY", "")
        manifestPlaceholders["GOOGLE_MAPS_MAP_ID"] =
            rjsEnvironment.getProperty("GOOGLE_MAPS_ANDROID_MAP_ID", "")
        resValue(
            "string",
            "google_maps_map_id",
            rjsEnvironment.getProperty("GOOGLE_MAPS_ANDROID_MAP_ID", ""),
        )
        buildConfigField("String", "RJS_SUPPORT_PHONE", "\"${rjsEnvironment.getProperty("RJS_SUPPORT_PHONE", "")}\"")
        buildConfigField("String", "RJS_SUPPORT_EMAIL", "\"${rjsEnvironment.getProperty("RJS_SUPPORT_EMAIL", "support@rjstours.in")}\"")
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
