import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../rides/screens/choose_ride_screen.dart';
import '../models/map_place.dart';
import '../services/maps_service.dart';
import 'location_search_screen.dart';

class FullMapTripPickerScreen extends StatefulWidget {
  const FullMapTripPickerScreen({super.key});

  @override
  State<FullMapTripPickerScreen> createState() =>
      _FullMapTripPickerScreenState();
}

class _FullMapTripPickerScreenState extends State<FullMapTripPickerScreen> {
  static const LatLng _bengaluru = LatLng(12.9716, 77.5946);

  GoogleMapController? _controller;
  MapPlace? _pickup;
  MapPlace? _destination;
  bool _loadingPickup = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentPickup();
  }

  Future<void> _loadCurrentPickup() async {
    try {
      final pickup = await MapsService.currentPlace();
      if (!mounted) return;
      setState(() => _pickup = pickup);
      await _showSelectedPlaces();
    } catch (_) {
      // The user can still choose the pickup manually.
    } finally {
      if (mounted) setState(() => _loadingPickup = false);
    }
  }

  Future<void> _choosePickup() async {
    final selected = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _pickup?.address,
          initialPlace: _pickup,
        ),
      ),
    );
    if (selected == null || !mounted) return;
    setState(() => _pickup = selected);
    await _showSelectedPlaces();
  }

  Future<void> _chooseDestination() async {
    final selected = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _destination?.address,
          initialPlace: _destination,
        ),
      ),
    );
    if (selected == null || !mounted) return;
    setState(() => _destination = selected);
    await _showSelectedPlaces();
  }

  Future<void> _showSelectedPlaces() async {
    final controller = _controller;
    final pickup = _pickup;
    if (controller == null || pickup == null) return;
    final destination = _destination;
    if (destination == null) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(pickup.latitude, pickup.longitude),
          15.5,
        ),
      );
      return;
    }

    final south = pickup.latitude < destination.latitude
        ? pickup.latitude
        : destination.latitude;
    final north = pickup.latitude > destination.latitude
        ? pickup.latitude
        : destination.latitude;
    final west = pickup.longitude < destination.longitude
        ? pickup.longitude
        : destination.longitude;
    final east = pickup.longitude > destination.longitude
        ? pickup.longitude
        : destination.longitude;
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(south, west),
          northeast: LatLng(north, east),
        ),
        82,
      ),
    );
  }

  void _continue() {
    final pickup = _pickup;
    final destination = _destination;
    if (pickup == null || destination == null) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            ChooseRideScreen(pickup: pickup, destination: destination),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pickup = _pickup;
    final destination = _destination;
    final markers = <Marker>{
      if (pickup != null)
        Marker(
          markerId: const MarkerId('pickup'),
          position: LatLng(pickup.latitude, pickup.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueOrange,
          ),
        ),
      if (destination != null)
        Marker(
          markerId: const MarkerId('destination'),
          position: LatLng(destination.latitude, destination.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueAzure,
          ),
        ),
    };

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          Positioned.fill(
            child: GoogleMap(
              mapId: GoogleMapsConfig.mapId,
              initialCameraPosition: const CameraPosition(
                target: _bengaluru,
                zoom: 12.5,
              ),
              markers: markers,
              compassEnabled: false,
              mapToolbarEnabled: false,
              myLocationButtonEnabled: false,
              rotateGesturesEnabled: false,
              tiltGesturesEnabled: false,
              zoomControlsEnabled: false,
              onMapCreated: (controller) {
                _controller = controller;
                _showSelectedPlaces();
              },
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 0, 0),
                child: _CircleButton(
                  icon: Icons.arrow_back_rounded,
                  onTap: () => Navigator.pop(context),
                ),
              ),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 294 + MediaQuery.paddingOf(context).bottom,
            child: _CircleButton(
              icon: Icons.my_location_rounded,
              onTap: () async {
                final current = await MapsService.currentPlace();
                if (!mounted) return;
                setState(() => _pickup = current);
                await _showSelectedPlaces();
              },
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 0),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x300A244A),
                    blurRadius: 24,
                    offset: Offset(0, -6),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCAD0DA),
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    const SizedBox(height: 11),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Plan your ride',
                        style: TextStyle(
                          color: AppColors.navy,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    _LocationInput(
                      color: AppColors.orange,
                      label: 'Pickup location',
                      value:
                          pickup?.address ??
                          (_loadingPickup
                              ? 'Finding your current location…'
                              : 'Choose pickup location'),
                      onTap: _choosePickup,
                    ),
                    const SizedBox(height: 9),
                    _LocationInput(
                      color: AppColors.blue,
                      label: 'Destination',
                      value:
                          destination?.address ?? 'Where would you like to go?',
                      onTap: _chooseDestination,
                    ),
                    const SizedBox(height: 13),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: FilledButton(
                        onPressed: pickup != null && destination != null
                            ? _continue
                            : null,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.orange,
                          disabledBackgroundColor: const Color(0xFFCBD2DE),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Choose ride',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(width: 9),
                            Icon(Icons.arrow_forward_rounded),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationInput extends StatelessWidget {
  const _LocationInput({
    required this.color,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final Color color;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xFFF8FAFD),
    borderRadius: BorderRadius.circular(13),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(13),
      child: Container(
        constraints: const BoxConstraints(minHeight: 57),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE0E5ED)),
          borderRadius: BorderRadius.circular(13),
        ),
        child: Row(
          children: [
            Icon(Icons.location_on_rounded, color: color, size: 23),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.edit_outlined, color: AppColors.blue, size: 19),
          ],
        ),
      ),
    ),
  );
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 4,
    shadowColor: const Color(0x260A244A),
    child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 48,
        height: 48,
        child: Icon(icon, color: AppColors.navy, size: 27),
      ),
    ),
  );
}
