# Scheduled pickup preparation

## Implemented

- Driver Trips immediately displays admin-assigned scheduled rides and See Location.
- See Location obtains one fresh GPS fix and calls POST /api/v1/driver/trips/:id/pickup-preview with latitude, longitude and recordedAt. The backend verifies assignment ownership and calculates the driving route, ETA and distance.
- Preview alone does not change ride status or start customer tracking. It works while offline; starting pickup requires going online.
- Backend recommended departure = scheduled pickup - route ETA - 15 minutes. No fixed one-hour start window remains. ETA is required; no guessed fallback is used.
- Routes are cached per assignment/driver for up to five minutes and reused if the new GPS fix is within 250 metres. Lists/status polling do not call Google Routes. The open preview refreshes near departure, at most once every two minutes; there is no background pre-trip GPS loop.
- Start to Pickup obtains another fresh GPS fix. Backend validates its age (maximum two minutes), recalculates ETA, checks the dynamic departure window, rejects overdue/unassigned/offline/conflicting rides, and then transitions to DRIVER_EN_ROUTE.
- Foreground tracking begins only for DRIVER_EN_ROUTE/ARRIVED/IN_PROGRESS/PAYMENT_PENDING, not ASSIGNED or DRIVER_ACCEPTED. Going online sends one location update when permission is already available.
- Trips includes in-app preparation/time-to-start messages. Pickup overdue handling remains unchanged for unstarted rides.
- A minute-based backend worker now persists one-hour preparation reminders, route-check reminders shortly before the estimated departure (or 30 minutes before pickup without an ETA), and departure reminders when a fresh route ETA plus the 15-minute buffer says to start. Going online sends one GPS fix and computes an initial route for the nearest assigned pickup within three hours; there is no continuous pre-trip GPS loop. Reminders are keyed by booking, assigned driver, scheduled time and kind; reassigned, cancelled, overdue or already-started rides are checked again before delivery.
- Customers receive separate durable reminders at approximately 60 minutes and 15 minutes before a scheduled pickup. These reminders are deduplicated by booking, customer, scheduled time and reminder kind, appear in the in-app notification inbox, and are revalidated before push delivery so cancelled or already-started rides are not announced.
- The driver app registers its Firebase device token after login, displays scheduled-ride reminders in its notification panel, and unregisters the token on logout. Firebase Cloud Messaging can deliver these alerts while the app is closed once configured. Without Firebase credentials, due reminders remain visible in-app and push delivery is retried.

## Firebase setup required for closed-app reminders

1. Create an Android app with package `com.rjstours.driver` in a Firebase project and enable Firebase Cloud Messaging. Put its `google-services.json` at `rjs_driver_app/android/app/google-services.json` (ignored by Git). Rebuild the APK; hot reload does not install native plugins or configuration.
2. Create a Firebase service account with permission to send FCM messages. Store its JSON outside the repository. Set `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` in the backend environment. Restart the backend.
3. Permit notifications on the driver's Android phone. The driver must open the rebuilt app and log in or visit Home once so its token can be registered. Confirm `GET /api/v1/driver/reminders` shows due reminders and a notification appears while the app is backgrounded.

Android force-stop prevents FCM delivery until the app is reopened. iOS push setup is not included yet. A live Firebase project, service-account credentials and device delivery have not been verified in this workspace.

## Android setup required

The driver app now uses google_maps_flutter. Create rjs_driver_app/.env locally with GOOGLE_MAPS_ANDROID_API_KEY. Use an Android SDK key restricted to com.rjstours.driver and the appropriate debug/release signing SHA-1 certificates. Enable Maps SDK for Android. Do not use the backend server key as the Android SDK key. Restart/rebuild the app after changing .env; hot reload is insufficient for Android manifest configuration.

The backend still needs its own Google server key and Routes API access. Native map preview setup currently targets Android; iOS needs its own Maps SDK initialization/key configuration before testing there.

## Infrastructure phase still pending

- The one-hour preparation reminder is a baseline; longer-distance assignments may need an earlier policy. A departure push requires a fresh ETA. If none is available, the driver receives a route-check reminder instead of an invented departure time.
- Reminder delivery is at-least-once after a crash during FCM send. Android notification tags replace duplicates in the tray, but duplicate in-app delivery should still be monitored. The worker scans at most 300 upcoming rides per minute and should be replaced with a scalable job queue before larger deployments.
- Redis/latest-location storage, WebSocket delivery and less-frequent MongoDB persistence are not implemented. Active tracking still uses five-second updates with database persistence and customer polling.
- Rate-limit and ETA single-flight caches are process-local. Shared caching/counters are needed before multi-instance scaling.
- Validate the new Android map and dynamic window on devices, including offline, stale GPS, long ETAs, reassignment, overdue rides and an already-active conflicting ride.
