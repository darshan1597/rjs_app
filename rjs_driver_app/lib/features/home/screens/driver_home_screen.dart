import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/location/driver_location_service.dart';
import '../../../core/notifications/driver_push_service.dart';
import '../../../core/notifications/driver_notification_store.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../rides/screens/ride_history_screen.dart';
import '../../support/screens/contact_support_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';
import '../../trips/screens/pickup_preview_screen.dart';
import '../widgets/active_trip_card.dart';
import '../widgets/driver_dashboard_sections.dart';
import '../widgets/driver_home_header.dart';
import '../widgets/incoming_ride_sheet.dart';
import '../widgets/vehicle_card.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  int _selectedIndex = 0;
  bool _isOnline = true;
  bool _offerOpen = false;
  bool _changingStatus = false;
  Timer? _offerTimer;
  Map<String, dynamic>? _activeTrip;
  Map<String, dynamic>? _driver;
  Map<String, dynamic>? _dashboard;
  DateTime? _dashboardLoadedAt;
  bool _dashboardLoading = false;
  bool _tripBusy = false;

  @override
  void initState() {
    super.initState();
    DriverPushService.registerCurrentDevice();
    DriverNotificationStore.refreshUnreadCount().catchError((_) {});
    DriverApiService.session().then((session) {
      if (mounted) {
        setState(() => _driver = session?['driver'] as Map<String, dynamic>?);
      }
    });
    _startOnlineMode();
  }

  Future<void> _startOnlineMode() async {
    _offerTimer?.cancel();
    _offerTimer = Timer.periodic(
      const Duration(seconds: 4),
      (_) => _pollOffers(),
    );
    try {
      final data = await DriverApiService.get('driver/auth/me');
      if (!mounted) return;
      final driver = data['driver'] as Map<String, dynamic>;
      setState(() {
        _driver = driver;
        _isOnline = driver['operationalStatus'] != 'OFFLINE';
      });
    } catch (error) {
      if (!mounted) return;
      _showError(error);
    }
    await _pollOffers();
  }

  @override
  void dispose() {
    _offerTimer?.cancel();
    super.dispose();
  }

  void _showError(Object error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
    );
  }

  Future<void> _changeAvailability() async {
    if (_changingStatus) return;
    final next = !_isOnline;
    setState(() => _changingStatus = true);
    try {
      final activeTrip = await DriverApiService.activeTrip();
      if (!mounted) return;
      if (activeTrip != null) {
        setState(() {
          _activeTrip = activeTrip;
          _isOnline = true;
        });
        await DriverLocationService.ensureRunning(activeTrip);
        _showError('You have an active ride. Continue it from the card above.');
        return;
      }
      await DriverApiService.setOnline(next);
      if (!mounted) return;
      setState(() => _isOnline = next);
      if (next) {
        await _pollOffers();
      }
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      if (mounted) setState(() => _changingStatus = false);
    }
  }

  Future<void> _pollOffers() async {
    if (_offerOpen || !mounted) return;
    unawaited(_refreshDashboard());
    try {
      final activeTrip = await DriverApiService.activeTrip();
      if (!mounted) return;
      setState(() => _activeTrip = activeTrip);
      if (activeTrip != null) {
        setState(() => _isOnline = true);
        await DriverLocationService.ensureRunning(activeTrip);
        return;
      }
      await DriverLocationService.stop();
      if (!_isOnline) return;
      final offers = await DriverApiService.offers();
      if (!mounted || offers.isEmpty || _offerOpen || !_isOnline) return;
      await _showOffer(offers.first);
    } catch (_) {
      // A polling failure is retried silently on the next interval.
    }
  }

  Future<void> _refreshDashboard({bool force = false}) async {
    if (_dashboardLoading) return;
    if (!force &&
        _dashboardLoadedAt != null &&
        DateTime.now().difference(_dashboardLoadedAt!) <
            const Duration(seconds: 30)) {
      return;
    }
    _dashboardLoading = true;
    try {
      final dashboard = await DriverApiService.dashboard();
      if (!mounted) return;
      setState(() {
        _dashboard = dashboard;
        _dashboardLoadedAt = DateTime.now();
      });
    } catch (_) {
      // Keep the most recent dashboard while a background refresh is retried.
    } finally {
      _dashboardLoading = false;
    }
  }

  Future<void> _openScheduledTrips() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => const ScheduledRidesScreen()),
    );
    if (mounted) await _refreshDashboard(force: true);
  }

  Future<void> _openEarnings() async {
    await Navigator.of(context)
        .push<void>(MaterialPageRoute(builder: (_) => const EarningsScreen()));
    if (mounted) await _refreshDashboard(force: true);
  }

  Future<void> _showOffer(Map<String, dynamic> offer) async {
    _offerOpen = true;
    final bookingId = offer['id'].toString();
    try {
      await showModalBottomSheet<void>(
        context: context,
        isDismissible: false,
        enableDrag: false,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        builder: (sheetContext) => IncomingRideSheet(
          offer: offer,
          onReject: () async {
            await DriverApiService.reject(bookingId);
            if (sheetContext.mounted) Navigator.pop(sheetContext);
          },
          onAccept: () async {
            try {
              await DriverLocationService.prepareForAcceptedRide();
              await DriverApiService.accept(bookingId);
              if (sheetContext.mounted) Navigator.pop(sheetContext);
              if (mounted) {
                final activeTrip = await DriverApiService.activeTrip();
                await DriverLocationService.ensureRunning(activeTrip);
                await _refreshDashboard(force: true);
                await _pollOffers();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Ride accepted. You can start towards the pickup.',
                    ),
                  ),
                );
              }
            } catch (error) {
              if (sheetContext.mounted) Navigator.pop(sheetContext);
              if (mounted) _showError(error);
            }
          },
        ),
      );
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      _offerOpen = false;
    }
  }

  Future<String?> _askForOtp() => showDialog<String>(
    context: context,
    builder: (dialogContext) {
      final controller = TextEditingController();
      return AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Enter Trip OTP',
          style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w900),
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(hintText: '6-digit OTP'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.pop(dialogContext, controller.text.trim()),
            child: const Text('Start Trip'),
          ),
        ],
      );
    },
  );

  Future<void> _advanceTrip({bool arrive = false}) async {
    final trip = _activeTrip;
    if (trip == null || _tripBusy) return;
    final id = trip['id'].toString();
    final status = trip['status'].toString();
    if (arrive && status != 'DRIVER_EN_ROUTE') return;
    if (!arrive &&
        {'ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'}.contains(status)) {
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => PickupPreviewScreen(trip: trip)),
      );
      if (mounted) await _pollOffers();
      return;
    }
    String? otp;
    if (status == 'ARRIVED') {
      otp = await _askForOtp();
      if (otp == null) return;
    }
    Map<String, double>? charges;
    if (status == 'IN_PROGRESS') {
      charges = await _askForFinalCharges();
      if (charges == null) return;
    }
    setState(() => _tripBusy = true);
    try {
      final updated = switch (status) {
        'ASSIGNED' => await DriverApiService.markEnRoute(id),
        'DRIVER_ACCEPTED' => await DriverApiService.markEnRoute(id),
        'DRIVER_EN_ROUTE' => await DriverApiService.markArrived(id),
        'ARRIVED' => await DriverApiService.startTrip(id, otp!),
        'IN_PROGRESS' => await DriverApiService.completeTrip(
          id,
          parkingCharge: charges!['parkingCharge']!,
          tollCharge: charges['tollCharge']!,
        ),
        'PAYMENT_PENDING' => await DriverApiService.paymentQr(id),
        _ => await DriverApiService.activeTrip(),
      };
      if (mounted) setState(() => _activeTrip = updated);
      await _refreshDashboard(force: true);
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      if (mounted) setState(() => _tripBusy = false);
    }
  }

  Future<void> _markCustomerNoShow() async {
    final trip = _activeTrip;
    if (trip == null || _tripBusy) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Customer no-show?'),
        content: const Text(
          'Only mark this if you are at the pickup and the customer has not appeared after 10 minutes. The ride will end without a charge.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Keep waiting'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Mark no-show'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _tripBusy = true);
    try {
      await DriverApiService.markCustomerNoShow(trip['id'].toString());
      await DriverLocationService.stop();
      if (!mounted) return;
      setState(() => _activeTrip = null);
      await _refreshDashboard(force: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Customer no-show recorded')),
      );
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      if (mounted) setState(() => _tripBusy = false);
    }
  }

  Future<Map<String, double>?> _askForFinalCharges() async {
    final parking = TextEditingController(text: '0');
    final toll = TextEditingController(text: '0');
    return showModalBottomSheet<Map<String, double>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          18,
          20,
          20 + MediaQuery.viewInsetsOf(sheetContext).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Complete trip & calculate bill',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Pickup waiting is calculated automatically. Enter only charges actually incurred during this ride.',
              style: TextStyle(color: AppColors.muted),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: parking,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Parking charge',
                prefixText: '₹ ',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: toll,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Toll charge',
                prefixText: '₹ ',
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                onPressed: () => Navigator.pop(sheetContext, {
                  'parkingCharge': double.tryParse(parking.text) ?? 0,
                  'tollCharge': double.tryParse(toll.text) ?? 0,
                }),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.orange,
                ),
                child: const Text(
                  'Generate final bill',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    extendBody: true,
    body: CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: SizedBox(
            height: 294,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                DriverHomeHeader(isOnline: _isOnline, driver: _driver),
                Positioned(
                  left: 0,
                  right: 0,
                  top: 215,
                  child: VehicleCard(
                    vehicle: _driver?['vehicle'] as Map<String, dynamic>?,
                  ),
                ),
                Positioned(
                  right: 20,
                  top: 117,
                  width: 170,
                  height: 112,
                  child: _DriverVehicleImage(
                    vehicle: _driver?['vehicle'] as Map<String, dynamic>?,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: EdgeInsets.fromLTRB(
            15,
            8,
            15,
            100 + MediaQuery.paddingOf(context).bottom,
          ),
          sliver: SliverList.list(
            children: [
              if (_activeTrip != null) ...[
                ActiveTripCard(
                  trip: _activeTrip!,
                  busy: _tripBusy,
                  onAction: _advanceTrip,
                  onArrived: () => _advanceTrip(arrive: true),
                  onCustomerNoShow: _markCustomerNoShow,
                ),
                const SizedBox(height: 11),
              ],
              TodayOverview(
                data: _dashboard?['today'] as Map<String, dynamic>?,
                onSeeAll: _openEarnings,
              ),
              const SizedBox(height: 11),
              NextTripCard(
                trip: _dashboard?['nextTrip'] as Map<String, dynamic>?,
                upcomingCount:
                    (_dashboard?['upcomingCount'] as num?)?.toInt() ?? 0,
                onTap: _openScheduledTrips,
              ),
              const SizedBox(height: 11),
              QuickActions(
                onLocation: () {
                  if (_activeTrip == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('No active pickup or trip to navigate to.')),
                    );
                  } else {
                    unawaited(_advanceTrip());
                  }
                },
                onEarnings: () => unawaited(_openEarnings()),
                onHistory: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const RideHistoryScreen()),
                ),
                onEmergency: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const ContactSupportScreen()),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
    bottomNavigationBar: DriverBottomBar(
      selectedIndex: _selectedIndex,
      isOnline: _isOnline,
      onSelected: (value) {
        if (value == 1) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(
              builder: (_) => const ScheduledRidesScreen(),
            ),
          );
          return;
        }
        if (value == 3) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const EarningsScreen()),
          );
          return;
        }
        if (value == 4) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(
              builder: (_) => const DriverProfileScreen(),
            ),
          );
          return;
        }
        setState(() => _selectedIndex = value);
      },
      onStatusTap: _changingStatus ? () {} : _changeAvailability,
    ),
  );
}

class _DriverVehicleImage extends StatelessWidget {
  const _DriverVehicleImage({required this.vehicle});
  final Map<String, dynamic>? vehicle;
  @override
  Widget build(BuildContext context) {
    final source = DriverApiService.absoluteUrl(
      vehicle?['masterPhoto']?.toString(),
    );
    return source.isEmpty
        ? Image.asset(
            'assets/images/driver-car-final.png',
            fit: BoxFit.contain,
            alignment: Alignment.bottomRight,
          )
        : Image.network(
            source,
            fit: BoxFit.contain,
            alignment: Alignment.bottomRight,
            errorBuilder: (_, __, ___) => Image.asset(
              'assets/images/driver-car-final.png',
              fit: BoxFit.contain,
            ),
          );
  }
}
