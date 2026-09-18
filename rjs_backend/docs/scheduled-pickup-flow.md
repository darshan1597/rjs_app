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

## Android setup required

The driver app now uses google_maps_flutter. Create rjs_driver_app/.env locally with GOOGLE_MAPS_ANDROID_API_KEY. Use an Android SDK key restricted to com.rjstours.driver and the appropriate debug/release signing SHA-1 certificates. Enable Maps SDK for Android. Do not use the backend server key as the Android SDK key. Restart/rebuild the app after changing .env; hot reload is insufficient for Android manifest configuration.

The backend still needs its own Google server key and Routes API access. Native map preview setup currently targets Android; iOS needs its own Maps SDK initialization/key configuration before testing there.

## Infrastructure phase still pending

- Reliable closed-app reminders need a backend job scheduler, device token registration and push delivery credentials. The current preparation messages are in-app only.
- A one-hour reminder is just a baseline; longer-distance assignments need an earlier preparation policy. No automated departure notification scheduler is implemented yet.
- Redis/latest-location storage, WebSocket delivery and less-frequent MongoDB persistence are not implemented. Active tracking still uses five-second updates with database persistence and customer polling.
- Rate-limit and ETA single-flight caches are process-local. Shared caching/counters are needed before multi-instance scaling.
- Validate the new Android map and dynamic window on devices, including offline, stale GPS, long ETAs, reassignment, overdue rides and an already-active conflicting ride.
