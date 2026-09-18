import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/navigation/pickup_navigation.dart';
import '../../../core/location/driver_location_service.dart';
import '../../../core/theme/app_colors.dart';

class PickupPreviewScreen extends StatefulWidget {
  const PickupPreviewScreen({super.key, required this.trip});
  final Map<String, dynamic> trip;
  @override
  State<PickupPreviewScreen> createState() => _PickupPreviewScreenState();
}

class _PickupPreviewScreenState extends State<PickupPreviewScreen> {
  Map<String, dynamic>? _data;
  String? _error;
  bool _loading = false;
  bool _starting = false;
  Timer? _timer;
  GoogleMapController? _controller;
  DateTime? _lastRefresh;
  String get _id => widget.trip['id'].toString();
  Map get _trip => _data?['trip'] as Map? ?? widget.trip;
  Map get _preparation => _data?['preparation'] as Map? ?? const {};
  DateTime? get _departure =>
      DateTime.tryParse(_trip['recommendedDepartureAt']?.toString() ?? '');
  DateTime? get _pickupAt =>
      DateTime.tryParse(_trip['scheduledStartAt']?.toString() ?? '');
  bool get _enRoute => _trip['status'] == 'DRIVER_EN_ROUTE';
  bool get _scheduled => _trip['timing'] == 'SCHEDULED';
  bool get _overdue => !_enRoute && _scheduled && _pickupAt != null && !_pickupAt!.isAfter(DateTime.now());
  bool get _fresh {
    final date = DateTime.tryParse(_preparation['checkedAt']?.toString() ?? '');
    return date != null &&
        DateTime.now().difference(date) < const Duration(minutes: 5);
  }

  bool get _canStart =>
      !_overdue &&
      _fresh &&
      !_enRoute &&
      (!_scheduled || (_departure != null && !_departure!.isAfter(DateTime.now()))) &&
      _data?['onlineRequired'] != true;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (!mounted) return;
      setState(() {});
      // No day-long GPS loop: refresh only near the calculated departure while this screen is open.
      if (!_overdue &&
          !_starting &&
          _departure != null &&
          !_departure!.isAfter(
            DateTime.now().add(const Duration(minutes: 5)),
          ) &&
          (_lastRefresh == null ||
              DateTime.now().difference(_lastRefresh!) >=
                  const Duration(minutes: 2))) {
        _refresh();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    if (_loading || _starting) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await DriverApiService.pickupPreview(_id);
      if (!mounted) return;
      setState(() {
        _data = data;
        _lastRefresh = DateTime.now();
      });
      await _fitMap();
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString().replaceFirst('Exception: ', '');
          _data = null;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  LatLng _point(Map value) => LatLng(
    (value['latitude'] as num).toDouble(),
    (value['longitude'] as num).toDouble(),
  );
  Future<void> _fitMap() async {
    final origin = _preparation['origin'] as Map?;
    final pickup = _trip['pickup'] as Map?;
    if (_controller == null || origin == null || pickup == null) return;
    final first = _point(origin), second = _point(pickup);
    if ((first.latitude - second.latitude).abs() < .0001 &&
        (first.longitude - second.longitude).abs() < .0001) {
      await _controller!.animateCamera(CameraUpdate.newLatLngZoom(second, 16));
    } else {
      final points = [
        first,
        second,
        ..._decode(
          (_preparation['route'] as Map?)?['encodedPolyline']?.toString() ?? '',
        ),
      ];
      await _controller!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(
              points.map((p) => p.latitude).reduce(math.min),
              points.map((p) => p.longitude).reduce(math.min),
            ),
            northeast: LatLng(
              points.map((p) => p.latitude).reduce(math.max),
              points.map((p) => p.longitude).reduce(math.max),
            ),
          ),
          55,
        ),
      );
    }
  }

  Future<void> _goOnline() async {
    if (_loading || _starting) return;
    try {
      await DriverApiService.setOnline(true);
      await _refresh();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  Future<void> _start() async {
    if (!_canStart || _loading || _starting) return;
    setState(() => _starting = true);
    try {
      await DriverLocationService.prepareForAcceptedRide();
      final trip = await DriverApiService.markEnRoute(_id);
      await DriverLocationService.ensureRunning(trip);
      if (mounted) setState(() => _data = {...?_data, 'trip': trip});
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString().replaceFirst('Exception: ', '');
          _data = null;
        });
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _navigate() async {
    final pickup = _trip['pickup'] as Map?;
    if (pickup == null || _starting) return;
    setState(() {
      _starting = true;
      _error = null;
    });
    try {
      final origin = await DriverApiService.pickupLocation(requirePrecise: true);
      if (!mounted) return;
      final url = pickupNavigationUrl(origin: origin, destination: pickup);
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not open Google Maps. Check that Maps or a browser is installed.');
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _arrive() async {
    if (!_enRoute || _starting || _loading) return;
    setState(() => _starting = true);
    try {
      final trip = await DriverApiService.markArrived(_id);
      await DriverLocationService.ensureRunning(trip);
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  String _time(DateTime? value) => value == null
      ? '--'
      : '${MaterialLocalizations.of(context).formatMediumDate(value.toLocal())} · ${TimeOfDay.fromDateTime(value.toLocal()).format(context)}';

  @override
  Widget build(BuildContext context) {
    final pickup = _trip['pickup'] as Map? ?? const {};
    final origin = _preparation['origin'] as Map?;
    final route = _preparation['route'] as Map? ?? const {};
    return Scaffold(
      appBar: AppBar(title: const Text('Pickup location')),
      body: Column(
        children: [
          Expanded(
            child: origin == null
                ? Center(
                    child: _loading
                        ? const CircularProgressIndicator()
                        : const Text('Refresh to load your pickup route'),
                  )
                : GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: _point(pickup),
                      zoom: 13,
                    ),
                    onMapCreated: (controller) {
                      _controller = controller;
                      _fitMap();
                    },
                    markers: {
                      Marker(
                        markerId: const MarkerId('driver'),
                        position: _point(origin),
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueAzure,
                        ),
                        infoWindow: const InfoWindow(title: 'Your location'),
                      ),
                      Marker(
                        markerId: const MarkerId('pickup'),
                        position: _point(pickup),
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueOrange,
                        ),
                        infoWindow: const InfoWindow(title: 'Pickup'),
                      ),
                    },
                    polylines: {
                      Polyline(
                        polylineId: const PolylineId('pickup-route'),
                        points: _decode(
                          route['encodedPolyline']?.toString() ?? '',
                        ),
                        color: AppColors.blue,
                        width: 5,
                      ),
                    },
                    zoomControlsEnabled: false,
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    pickup['address']?.toString() ?? 'Pickup',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  if (_data != null)
                    Text(
                      'ETA: ${route['durationMinutes']} min · ${route['distanceKm']} km',
                    ),
                  if (_scheduled) Text('Pickup: ${_time(_pickupAt)}'),
                  if (_departure != null)
                    Text(
                      'Start available: ${_time(_departure)} (ETA + 15 min)',
                    ),
                  if (_overdue)
                    const Text(
                      'Pickup overdue. Contact RJS admin.',
                      style: TextStyle(color: AppColors.orange),
                    ),
                  if (_error != null)
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  if (_data?['onlineRequired'] == true && !_overdue)
                    TextButton(
                      onPressed: _loading || _starting ? null : _goOnline,
                      child: const Text('Go online to prepare for pickup'),
                    ),
                  const SizedBox(height: 8),
                  if (_enRoute || _canStart)
                    FilledButton.icon(
                      onPressed: _starting || _loading ? null : _navigate,
                      icon: const Icon(Icons.navigation),
                      label: const Text('Navigate to Pickup'),
                    ),
                  FilledButton(
                    onPressed: (_enRoute || _canStart) && !_loading && !_starting
                        ? (_enRoute ? _arrive : _start)
                        : null,
                    child: Text(_starting ? 'Updating…' : _enRoute ? "I've Arrived" : 'Start to Pickup'),
                  ),
                  OutlinedButton(
                    onPressed: _loading || _starting ? null : _refresh,
                    child: Text(
                      _loading
                          ? 'Refreshing…'
                          : 'Refresh location & availability',
                    ),
                  ),
                  const Text(
                    'This is a route preview. Customer live tracking starts only after Start to Pickup.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

List<LatLng> _decode(String encoded) {
  final points = <LatLng>[];
  var index = 0, latitude = 0, longitude = 0;
  int read() {
    var result = 0, shift = 0, value = 0;
    do {
      if (index >= encoded.length || shift > 30) {
        throw const FormatException('Invalid route');
      }
      value = encoded.codeUnitAt(index++) - 63;
      result |= (value & 31) << shift;
      shift += 5;
    } while (value >= 32);
    return (result & 1) != 0 ? ~(result >> 1) : result >> 1;
  }

  try {
    while (index < encoded.length) {
      latitude += read();
      longitude += read();
      points.add(LatLng(latitude / 1e5, longitude / 1e5));
    }
  } catch (_) {
    return [];
  }
  return points;
}
