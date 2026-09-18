import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../location/models/map_place.dart';
import '../../location/services/maps_service.dart';
import 'home_header.dart';
import 'location_card.dart';

class MapBookingHeader extends StatefulWidget {
  const MapBookingHeader({
    super.key,
    required this.onMenuTap,
    required this.onOpenFullMap,
    this.pullDistance = 0,
  });

  final VoidCallback onMenuTap;
  final Future<void> Function() onOpenFullMap;
  final double pullDistance;

  @override
  State<MapBookingHeader> createState() => _MapBookingHeaderState();
}

class _MapBookingHeaderState extends State<MapBookingHeader> {
  static const LatLng _bengaluru = LatLng(12.9716, 77.5946);

  late final Future<MapPlace> _currentPlace;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _currentPlace = MapsService.currentPlace();
    _currentPlace.then((place) {
      if (!mounted) return;
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(
        LatLng(place.latitude, place.longitude), 15.5,
      ));
    }, onError: (Object _) {});
  }

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 430,
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned.fill(
          bottom: (104 - widget.pullDistance * .72).clamp(0, 104),
          child: Transform.translate(
            offset: Offset(0, -widget.pullDistance),
            child: FutureBuilder<MapPlace>(
              future: _currentPlace,
              builder: (context, snapshot) {
                final place = snapshot.data ?? MapsService.cachedCurrentPlace;
                final center = place == null
                    ? _bengaluru
                    : LatLng(place.latitude, place.longitude);
                return GoogleMap(
                  onMapCreated: (controller) {
                    _mapController = controller;
                    final current = MapsService.cachedCurrentPlace;
                    if (current != null) {
                      controller.moveCamera(CameraUpdate.newLatLngZoom(
                        LatLng(current.latitude, current.longitude), 15.5,
                      ));
                    }
                  },
                  mapId: GoogleMapsConfig.mapId,
                  initialCameraPosition: CameraPosition(
                    target: center,
                    zoom: place == null ? 12.5 : 15.5,
                  ),
                  markers: place == null
                      ? const {}
                      : {
                          Marker(
                            markerId: const MarkerId('current-location'),
                            position: center,
                            icon: BitmapDescriptor.defaultMarkerWithHue(
                              BitmapDescriptor.hueAzure,
                            ),
                          ),
                        },
                  compassEnabled: false,
                  mapToolbarEnabled: false,
                  myLocationButtonEnabled: false,
                  rotateGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  zoomControlsEnabled: false,
                );
              },
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: 214,
          height: 84,
          child: Transform.translate(
            offset: Offset(0, -widget.pullDistance),
            child: const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xFFFBFCFE)],
                ),
              ),
            ),
          ),
        ),
        Transform.translate(
          offset: Offset(0, -widget.pullDistance),
          child: HomeHeader(onMenuTap: widget.onMenuTap),
        ),
        Positioned(
          left: 16,
          right: 16,
          top: 221,
          child: LocationCard(onPullDown: widget.onOpenFullMap),
        ),
      ],
    ),
  );
}
