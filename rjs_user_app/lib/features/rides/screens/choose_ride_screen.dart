import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/customer_auth_service.dart';
import '../../location/screens/location_search_screen.dart';
import '../../location/models/map_place.dart';
import '../services/customer_booking_service.dart';
import 'driver_search_screen.dart';

class ChooseRideScreen extends StatefulWidget {
  const ChooseRideScreen({
    super.key,
    required this.pickup,
    required this.destination,
  });

  final MapPlace pickup;
  final MapPlace destination;

  @override
  State<ChooseRideScreen> createState() => _ChooseRideScreenState();
}

class _ChooseRideScreenState extends State<ChooseRideScreen> {
  late MapPlace _pickup;
  late MapPlace _destination;
  int _selectedRide = 0;
  bool _searching = false;
  DateTime? _scheduledFor;

  List<_Ride> _rides = const [];
  bool _loadingRides = true;
  String? _rideError;
  Map<String, dynamic>? _route;
  GoogleMapController? _mapController;
  BitmapDescriptor? _routeCalloutIcon;

  @override
  void initState() {
    super.initState();
    _pickup = widget.pickup;
    _destination = widget.destination;
    _loadRides();
  }

  Future<void> _loadRides() async {
    if (mounted) setState(() => _routeCalloutIcon = null);
    try {
      final quote = await CustomerBookingService.vehicleCatalog(
        pickupLatitude: _pickup.latitude,
        pickupLongitude: _pickup.longitude,
        destinationLatitude: _destination.latitude,
        destinationLongitude: _destination.longitude,
      );
      final categories = (quote['categories'] as List<dynamic>? ?? const [])
          .cast<Map<String, dynamic>>();
      final rides = <_Ride>[];
      for (final category in categories) {
        for (final raw
            in (category['variants'] as List<dynamic>? ?? const [])) {
          final variant = raw as Map<String, dynamic>;
          final amount = (variant['temporaryAmount'] as num?)?.toInt() ?? 0;
          final available = variant['available'] == true;
          rides.add(
            _Ride(
              categoryId: category['id'].toString(),
              variantId: variant['id'].toString(),
              name: variant['name'].toString(),
              variant: variant['code'].toString(),
              amount: amount,
              category: category['name'].toString(),
              description: '${category['name']} · ${variant['name']}',
              detail: available ? 'Driver available' : 'Currently unavailable',
              seats: '${variant['temporarySeats'] ?? 4}',
              price: amount > 0 ? '₹${amount.toString()}' : 'Fare pending',
              eta: available
                  ? '${variant['availableDrivers']} available'
                  : 'Unavailable',
              image: CustomerAuthService.absoluteUrl(
                variant['photoUrl'].toString(),
              ),
              available: available,
            ),
          );
        }
      }
      if (!mounted) return;
      setState(() {
        _rides = rides;
        _selectedRide = rides.indexWhere((ride) => ride.available);
        if (_selectedRide < 0) _selectedRide = 0;
        _loadingRides = false;
        _route = quote['route'] as Map<String, dynamic>?;
      });
      await _createRouteCallout(
        (quote['route']?['distanceKm'] as num?)?.toStringAsFixed(1) ?? '--',
        quote['route']?['durationMinutes']?.toString() ?? '--',
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingRides = false;
        _rideError = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _editDestination() async {
    final value = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _destination.address,
          initialPlace: _destination,
        ),
      ),
    );
    if (value != null && mounted) {
      setState(() {
        _destination = value;
        _loadingRides = true;
      });
      await _loadRides();
    }
  }

  Future<void> _editPickup() async {
    final value = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _pickup.address,
          initialPlace: _pickup,
        ),
      ),
    );
    if (value != null && mounted) {
      setState(() {
        _pickup = value;
        _loadingRides = true;
        _rideError = null;
      });
      await _loadRides();
    }
  }

  Future<void> _swapLocations() async {
    setState(() {
      final previousPickup = _pickup;
      _pickup = _destination;
      _destination = previousPickup;
      _loadingRides = true;
      _rideError = null;
      _route = null;
      _routeCalloutIcon = null;
    });
    await _loadRides();
    if (!mounted) return;
    await _fitRoute(
      LatLng(_pickup.latitude, _pickup.longitude),
      LatLng(_destination.latitude, _destination.longitude),
    );
  }

  Future<void> _searchVehicle() async {
    if (_rides.isEmpty || !_rides[_selectedRide].available) return;
    setState(() => _searching = true);
    try {
      final ride = _rides[_selectedRide];
      final booking = await CustomerBookingService.create(
        pickupAddress: _pickup.address,
        destinationAddress: _destination.address,
        pickupLatitude: _pickup.latitude,
        pickupLongitude: _pickup.longitude,
        destinationLatitude: _destination.latitude,
        destinationLongitude: _destination.longitude,
        categoryId: ride.categoryId,
        variantId: ride.variantId,
      );
      if (!mounted) return;
      await Navigator.pushReplacement<void, void>(
        context,
        MaterialPageRoute(
          builder: (_) => DriverSearchScreen(
            booking: booking,
            vehicleName: ride.name,
            vehicleImage: ride.image,
            seats: ride.seats,
          ),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _chooseSchedule() async {
    final selected = await showModalBottomSheet<DateTime>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0x660A244A),
      builder: (_) => _SchedulePickerSheet(initialValue: _scheduledFor),
    );
    if (selected != null && mounted) {
      setState(() => _scheduledFor = selected);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    body: SafeArea(
      top: false,
      bottom: false,
      child: Column(
        children: [
          Expanded(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              children: [
                _routeMap(),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      for (
                        var rideIndex = 0;
                        rideIndex < _rides.length;
                        rideIndex++
                      ) ...[
                        _RideCard(
                          ride: _rides[rideIndex],
                          selected: _selectedRide == rideIndex,
                          onTap: _rides[rideIndex].available
                              ? () => setState(() => _selectedRide = rideIndex)
                              : () {},
                        ),
                        if (rideIndex != _rides.length - 1)
                          const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
                const _PricingNote(),
                const SizedBox(height: 16),
              ],
            ),
          ),
          if (_loadingRides)
            const SizedBox(
              height: 74,
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_rides.isEmpty)
            SizedBox(
              height: 74,
              child: Center(
                child: Text(_rideError ?? 'No vehicle options are available'),
              ),
            )
          else
            _BottomAction(
              ride: _rides[_selectedRide],
              searching: _searching,
              scheduledFor: _scheduledFor,
              onSchedule: _chooseSchedule,
              onContinue: _searchVehicle,
            ),
        ],
      ),
    ),
  );

  Widget _routeMap() {
    final pickup = LatLng(_pickup.latitude, _pickup.longitude);
    final destination = LatLng(_destination.latitude, _destination.longitude);
    final points = _decodePolyline(
      _route?['encodedPolyline']?.toString() ?? '',
    );
    return Column(
      children: [
        SizedBox(
          height: 245,
          child: Stack(
            children: [
              GoogleMap(
                mapId: GoogleMapsConfig.mapId,
                initialCameraPosition: CameraPosition(target: pickup, zoom: 12),
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                mapToolbarEnabled: false,
                markers: {
                  Marker(
                    markerId: const MarkerId('pickup'),
                    position: pickup,
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                      BitmapDescriptor.hueOrange,
                    ),
                  ),
                  Marker(
                    markerId: const MarkerId('destination'),
                    position: destination,
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                      BitmapDescriptor.hueAzure,
                    ),
                  ),
                  if (_routeCalloutIcon != null && points.isNotEmpty)
                    Marker(
                      markerId: const MarkerId('route-summary'),
                      position: _routeMidpoint(points),
                      icon: _routeCalloutIcon!,
                      anchor: const Offset(.5, 1),
                      zIndexInt: 10,
                    ),
                },
                polylines: points.isEmpty
                    ? {}
                    : {
                        Polyline(
                          polylineId: const PolylineId('route'),
                          points: points,
                          color: AppColors.blue,
                          width: 5,
                        ),
                      },
                onMapCreated: (controller) {
                  _mapController = controller;
                  _fitRoute(pickup, destination);
                },
              ),
              Positioned(
                left: 16,
                top: MediaQuery.paddingOf(context).top + 8,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 4,
                  shadowColor: const Color(0x260A244A),
                  child: IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: AppColors.navy,
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 16,
                bottom: 15,
                child: Container(
                  width: 47,
                  height: 47,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: const [
                      BoxShadow(color: Color(0x200A244A), blurRadius: 10),
                    ],
                  ),
                  child: IconButton(
                    onPressed: () => _fitRoute(pickup, destination),
                    icon: const Icon(
                      Icons.my_location_rounded,
                      color: AppColors.navy,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(
                color: Color(0x180A244A),
                blurRadius: 16,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            children: [
              _RouteLocationRow(
                color: AppColors.orange,
                title: _pickup.address,
                subtitle: 'Pickup location',
                onEdit: _editPickup,
              ),
              Row(
                children: [
                  const Expanded(child: Divider(color: Color(0xFFE4E8EF))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Material(
                      color: const Color(0xFFF1F5FB),
                      shape: const CircleBorder(),
                      child: IconButton(
                        tooltip: 'Swap pickup and destination',
                        visualDensity: VisualDensity.compact,
                        onPressed: _loadingRides ? null : _swapLocations,
                        icon: const Icon(
                          Icons.swap_vert_rounded,
                          color: AppColors.blue,
                          size: 22,
                        ),
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: Color(0xFFE4E8EF))),
                ],
              ),
              _RouteLocationRow(
                color: AppColors.blue,
                title: _destination.address,
                subtitle: 'Destination',
                onEdit: _editDestination,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _fitRoute(LatLng first, LatLng second) async {
    final controller = _mapController;
    if (controller == null) return;
    final southwest = LatLng(
      first.latitude < second.latitude ? first.latitude : second.latitude,
      first.longitude < second.longitude ? first.longitude : second.longitude,
    );
    final northeast = LatLng(
      first.latitude > second.latitude ? first.latitude : second.latitude,
      first.longitude > second.longitude ? first.longitude : second.longitude,
    );
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(southwest: southwest, northeast: northeast),
        48,
      ),
    );
  }

  List<LatLng> _decodePolyline(String encoded) {
    final points = <LatLng>[];
    var index = 0, latitude = 0, longitude = 0;
    while (index < encoded.length) {
      var shift = 0, result = 0, byte = 0;
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

  LatLng _routeMidpoint(List<LatLng> points) {
    if (points.length < 2) return points.first;
    final segments = <double>[];
    var total = 0.0;
    for (var index = 1; index < points.length; index++) {
      final length = _distanceBetween(points[index - 1], points[index]);
      segments.add(length);
      total += length;
    }
    final halfway = total / 2;
    var travelled = 0.0;
    for (var index = 0; index < segments.length; index++) {
      final segment = segments[index];
      if (travelled + segment >= halfway) {
        final ratio = segment == 0 ? 0.0 : (halfway - travelled) / segment;
        final start = points[index];
        final end = points[index + 1];
        return LatLng(
          start.latitude + (end.latitude - start.latitude) * ratio,
          start.longitude + (end.longitude - start.longitude) * ratio,
        );
      }
      travelled += segment;
    }
    return points.last;
  }

  double _distanceBetween(LatLng first, LatLng second) {
    const earthRadius = 6371000.0;
    final lat1 = first.latitude * math.pi / 180;
    final lat2 = second.latitude * math.pi / 180;
    final deltaLat = (second.latitude - first.latitude) * math.pi / 180;
    final deltaLng = (second.longitude - first.longitude) * math.pi / 180;
    final value =
        math.sin(deltaLat / 2) * math.sin(deltaLat / 2) +
        math.cos(lat1) *
            math.cos(lat2) *
            math.sin(deltaLng / 2) *
            math.sin(deltaLng / 2);
    return earthRadius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value));
  }

  Future<void> _createRouteCallout(String distance, String duration) async {
    const scale = 3.0;
    const horizontalPadding = 13.0 * scale;
    const verticalPadding = 7.0 * scale;
    const pointerHeight = 9.0 * scale;
    final painter = TextPainter(
      text: TextSpan(
        text: '~ $distance km · $duration min',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12 * scale,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final width = painter.width + horizontalPadding * 2;
    final bodyHeight = painter.height + verticalPadding * 2;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final paint = Paint()..color = AppColors.blue;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, width, bodyHeight),
        const Radius.circular(8 * scale),
      ),
      paint,
    );
    final center = width / 2;
    canvas.drawPath(
      Path()
        ..moveTo(center - 9 * scale, bodyHeight)
        ..lineTo(center + 9 * scale, bodyHeight)
        ..lineTo(center, bodyHeight + pointerHeight)
        ..close(),
      paint,
    );
    painter.paint(canvas, Offset(horizontalPadding, verticalPadding));
    final image = await recorder.endRecording().toImage(
      width.ceil(),
      (bodyHeight + pointerHeight).ceil(),
    );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    if (bytes == null || !mounted) return;
    setState(() {
      _routeCalloutIcon = BitmapDescriptor.bytes(
        bytes.buffer.asUint8List(),
        imagePixelRatio: scale,
      );
    });
  }
}

class _RouteText extends StatelessWidget {
  const _RouteText({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 14,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 2),
      Text(
        subtitle,
        style: const TextStyle(color: AppColors.muted, fontSize: 11.5),
      ),
    ],
  );
}

class _RouteLocationRow extends StatelessWidget {
  const _RouteLocationRow({
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onEdit,
  });

  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: _RouteText(title: title, subtitle: subtitle),
      ),
      IconButton(
        tooltip: 'Edit $subtitle',
        onPressed: onEdit,
        icon: const Icon(Icons.edit_outlined, color: AppColors.blue, size: 19),
      ),
    ],
  );
}

class _RideCard extends StatelessWidget {
  const _RideCard({
    required this.ride,
    required this.selected,
    required this.onTap,
  });
  final _Ride ride;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(17),
    child: Opacity(
      opacity: ride.available ? 1 : .48,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 94,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFFFF8F3) : Colors.white,
          borderRadius: BorderRadius.circular(17),
          border: Border.all(
            color: selected ? AppColors.orange : const Color(0xFFE0E5EC),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 88,
              child: Image.network(
                ride.image,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.directions_car_rounded,
                  color: AppColors.muted,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    ride.name,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    ride.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11.5,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        size: 16,
                        color: AppColors.muted,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        ride.seats,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.ac_unit_rounded,
                        size: 15,
                        color: AppColors.muted,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          ride.detail,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 10.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Text(
                      ride.price,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.muted,
                      size: 17,
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  ride.eta,
                  style: const TextStyle(
                    color: Color(0xFF079447),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 3),
            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ),
    ),
  );
}

class _PricingNote extends StatelessWidget {
  const _PricingNote();

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.fromLTRB(16, 18, 16, 0),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FAF4),
      borderRadius: BorderRadius.circular(15),
    ),
    child: const Row(
      children: [
        CircleAvatar(
          backgroundColor: Color(0xFFE1F6E8),
          child: Icon(Icons.verified_user_outlined, color: Color(0xFF079447)),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fair & Transparent Pricing',
                style: TextStyle(
                  color: Color(0xFF087A3A),
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'No hidden charges. Final fare may vary slightly based on traffic.',
                style: TextStyle(color: AppColors.muted, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({
    required this.ride,
    required this.searching,
    required this.scheduledFor,
    required this.onSchedule,
    required this.onContinue,
  });
  final _Ride ride;
  final bool searching;
  final DateTime? scheduledFor;
  final VoidCallback onSchedule;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      17,
      13,
      17,
      13 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      boxShadow: [
        BoxShadow(
          color: Color(0x190A244A),
          blurRadius: 14,
          offset: Offset(0, -3),
        ),
      ],
    ),
    child: Row(
      children: [
        const Expanded(
          flex: 2,
          child: _BottomChoice(
            icon: Icons.person_outline_rounded,
            label: 'Myself',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: _BottomChoice(
            icon: Icons.schedule_rounded,
            label: scheduledFor == null
                ? 'Now'
                : '${scheduledFor!.day}/${scheduledFor!.month} ${TimeOfDay.fromDateTime(scheduledFor!).format(context)}',
            onTap: onSchedule,
          ),
        ),
        const SizedBox(width: 9),
        Expanded(
          flex: 5,
          child: SizedBox(
            height: 54,
            child: FilledButton(
              onPressed: searching ? null : onContinue,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.orange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        searching
                            ? 'Starting Search...'
                            : 'Search ${ride.name}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _BottomChoice extends StatelessWidget {
  const _BottomChoice({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xFFF6F8FC),
    borderRadius: BorderRadius.circular(13),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(13),
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE0E5ED)),
          borderRadius: BorderRadius.circular(13),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.navy, size: 19),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _SchedulePickerSheet extends StatefulWidget {
  const _SchedulePickerSheet({this.initialValue});

  final DateTime? initialValue;

  @override
  State<_SchedulePickerSheet> createState() => _SchedulePickerSheetState();
}

class _SchedulePickerSheetState extends State<_SchedulePickerSheet> {
  late DateTime _date;
  late TimeOfDay _time;

  @override
  void initState() {
    super.initState();
    final initial =
        widget.initialValue ??
        DateTime.now().add(const Duration(minutes: 30));
    _date = DateTime(initial.year, initial.month, initial.day);
    _time = TimeOfDay.fromDateTime(initial);
  }

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      20,
      12,
      20,
      20 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 5,
          decoration: BoxDecoration(
            color: const Color(0xFFCDD3DC),
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        const SizedBox(height: 18),
        const Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Schedule your ride',
            style: TextStyle(
              color: AppColors.navy,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(height: 14),
        CalendarDatePicker(
          initialDate: _date,
          firstDate: DateTime(
            DateTime.now().year,
            DateTime.now().month,
            DateTime.now().day,
          ),
          lastDate: DateTime.now().add(const Duration(days: 90)),
          onDateChanged: (value) => setState(() => _date = value),
        ),
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 4),
          leading: const CircleAvatar(
            backgroundColor: Color(0xFFFFF1E8),
            child: Icon(Icons.schedule_rounded, color: AppColors.orange),
          ),
          title: const Text(
            'Pickup time',
            style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w700),
          ),
          trailing: TextButton(
            onPressed: () async {
              final value = await showTimePicker(
                context: context,
                initialTime: _time,
              );
              if (value != null && mounted) setState(() => _time = value);
            },
            child: Text(
              _time.format(context),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: () {
              final value = DateTime(
                _date.year,
                _date.month,
                _date.day,
                _time.hour,
                _time.minute,
              );
              if (value.isBefore(DateTime.now())) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please choose a future time')),
                );
                return;
              }
              Navigator.pop(context, value);
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.orange,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'Confirm date & time',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    ),
  );
}

class _Ride {
  const _Ride({
    required this.categoryId,
    required this.variantId,
    required this.name,
    required this.variant,
    required this.amount,
    required this.category,
    required this.description,
    required this.detail,
    required this.seats,
    required this.price,
    required this.eta,
    required this.image,
    required this.available,
  });
  final String categoryId;
  final String variantId;
  final String name;
  final String variant;
  final int amount;
  final String category;
  final String description;
  final String detail;
  final String seats;
  final String price;
  final String eta;
  final String image;
  final bool available;
}
