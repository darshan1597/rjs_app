import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';
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
  bool _tripBusy = false;

  @override
  void initState() {
    super.initState();
    _startOnlineMode();
  }

  Future<void> _startOnlineMode() async {
    try {
      await DriverApiService.setOnline(true);
      _offerTimer?.cancel();
      _offerTimer = Timer.periodic(
        const Duration(seconds: 4),
        (_) => _pollOffers(),
      );
      await _pollOffers();
    } catch (error) {
      if (!mounted) return;
      setState(() => _isOnline = false);
      _showError(error);
    }
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
      await DriverApiService.setOnline(next);
      if (!mounted) return;
      setState(() => _isOnline = next);
      _offerTimer?.cancel();
      if (next) {
        _offerTimer = Timer.periodic(
          const Duration(seconds: 4),
          (_) => _pollOffers(),
        );
        await _pollOffers();
      }
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      if (mounted) setState(() => _changingStatus = false);
    }
  }

  Future<void> _pollOffers() async {
    if (!_isOnline || _offerOpen || !mounted) return;
    try {
      final activeTrip = await DriverApiService.activeTrip();
      if (!mounted) return;
      setState(() => _activeTrip = activeTrip);
      if (activeTrip != null) return;
      final offers = await DriverApiService.offers();
      if (!mounted || offers.isEmpty || _offerOpen || !_isOnline) return;
      await _showOffer(offers.first);
    } catch (_) {
      // A polling failure is retried silently on the next interval.
    }
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
              await DriverApiService.accept(bookingId);
              if (sheetContext.mounted) Navigator.pop(sheetContext);
              if (mounted) {
                await _pollOffers();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Ride accepted. Waiting for customer payment.',
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
        title: const Text('Enter Trip OTP', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w900)),
        content: TextField(controller: controller, autofocus: true, keyboardType: TextInputType.number, maxLength: 6, decoration: const InputDecoration(hintText: '6-digit OTP')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, controller.text.trim()), child: const Text('Start Trip')),
        ],
      );
    },
  );

  Future<void> _advanceTrip() async {
    final trip = _activeTrip;
    if (trip == null || _tripBusy) return;
    final id = trip['id'].toString();
    final status = trip['status'].toString();
    String? otp;
    if (status == 'ARRIVED') {
      otp = await _askForOtp();
      if (otp == null) return;
    }
    setState(() => _tripBusy = true);
    try {
      final updated = switch (status) {
        'PAYMENT_CONFIRMED' => await DriverApiService.markEnRoute(id),
        'DRIVER_EN_ROUTE' => await DriverApiService.markArrived(id),
        'ARRIVED' => await DriverApiService.startTrip(id, otp!),
        'IN_PROGRESS' => await DriverApiService.completeTrip(id),
        _ => await DriverApiService.activeTrip(),
      };
      if (mounted) setState(() => _activeTrip = updated);
    } catch (error) {
      if (mounted) _showError(error);
    } finally {
      if (mounted) setState(() => _tripBusy = false);
    }
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
                DriverHomeHeader(isOnline: _isOnline),
                Positioned(left: 0, right: 0, top: 215, child: VehicleCard()),
                Positioned(
                  right: 24,
                  top: 119,
                  width: 154,
                  height: 124,
                  child: Image(
                    image: AssetImage('assets/images/driver-auto-overlay.png'),
                    fit: BoxFit.contain,
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
                ActiveTripCard(trip: _activeTrip!, busy: _tripBusy, onAction: _advanceTrip),
                const SizedBox(height: 11),
              ],
              const TodayOverview(),
              const SizedBox(height: 11),
              const NextTripCard(),
              const SizedBox(height: 11),
              const QuickActions(),
              const SizedBox(height: 11),
              const RegistrationReviewCard(),
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
