import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../location/models/map_place.dart';
import '../../location/services/maps_service.dart';
import '../services/customer_booking_service.dart';
import '../../wallet/services/wallet_service.dart';

Widget _vehicleImage(String source) => source.startsWith('http')
    ? Image.network(
        source,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const Icon(
          Icons.directions_car_rounded,
          color: AppColors.muted,
        ),
      )
    : Image.asset(source, fit: BoxFit.contain);

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
  GoogleMapController? _liveMapController;
  LatLng? _lastFramedDriverPoint;
  LatLng? _lastRoutedDriverPoint;
  DateTime? _lastRouteRefresh;
  List<LatLng> _pickupRoutePoints = const [];
  int? _pickupEtaMinutes;
  bool _routeRefreshInFlight = false;
  BitmapDescriptor? _driverCarIcon;
  late final Razorpay _razorpay;

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
    _loadDriverCarIcon();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _searchProgress =
        AnimationController(vsync: this, duration: const Duration(seconds: 45))
          ..addStatusListener((status) {
            if (status == AnimationStatus.completed && mounted && !_accepted) {
              _messageTimer?.cancel();
              setState(() => _timedOut = true);
              unawaited(_refresh());
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
    _razorpay.clear();
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
    'PAYMENT_PENDING',
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
          'PAYMENT_PENDING',
          'COMPLETED',
        }.contains(status);
        setState(() {
          _booking = booking;
          _timedOut = status == 'NO_DRIVER_AVAILABLE';
        });
        unawaited(_frameLiveDriver());
        if (status == 'DRIVER_EN_ROUTE') unawaited(_refreshPickupRoute());
        if (accepted) {
          _searchProgress.stop();
          _messageTimer?.cancel();
        }
        if (const {'COMPLETED', 'CANCELLED', 'NO_DRIVER_AVAILABLE'}.contains(status)) {
          _poller?.cancel();
        }
      }
    } catch (_) {
      // A temporary polling failure should not close the search screen.
    } finally {
      _refreshInFlight = false;
    }
  }

  Future<void> _loadDriverCarIcon() async {
    final icon = await BitmapDescriptor.asset(
      const ImageConfiguration(size: Size(54, 54)),
      'assets/images/popup-car.png',
      width: 54,
      height: 54,
    );
    if (mounted) setState(() => _driverCarIcon = icon);
  }

  double _metresBetween(LatLng first, LatLng second) {
    const earthRadius = 6371000.0;
    final latitudeDelta = (second.latitude - first.latitude) * math.pi / 180;
    final longitudeDelta = (second.longitude - first.longitude) * math.pi / 180;
    final firstLatitude = first.latitude * math.pi / 180;
    final secondLatitude = second.latitude * math.pi / 180;
    final value = math.sin(latitudeDelta / 2) * math.sin(latitudeDelta / 2) +
        math.cos(firstLatitude) * math.cos(secondLatitude) *
            math.sin(longitudeDelta / 2) * math.sin(longitudeDelta / 2);
    return earthRadius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value));
  }

  Future<void> _refreshPickupRoute() async {
    if (_routeRefreshInFlight || _status != 'DRIVER_EN_ROUTE') return;
    final pickup = _pointFrom(_booking['pickup']);
    final driver = _pointFrom((_booking['driver'] as Map?)?['currentLocation']);
    if (pickup == null || driver == null) return;
    final now = DateTime.now();
    if (_lastRouteRefresh != null && now.difference(_lastRouteRefresh!).inSeconds < 15) return;
    if (_lastRoutedDriverPoint != null &&
        _metresBetween(_lastRoutedDriverPoint!, driver) < 50 &&
        _lastRouteRefresh != null && now.difference(_lastRouteRefresh!).inSeconds < 45) return;
    _routeRefreshInFlight = true;
    _lastRouteRefresh = now;
    try {
      final route = await MapsService.route(
        origin: MapPlace(address: 'Driver location', latitude: driver.latitude, longitude: driver.longitude),
        destination: MapPlace(address: 'Pickup', latitude: pickup.latitude, longitude: pickup.longitude),
      );
      if (!mounted || _status != 'DRIVER_EN_ROUTE') return;
      setState(() {
        _pickupRoutePoints = _decodePolyline(route['encodedPolyline']?.toString() ?? '');
        _pickupEtaMinutes = (route['durationMinutes'] as num?)?.ceil();
        _lastRoutedDriverPoint = driver;
      });
      await _frameLiveDriver(force: true);
    } catch (_) {
      // Keep the latest valid route during a temporary routing failure.
    } finally {
      _routeRefreshInFlight = false;
    }
  }

  List<LatLng> _decodePolyline(String encoded) {
    final points = <LatLng>[];
    var index = 0;
    var latitude = 0;
    var longitude = 0;
    while (index < encoded.length) {
      var shift = 0;
      var result = 0;
      int byte;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      latitude += (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      shift = 0;
      result = 0;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      longitude += (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      points.add(LatLng(latitude / 1e5, longitude / 1e5));
    }
    return points;
  }

  LatLng? _pointFrom(dynamic value) {
    if (value is! Map || value['latitude'] is! num || value['longitude'] is! num) return null;
    return LatLng((value['latitude'] as num).toDouble(), (value['longitude'] as num).toDouble());
  }

  Future<void> _frameLiveDriver({bool force = false}) async {
    final controller = _liveMapController;
    final pickup = _pointFrom(_booking['pickup']);
    final driver = _pointFrom((_booking['driver'] as Map?)?['currentLocation']);
    if (controller == null || pickup == null || driver == null) return;
    final previous = _lastFramedDriverPoint;
    if (!force && previous != null) {
      final moved = (previous.latitude - driver.latitude).abs() +
          (previous.longitude - driver.longitude).abs();
      if (moved < 0.00008) return;
    }
    _lastFramedDriverPoint = driver;
    if ((pickup.latitude - driver.latitude).abs() < 0.0001 &&
        (pickup.longitude - driver.longitude).abs() < 0.0001) {
      await controller.animateCamera(CameraUpdate.newLatLngZoom(driver, 16));
      return;
    }
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(
            math.min(pickup.latitude, driver.latitude),
            math.min(pickup.longitude, driver.longitude),
          ),
          northeast: LatLng(
            math.max(pickup.latitude, driver.latitude),
            math.max(pickup.longitude, driver.longitude),
          ),
        ),
        72,
      ),
    );
  }

  Future<void> _retry() async {
    try {
      final booking = await CustomerBookingService.retrySearch(_bookingId);
      if (!mounted) return;
      setState(() {
        _booking = booking;
        _timedOut = false;
        _messageIndex = 0;
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
      return;
    }
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
    unawaited(_refresh());
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

  Future<void> _payNow() async {
    if (_paying) return;
    setState(() => _paying = true);
    try {
      final order = await CustomerBookingService.createPaymentOrder(_bookingId);
      _razorpay.open({
        'key': order['keyId'],
        'order_id': order['orderId'],
        'amount': order['amountPaise'],
        'currency': order['currency'],
        'name': order['name'],
        'description': order['description'],
        'prefill': {
          'contact': order['customer']?['phone'],
          'name': order['customer']?['name'],
        },
        'theme': {'color': '#F58220'},
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _onPaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final booking = await CustomerBookingService.verifyPayment(
        bookingId: _bookingId,
        paymentId: response.paymentId ?? '',
        orderId: response.orderId ?? '',
        signature: response.signature ?? '',
      );
      if (mounted) setState(() => _booking = booking);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _payWallet() async {
    if (_paying) return;
    setState(() => _paying = true);
    try {
      final quote = await WalletService.quote(_bookingId);
      if (!mounted) return;
      if (quote['available'] != true) throw Exception('Razorpay checkout or driver QR has already started. Please complete that payment.');
      final payable = (quote['payablePaise'] as num).toInt();
      final balance = (quote['balancePaise'] as num).toInt();
      if (balance < payable) {
        final addMoney = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
          title: const Text('Insufficient wallet balance'),
          content: Text('Balance: ₹${(balance / 100).toStringAsFixed(2)}\nPayable after 5% discount: ₹${(payable / 100).toStringAsFixed(2)}'),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add money'))],
        ));
        if (mounted && addMoney == true) await Navigator.pushNamed(context, '/wallet');
        return;
      }
      final confirmed = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
        title: const Text('Pay with RJS Wallet'),
        content: Text('Ride bill: ₹${((quote['grossPaise'] as num) / 100).toStringAsFixed(2)}\n5% discount: ₹${((quote['discountPaise'] as num) / 100).toStringAsFixed(2)}\nPay: ₹${(payable / 100).toStringAsFixed(2)}'),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Pay now'))],
      ));
      if (confirmed != true) return;
      await WalletService.pay(_bookingId);
      final booking = await CustomerBookingService.getById(_bookingId);
      if (mounted) setState(() => _booking = booking);
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))));
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _paying = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(response.message ?? 'Payment was not completed')),
    );
  }

  void _handleBack() {
    if (_accepted) {
      Navigator.of(context).pop();
    } else {
      _cancel();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pickup = _booking['pickup'] as Map<String, dynamic>?;
    final destination = _booking['destination'] as Map<String, dynamic>?;
    final driver = _booking['driver'] as Map<String, dynamic>?;
    final driverLocation = driver?['currentLocation'] as Map<String, dynamic>?;
    final pickupPoint = pickup?['latitude'] is num && pickup?['longitude'] is num
        ? LatLng((pickup!['latitude'] as num).toDouble(), (pickup['longitude'] as num).toDouble())
        : null;
    final destinationPoint = destination?['latitude'] is num && destination?['longitude'] is num
        ? LatLng((destination!['latitude'] as num).toDouble(), (destination['longitude'] as num).toDouble())
        : null;
    final driverPoint = driverLocation?['latitude'] is num && driverLocation?['longitude'] is num
        ? LatLng((driverLocation!['latitude'] as num).toDouble(), (driverLocation['longitude'] as num).toDouble())
        : null;
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
                      child: pickupPoint == null
                          ? Image.asset('assets/images/home-map-placeholder.png', fit: BoxFit.cover)
                          : GoogleMap(
                              mapId: GoogleMapsConfig.mapId,
                              onMapCreated: (controller) {
                                _liveMapController = controller;
                                unawaited(_frameLiveDriver(force: true));
                              },
                              initialCameraPosition: CameraPosition(target: driverPoint ?? pickupPoint, zoom: 15),
                              myLocationButtonEnabled: false,
                              zoomControlsEnabled: false,
                              mapToolbarEnabled: false,
                              markers: {
                                Marker(
                                  markerId: const MarkerId('pickup'),
                                  position: pickupPoint,
                                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                                ),
                                if (destinationPoint != null && _status != 'DRIVER_EN_ROUTE')
                                  Marker(
                                    markerId: const MarkerId('destination'),
                                    position: destinationPoint,
                                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
                                  ),
                                if (driverPoint != null)
                                  Marker(
                                    markerId: const MarkerId('driver-live'),
                                    position: driverPoint,
                                    icon: _driverCarIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                                    rotation: (driverLocation?['heading'] as num?)?.toDouble() ?? 0,
                                    flat: true,
                                    infoWindow: const InfoWindow(title: 'Your driver'),
                                  ),
                              },
                              polylines: {
                                if (_status == 'DRIVER_EN_ROUTE' && _pickupRoutePoints.isNotEmpty)
                                  Polyline(
                                    polylineId: const PolylineId('driver-to-pickup'),
                                    points: _pickupRoutePoints,
                                    color: AppColors.blue,
                                    width: 6,
                                    startCap: Cap.roundCap,
                                    endCap: Cap.roundCap,
                                    jointType: JointType.round,
                                  ),
                              },
                            ),
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
                    if (_status == 'DRIVER_EN_ROUTE' && _pickupEtaMinutes != null)
                    Positioned(
                      left: 0,
                      right: 0,
                      top: 118,
                      child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 9),
                        decoration: BoxDecoration(
                          color: AppColors.navy,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: const [BoxShadow(color: Color(0x330A244A), blurRadius: 12)],
                        ),
                        child: Text(
                          '$_pickupEtaMinutes min',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      ),
                    ),
                    if (!_accepted) Positioned.fill(
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
                                        child: _vehicleImage(widget.vehicleImage),
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
                pricing: _booking['pricing'] as Map<String, dynamic>?,
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
                onPay: _payNow,
                onWalletPay: _payWallet,
                walletAvailable: _booking['walletPaymentAvailable'] != false,
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
    required this.pricing,
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
    required this.onWalletPay,
    required this.walletAvailable,
  });
  final String vehicleName;
  final String vehicleImage;
  final String seats;
  final int amount;
  final Map<String, dynamic>? pricing;
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
  final VoidCallback onWalletPay;
  final bool walletAvailable;

  String get title => switch (status) {
    'DRIVER_ACCEPTED' => 'Driver found',
    'DRIVER_EN_ROUTE' => 'Driver is on the way',
    'ARRIVED' => 'Driver has arrived',
    'IN_PROGRESS' => 'Trip in progress',
    'PAYMENT_PENDING' => 'Final payment due',
    'COMPLETED' => 'Ride completed',
    _ => timedOut ? 'Search timed out' : 'Searching for a driver',
  };

  String get subtitle => switch (status) {
    'DRIVER_ACCEPTED' => 'Your driver is preparing to leave',
    'DRIVER_EN_ROUTE' => 'Your driver is travelling to your pickup',
    'ARRIVED' => 'Share the trip OTP with your driver',
    'IN_PROGRESS' => 'You are travelling to your destination',
    'PAYMENT_PENDING' => 'Review the final charges and complete payment',
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
                child: _vehicleImage(vehicleImage),
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
                      ? status == 'DRIVER_ACCEPTED'
                          ? 'Your driver accepted and can now begin travelling to the pickup.'
                          : status == 'ARRIVED'
                          ? 'Your driver has arrived. Share the OTP only when you are ready to begin.'
                          : status == 'IN_PROGRESS'
                          ? 'Your trip has started. Have a safe journey.'
                          : status == 'PAYMENT_PENDING'
                          ? 'Your final bill is ready. Pay now or scan the QR shown by your driver.'
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
        if (status == 'PAYMENT_PENDING') ...[
          OutlinedButton.icon(
            onPressed: paying || !walletAvailable ? null : onWalletPay,
            icon: const Icon(Icons.account_balance_wallet_outlined),
            label: Text(walletAvailable ? 'Pay with Wallet · Save 5%' : 'Checkout / QR already started'),
          ),
          const SizedBox(height: 8),
        ],
        if (status == 'PAYMENT_PENDING' && pricing != null) ...[
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE1E6ED)),
            ),
            child: Column(
              children: [
                _BillRow(label: 'Ride fare', value: pricing!['distanceFare']),
                _BillRow(label: 'Waiting charge', value: pricing!['waitingCharge']),
                _BillRow(label: 'Parking', value: pricing!['parkingCharge']),
                _BillRow(label: 'Toll', value: pricing!['tollCharge']),
                _BillRow(label: 'GST', value: pricing!['gstAmount']),
                const Divider(),
                _BillRow(label: 'Total payable', value: amount, strong: true),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        SizedBox(
          width: double.infinity,
          height: 48,
          child: status == 'PAYMENT_PENDING'
              ? FilledButton(
                  onPressed: paying ? null : onPay,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.orange,
                  ),
                  child: Text(
                    paying ? 'Processing payment...' : 'Pay Now  •  ₹$amount',
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
                    status == 'DRIVER_ACCEPTED'
                        ? 'Driver Accepted'
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

class _BillRow extends StatelessWidget {
  const _BillRow({required this.label, required this.value, this.strong = false});
  final String label;
  final Object? value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      children: [
        Expanded(child: Text(label, style: TextStyle(color: strong ? AppColors.navy : AppColors.muted, fontWeight: strong ? FontWeight.w900 : FontWeight.w500))),
        Text('₹${value ?? 0}', style: TextStyle(color: AppColors.navy, fontWeight: strong ? FontWeight.w900 : FontWeight.w700)),
      ],
    ),
  );
}

class _Progress extends StatelessWidget {
  const _Progress({required this.status});
  final String status;

  bool get driverFound => status != 'SEARCHING_DRIVER';
  bool get rideStarted => const {
    'DRIVER_EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'PAYMENT_PENDING',
    'COMPLETED',
  }.contains(status);
  bool get paymentReady => const {
    'PAYMENT_PENDING',
    'COMPLETED',
  }.contains(status);

  @override
  Widget build(BuildContext context) => Row(
    children: [
      _Step(label: 'Searching', active: true),
      _Line(active: driverFound),
      _Step(label: 'Driver found', active: driverFound),
      _Line(active: rideStarted),
      _Step(label: 'Ride', active: rideStarted),
      _Line(active: paymentReady),
      _Step(
        label: status == 'COMPLETED' ? 'Paid' : 'Payment',
        active: paymentReady,
      ),
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
