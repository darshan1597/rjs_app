import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../services/customer_booking_service.dart';

class DriverSearchScreen extends StatefulWidget {
  const DriverSearchScreen({
    super.key,
    required this.booking,
    required this.vehicleName,
    required this.vehicleImage,
    required this.seats,
  });

  final Map<String, dynamic> booking;
  final String vehicleName;
  final String vehicleImage;
  final String seats;

  @override
  State<DriverSearchScreen> createState() => _DriverSearchScreenState();
}

class _DriverSearchScreenState extends State<DriverSearchScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _searchProgress;
  Timer? _messageTimer;
  Timer? _poller;
  int _messageIndex = 0;
  late Map<String, dynamic> _booking;
  bool _cancelling = false;
  bool _paying = false;
  bool _timedOut = false;
  bool _refreshInFlight = false;

  List<String> get _messages => [
    'Looking for nearby ${widget.vehicleName} drivers...',
    'Notifying the closest available drivers...',
    'Waiting for a driver to accept your ride...',
    'Expanding the search area...',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _booking = widget.booking;
    _searchProgress =
        AnimationController(vsync: this, duration: const Duration(seconds: 45))
          ..addStatusListener((status) {
            if (status == AnimationStatus.completed && mounted && !_accepted) {
              _messageTimer?.cancel();
              setState(() => _timedOut = true);
            }
          });
    _searchProgress.forward();
    _messageTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && !_accepted && !_timedOut) {
        setState(() => _messageIndex = (_messageIndex + 1) % _messages.length);
      }
    });
    _poller = Timer.periodic(const Duration(seconds: 2), (_) => _refresh());
    unawaited(_refresh());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _searchProgress.dispose();
    _messageTimer?.cancel();
    _poller?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refresh());
    }
  }

  String get _bookingId => _booking['id'] as String;
  String get _status => _booking['status'] as String? ?? 'SEARCHING_DRIVER';
  int get _amount => (_booking['amount'] as num?)?.round() ?? 0;
  bool get _accepted => const {
    'DRIVER_ACCEPTED',
    'AWAITING_PAYMENT',
    'PAYMENT_CONFIRMED',
    'ASSIGNED',
    'DRIVER_EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  }.contains(_status);

  Future<void> _refresh() async {
    if (_refreshInFlight) return;
    _refreshInFlight = true;
    try {
      final booking = await CustomerBookingService.getById(_bookingId);
      if (mounted) {
        final status = booking['status'] as String? ?? 'SEARCHING_DRIVER';
        final accepted = const {
          'DRIVER_ACCEPTED',
          'AWAITING_PAYMENT',
          'PAYMENT_CONFIRMED',
          'ASSIGNED',
          'DRIVER_EN_ROUTE',
          'ARRIVED',
          'IN_PROGRESS',
          'COMPLETED',
        }.contains(status);
        setState(() {
          _booking = booking;
          if (accepted) _timedOut = false;
        });
        if (accepted) {
          _searchProgress.stop();
          _messageTimer?.cancel();
        }
        if (const {'COMPLETED', 'CANCELLED'}.contains(status)) {
          _poller?.cancel();
        }
      }
    } catch (_) {
      // A temporary polling failure should not close the search screen.
    } finally {
      _refreshInFlight = false;
    }
  }

  void _retry() {
    setState(() {
      _timedOut = false;
      _messageIndex = 0;
    });
    _searchProgress
      ..reset()
      ..forward();
    _messageTimer?.cancel();
    _messageTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && !_accepted && !_timedOut) {
        setState(() => _messageIndex = (_messageIndex + 1) % _messages.length);
      }
    });
    _poller?.cancel();
    _poller = Timer.periodic(const Duration(seconds: 2), (_) => _refresh());
    _refresh();
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Cancel ride search?',
          style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w900),
        ),
        content: const Text(
          'We’ll stop notifying nearby drivers for this ride.',
          style: TextStyle(color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Searching'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel Ride'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _cancelling = true);
    try {
      await CustomerBookingService.cancel(_bookingId);
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  Future<void> _confirmTestPayment() async {
    if (_paying) return;
    setState(() => _paying = true);
    try {
      final booking = await CustomerBookingService.confirmTestPayment(
        _bookingId,
      );
      if (mounted) setState(() => _booking = booking);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  void _handleBack() {
    if (_accepted) {
      Navigator.of(context).pop();
    } else {
      _cancel();
    }
  }

  String get _mapStatusMessage => switch (_status) {
    'AWAITING_PAYMENT' => 'Driver found! Confirm payment to continue.',
    'PAYMENT_CONFIRMED' => 'Payment confirmed. Waiting for your driver.',
    'DRIVER_EN_ROUTE' => 'Your driver is on the way to you.',
    'ARRIVED' => 'Your driver has arrived at the pickup.',
    'IN_PROGRESS' => 'Trip in progress. Have a safe journey!',
    'COMPLETED' => 'You have reached your destination.',
    _ => _timedOut
        ? 'No driver accepted the ride in time.'
        : _messages[_messageIndex],
  };

  @override
  Widget build(BuildContext context) {
    final pickup = _booking['pickup'] as Map<String, dynamic>?;
    final destination = _booking['destination'] as Map<String, dynamic>?;
    return PopScope(
      canPop: _accepted,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _cancel();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F8FC),
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Expanded(
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Image.asset(
                        'assets/images/home-map-placeholder.png',
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned.fill(
                      child: CustomPaint(painter: _SearchRoutePainter()),
                    ),
                    Positioned(
                      left: 16,
                      right: 16,
                      top: 12,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _RoundBack(onTap: _handleBack),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _RouteCard(
                              pickup: pickup?['address'] as String? ?? 'Pickup',
                              destination:
                                  destination?['address'] as String? ??
                                  'Destination',
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      left: 115,
                      top: 190,
                      child: Container(
                        width: 180,
                        padding: const EdgeInsets.all(13),
                        decoration: BoxDecoration(
                          color: AppColors.navy,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          _mapStatusMessage,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ),
                    const Positioned(
                      left: 55,
                      bottom: 70,
                      child: Icon(
                        Icons.location_on_rounded,
                        color: AppColors.orange,
                        size: 44,
                      ),
                    ),
                    const Positioned(
                      right: 62,
                      top: 280,
                      child: Icon(
                        Icons.location_on_rounded,
                        color: AppColors.blue,
                        size: 44,
                      ),
                    ),
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: _searchProgress,
                        builder: (context, _) {
                          final pulse =
                              1 +
                              math.sin(_searchProgress.value * math.pi * 18) *
                                  .08;
                          return Stack(
                            children: [
                              for (final position in const [
                                (left: 60.0, top: 330.0, angle: -.5),
                                (left: 245.0, top: 290.0, angle: .4),
                                (left: 285.0, top: 430.0, angle: -.3),
                              ])
                                Positioned(
                                  left: position.left,
                                  top: position.top,
                                  child: Transform.scale(
                                    scale: pulse,
                                    child: Transform.rotate(
                                      angle:
                                          position.angle +
                                          math.sin(
                                                _searchProgress.value *
                                                    math.pi *
                                                    4,
                                              ) *
                                              .08,
                                      child: Container(
                                        width: 50,
                                        height: 50,
                                        decoration: const BoxDecoration(
                                          color: Color(0x33206EEA),
                                          shape: BoxShape.circle,
                                        ),
                                        padding: const EdgeInsets.all(8),
                                        child: Image.asset(
                                          widget.vehicleImage,
                                          fit: BoxFit.contain,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                    ),
                    Positioned(
                      right: 16,
                      bottom: 18,
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: const [
                            BoxShadow(color: Color(0x220A244A), blurRadius: 12),
                          ],
                        ),
                        child: const Icon(
                          Icons.my_location_rounded,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _SearchPanel(
                vehicleName: widget.vehicleName,
                vehicleImage: widget.vehicleImage,
                seats: widget.seats,
                amount: _amount,
                progress: _searchProgress,
                message: _messages[_messageIndex],
                accepted: _accepted,
                status: _status,
                tripStartOtp: _booking['tripStartOtp'] as String?,
                driver: _booking['driver'] as Map<String, dynamic>?,
                timedOut: _timedOut,
                cancelling: _cancelling,
                paying: _paying,
                onCancel: _cancel,
                onRetry: _retry,
                onPay: _confirmTestPayment,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoundBack extends StatelessWidget {
  const _RoundBack({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    customBorder: const CircleBorder(),
    child: Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: Color(0x200A244A), blurRadius: 12)],
      ),
      child: const Icon(Icons.arrow_back_rounded, color: AppColors.navy),
    ),
  );
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.pickup, required this.destination});
  final String pickup;
  final String destination;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(17),
      boxShadow: const [BoxShadow(color: Color(0x180A244A), blurRadius: 14)],
    ),
    child: Row(
      children: [
        SizedBox(
          height: 68,
          width: 18,
          child: Column(
            children: [
              const Icon(Icons.circle, size: 13, color: AppColors.orange),
              Expanded(
                child: CustomPaint(
                  painter: _DottedPainter(),
                  size: const Size(1, double.infinity),
                ),
              ),
              const Icon(Icons.circle, size: 13, color: AppColors.blue),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                pickup,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                destination,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _SearchPanel extends StatelessWidget {
  const _SearchPanel({
    required this.vehicleName,
    required this.vehicleImage,
    required this.seats,
    required this.amount,
    required this.progress,
    required this.message,
    required this.accepted,
    required this.status,
    required this.tripStartOtp,
    required this.driver,
    required this.timedOut,
    required this.cancelling,
    required this.paying,
    required this.onCancel,
    required this.onRetry,
    required this.onPay,
  });
  final String vehicleName;
  final String vehicleImage;
  final String seats;
  final int amount;
  final Animation<double> progress;
  final String message;
  final bool accepted;
  final String status;
  final String? tripStartOtp;
  final Map<String, dynamic>? driver;
  final bool timedOut;
  final bool cancelling;
  final bool paying;
  final VoidCallback onCancel;
  final VoidCallback onRetry;
  final VoidCallback onPay;

  String get title => switch (status) {
    'AWAITING_PAYMENT' => 'Driver found',
    'PAYMENT_CONFIRMED' => 'Payment confirmed',
    'DRIVER_EN_ROUTE' => 'Driver is on the way',
    'ARRIVED' => 'Driver has arrived',
    'IN_PROGRESS' => 'Trip in progress',
    'COMPLETED' => 'Ride completed',
    _ => timedOut ? 'Search timed out' : 'Searching for a driver',
  };

  String get subtitle => switch (status) {
    'AWAITING_PAYMENT' => 'Confirm payment to send the driver to your pickup',
    'PAYMENT_CONFIRMED' => 'Your driver is preparing to leave',
    'DRIVER_EN_ROUTE' => 'Your driver is travelling to your pickup',
    'ARRIVED' => 'Share the trip OTP with your driver',
    'IN_PROGRESS' => 'You are travelling to your destination',
    'COMPLETED' => 'Thank you for riding with RJS',
    _ => timedOut
        ? 'No nearby driver accepted within the search time'
        : message,
  };

  String get driverLine {
    final vehicle = driver?['vehicle'] as Map<String, dynamic>?;
    final name = driver?['name']?.toString() ?? 'Driver';
    final registration = vehicle?['registrationNumber']?.toString() ?? '';
    return registration.isEmpty ? name : '$name  •  $registration';
  }

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      18,
      10,
      18,
      15 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(27)),
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 47,
            height: 5,
            decoration: BoxDecoration(
              color: const Color(0xFFB9BFCA),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 3),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 350),
                    transitionBuilder: (child, animation) => FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, .25),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    ),
                    child: Text(
                      subtitle,
                      key: ValueKey('$status-$timedOut-$message'),
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: 72,
              height: 72,
              child: AnimatedBuilder(
                animation: progress,
                builder: (context, _) => Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox.expand(
                      child: CircularProgressIndicator(
                        value: accepted ? 1 : progress.value,
                        strokeWidth: 6,
                        backgroundColor: const Color(0xFFFFE4D4),
                        color: accepted
                            ? const Color(0xFF079447)
                            : AppColors.orange,
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Icon(
                      accepted
                          ? Icons.check_rounded
                          : timedOut
                          ? Icons.hourglass_bottom_rounded
                          : Icons.search_rounded,
                      color: accepted
                          ? const Color(0xFF079447)
                          : AppColors.orange,
                      size: 28,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE0E5EC)),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 95,
                height: 58,
                child: Image.asset(vehicleImage, fit: BoxFit.contain),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      vehicleName,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '$seats seats • AC',
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                    if (driver != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        driverLine,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                '₹$amount',
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 15),
        _Progress(status: status),
        const SizedBox(height: 15),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF0F6FF),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified_user_rounded, color: AppColors.blue),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  accepted
                      ? status == 'AWAITING_PAYMENT'
                          ? 'Your driver accepted. Confirm the test payment before the driver starts toward you.'
                          : status == 'PAYMENT_CONFIRMED'
                          ? 'Payment is confirmed. Your driver can now begin travelling to the pickup.'
                          : status == 'ARRIVED'
                          ? 'Your driver has arrived. Share the OTP only when you are ready to begin.'
                          : status == 'IN_PROGRESS'
                          ? 'Your trip has started. Have a safe journey.'
                          : status == 'COMPLETED'
                          ? 'This ride has been completed successfully.'
                          : 'Your driver is travelling to your pickup location.'
                      : timedOut
                      ? 'No driver accepted this request. Try searching again or cancel the ride.'
                      : 'Sit tight! We’re notifying nearby drivers. This usually takes less than a minute.',
                  style: const TextStyle(color: AppColors.navy, fontSize: 11.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (status == 'ARRIVED' && tripStartOtp != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3E8),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                const Text(
                  'TRIP START OTP',
                  style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 3),
                Text(
                  tripStartOtp!,
                  style: const TextStyle(color: AppColors.orange, fontSize: 24, letterSpacing: 6, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        SizedBox(
          width: double.infinity,
          height: 48,
          child: status == 'AWAITING_PAYMENT'
              ? FilledButton(
                  onPressed: paying ? null : onPay,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.orange,
                  ),
                  child: Text(
                    paying ? 'Confirming...' : 'Confirm Test Payment  •  ₹$amount',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                )
              : accepted
              ? FilledButton(
                  onPressed: null,
                  style: FilledButton.styleFrom(
                    disabledBackgroundColor: const Color(0xFFE8F7ED),
                    disabledForegroundColor: const Color(0xFF079447),
                  ),
                  child: Text(
                    status == 'PAYMENT_CONFIRMED'
                        ? 'Payment Confirmed • Waiting for Driver'
                        : status == 'DRIVER_EN_ROUTE'
                        ? 'Driver Is On The Way'
                        : status == 'ARRIVED'
                        ? 'Share OTP With Driver'
                        : status == 'IN_PROGRESS'
                        ? 'Trip In Progress'
                        : 'Ride Completed',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                )
              : timedOut
              ? Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: cancelling ? null : onCancel,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: FilledButton.icon(
                        onPressed: onRetry,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.orange,
                        ),
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Search Again'),
                      ),
                    ),
                  ],
                )
              : FilledButton(
                  onPressed: cancelling ? null : onCancel,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFFFF0F0),
                    foregroundColor: Colors.red,
                    elevation: 0,
                  ),
                  child: Text(
                    cancelling ? 'Cancelling...' : 'Cancel Ride',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
        ),
      ],
    ),
  );
}

class _Progress extends StatelessWidget {
  const _Progress({required this.status});
  final String status;

  bool get driverFound => status != 'SEARCHING_DRIVER';
  bool get paid => const {
    'PAYMENT_CONFIRMED',
    'DRIVER_EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  }.contains(status);
  bool get onTheWay => const {
    'DRIVER_EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  }.contains(status);

  @override
  Widget build(BuildContext context) => Row(
    children: [
      _Step(label: 'Searching', active: true),
      _Line(active: driverFound),
      _Step(label: 'Driver found', active: driverFound),
      _Line(active: paid),
      _Step(label: 'Payment', active: paid),
      _Line(active: onTheWay),
      _Step(label: status == 'COMPLETED' ? 'Completed' : 'On the way', active: onTheWay),
    ],
  );
}

class _Step extends StatelessWidget {
  const _Step({required this.label, required this.active});
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 62,
    child: Column(
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: active ? AppColors.orange : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: active ? AppColors.orange : const Color(0xFFADB6C7),
              width: 4,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 2,
          style: TextStyle(
            color: active ? AppColors.navy : AppColors.muted,
            fontSize: 9.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}

class _Line extends StatelessWidget {
  const _Line({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: 24),
      color: active ? AppColors.orange : const Color(0xFFC6CDD8),
    ),
  );
}

class _DottedPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF9EA9BA)
      ..strokeWidth = 1.5;
    for (double y = 1; y < size.height; y += 6) {
      canvas.drawLine(
        Offset(size.width / 2, y),
        Offset(size.width / 2, y + 3),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SearchRoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(72, size.height - 82)
      ..cubicTo(
        size.width * .24,
        size.height * .62,
        size.width * .47,
        size.height * .72,
        size.width * .51,
        size.height * .49,
      )
      ..cubicTo(
        size.width * .55,
        size.height * .3,
        size.width * .73,
        size.height * .42,
        size.width - 78,
        303,
      );
    canvas.drawPath(
      path,
      Paint()
        ..color = AppColors.navy
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
