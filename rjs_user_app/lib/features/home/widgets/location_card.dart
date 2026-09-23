import 'package:flutter/material.dart';

import '../../../core/network/customer_auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../location/screens/location_search_screen.dart';
import '../../location/models/map_place.dart';
import '../../location/services/maps_service.dart';
import '../../rides/screens/choose_ride_screen.dart';
import '../../rides/services/customer_booking_service.dart';
import '../../saved_places/screens/saved_places_screen.dart';
import '../../saved_places/services/saved_places_service.dart';

class LocationCard extends StatefulWidget {
  const LocationCard({super.key, this.onPullDown});

  final Future<void> Function()? onPullDown;

  @override
  State<LocationCard> createState() => _LocationCardState();
}

class _LocationCardState extends State<LocationCard> {
  late Future<List<Map<String, dynamic>>> _placesFuture;
  late Future<List<MapPlace>> _recentFuture;
  MapPlace? _destination;
  MapPlace? _pickup;
  bool _openingDestination = false;
  double _pullDistance = 0;
  bool _draggingMap = false;

  @override
  void initState() {
    super.initState();
    _placesFuture = SavedPlacesService.getAll();
    _recentFuture = _loadRecentDestinations();
  }

  void _refreshSavedPlaces() {
    if (!mounted) return;
    final next = SavedPlacesService.getAll();
    setState(() { _placesFuture = next; });
  }

  void _refreshRecentDestinations() {
    if (!mounted) return;
    final next = _loadRecentDestinations();
    setState(() { _recentFuture = next; });
  }

  Future<List<MapPlace>> _loadRecentDestinations() async {
    final bookings = await CustomerBookingService.list();
    final seen = <String>{};
    final recent = <MapPlace>[];
    for (final booking in bookings) {
      if (booking['status'] != 'COMPLETED' ||
          !['IMMEDIATE_RIDE', 'SCHEDULED_RIDE'].contains(booking['serviceType'])) {
        continue;
      }
      final destination = booking['destination'];
      if (destination is! Map || destination['latitude'] is! num || destination['longitude'] is! num) continue;
      final address = destination['address']?.toString().trim() ?? '';
      if (address.isEmpty) continue;
      final latitude = (destination['latitude'] as num).toDouble();
      final longitude = (destination['longitude'] as num).toDouble();
      final key = '${latitude.toStringAsFixed(5)},${longitude.toStringAsFixed(5)}';
      if (!seen.add(key)) continue;
      recent.add(MapPlace(address: address, latitude: latitude, longitude: longitude));
      if (recent.length == 5) break;
    }
    return recent;
  }

  void _showError(Object error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(error.toString().replaceFirst('Exception: ', '')),
      behavior: SnackBarBehavior.floating,
    ));
  }

  Future<void> _startRideTo(MapPlace destination) async {
    if (_openingDestination) return;
    setState(() { _destination = destination; _openingDestination = true; });
    try {
      final pickup = await MapsService.currentPlace();
      if (!mounted) return;
      _pickup = pickup;
      setState(() => _openingDestination = false);
      await Navigator.push<void>(context, MaterialPageRoute(
        builder: (_) => ChooseRideScreen(pickup: pickup, destination: destination),
      ));
      _refreshRecentDestinations();
    } catch (error) {
      if (mounted) setState(() => _openingDestination = false);
      _showError(error);
    }
  }

  Future<void> _useSavedPlace(Map<String, dynamic> saved) async {
    final location = saved['location'];
    if (location is Map && location['latitude'] is num && location['longitude'] is num) {
      await _startRideTo(MapPlace(
        name: saved['label']?.toString(),
        address: saved['addressLine']?.toString() ?? '',
        latitude: (location['latitude'] as num).toDouble(),
        longitude: (location['longitude'] as num).toDouble(),
      ));
      return;
    }
    final selected = await Navigator.push<MapPlace>(context, MaterialPageRoute(
      builder: (_) => LocationSearchScreen(initialValue: saved['addressLine']?.toString()),
    ));
    if (selected == null || !mounted) return;
    try {
      await SavedPlacesService.save(
        id: saved['id']?.toString(),
        type: saved['type']?.toString() ?? 'FAVORITE',
        label: saved['label']?.toString() ?? '',
        addressLine: selected.address,
        landmark: saved['landmark']?.toString() ?? '',
        city: saved['city']?.toString() ?? 'Bengaluru',
        pincode: saved['pincode']?.toString() ?? '',
        latitude: selected.latitude,
        longitude: selected.longitude,
      );
      _refreshSavedPlaces();
    } catch (error) {
      _showError(error);
    }
    if (mounted) await _startRideTo(selected);
  }

  Future<void> _openRecent() async {
    List<MapPlace> recent;
    try {
      recent = await _loadRecentDestinations();
      if (mounted) {
        final loaded = Future.value(recent);
        setState(() {
          _recentFuture = loaded;
        });
      }
    } catch (error) {
      _showError(error);
      return;
    }
    if (!mounted) return;
    final selected = await showModalBottomSheet<MapPlace>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(child: SizedBox(
        height: MediaQuery.sizeOf(sheetContext).height * .6,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Padding(padding: EdgeInsets.fromLTRB(20, 4, 20, 12), child: Text(
            'Recent destinations', style: TextStyle(color: AppColors.navy, fontSize: 21, fontWeight: FontWeight.w800))),
          Expanded(child: recent.isEmpty
            ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text(
                'Your completed ride destinations will appear here.', textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted))))
            : ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: recent.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (_, index) => ListTile(
                  leading: const Icon(Icons.history_rounded, color: AppColors.blue),
                  title: Text(recent[index].address, maxLines: 2, overflow: TextOverflow.ellipsis),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.pop(sheetContext, recent[index]),
                ),
              )),
        ]),
      )),
    );
    if (selected != null && mounted) await _startRideTo(selected);
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Future<void> _chooseDestination() async {
    if (_openingDestination) return;
    final pickupFuture = MapsService.currentPlace();
    final selected = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            LocationSearchScreen(initialValue: _destination?.address),
      ),
    );
    if (selected == null) {
      try {
        _pickup = await pickupFuture;
      } catch (_) {}
      return;
    }
    if (mounted) {
      setState(() {
        _destination = selected;
        _openingDestination = true;
      });
      try {
        _pickup = await pickupFuture;
        if (!mounted) return;
        setState(() => _openingDestination = false);
        await Navigator.push<void>(
          context,
          MaterialPageRoute(
            builder: (_) =>
                ChooseRideScreen(pickup: _pickup!, destination: selected),
          ),
        );
      } catch (error) {
        if (mounted) {
          setState(() => _openingDestination = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error.toString().replaceFirst('Exception: ', '')),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _finishMapPull(DragEndDetails details) async {
    final shouldOpen =
        _pullDistance >= 28 || (details.primaryVelocity ?? 0) > 180;
    setState(() {
      _draggingMap = false;
      _pullDistance = shouldOpen ? 54 : 0;
    });
    if (!shouldOpen) return;
    await Future<void>.delayed(const Duration(milliseconds: 90));
    await widget.onPullDown?.call();
    if (mounted) setState(() => _pullDistance = 0);
  }

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: _draggingMap ? Duration.zero : const Duration(milliseconds: 240),
    curve: Curves.easeOutCubic,
    transform: Matrix4.translationValues(0, _pullDistance * .32, 0),
    padding: const EdgeInsets.fromLTRB(15, 13, 15, 13),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      boxShadow: const [
        BoxShadow(
          color: Color(0x150A244A),
          blurRadius: 18,
          offset: Offset(0, 7),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onVerticalDragStart: (_) => setState(() {
              _draggingMap = true;
              _pullDistance = 0;
            }),
            onVerticalDragUpdate: (details) {
              setState(() {
                _pullDistance = (_pullDistance + details.delta.dy)
                    .clamp(0, 110)
                    .toDouble();
              });
            },
            onVerticalDragCancel: () => setState(() {
              _draggingMap = false;
              _pullDistance = 0;
            }),
            onVerticalDragEnd: _finishMapPull,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(36, 2, 36, 8),
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD2DE),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        FutureBuilder<Map<String, dynamic>?>(
          future: CustomerAuthService.getCachedCustomer(),
          builder: (context, snapshot) => Text(
            '$_greeting, ${snapshot.data?['name'] as String? ?? 'there'}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.muted,
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Where can we take you?',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: 11),
        _field(
          Icons.location_on_rounded,
          AppColors.orange,
          _destination?.address ?? 'Enter your destination',
          _destination == null ? const Color(0xFF9BA1AF) : AppColors.navy,
          _openingDestination ? null : Icons.arrow_forward_rounded,
          onTap: _chooseDestination,
        ),
        if (_openingDestination) ...[
          const SizedBox(height: 5),
          const LinearProgressIndicator(color: AppColors.orange, minHeight: 2),
        ],
        const SizedBox(height: 13),
        FutureBuilder<List<Map<String, dynamic>>>(
          future: _placesFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
            }
            if (snapshot.hasError) {
              return Row(children: [
                const Expanded(child: Text('Saved places could not be loaded.',
                  style: TextStyle(color: AppColors.muted, fontSize: 12))),
                TextButton(onPressed: _refreshSavedPlaces,
                  child: const Text('Retry')),
              ]);
            }
            final places = snapshot.data ?? const <Map<String, dynamic>>[];
            final favoriteCount = places
                .where((place) => place['type'] == 'FAVORITE')
                .length;
            Map<String, dynamic>? findPlace(String type) {
              for (final place in places) {
                if (place['type'] == type) return place;
              }
              return null;
            }
            final home = findPlace('HOME');
            final work = findPlace('WORK');

            Future<void> openPlace(String type) async {
              if (_openingDestination) return;
              if (type == 'FAVORITE') {
                final result = await showFavoritePlacesSheet(context);
                if (!mounted) return;
                _refreshSavedPlaces();
                if (result is Map<String, dynamic>) await _useSavedPlace(result);
                return;
              }
              final saved = findPlace(type);
              final result = await showQuickPlaceSheet(context, type: type, address: saved);
              if (!mounted) return;
              if (result == QuickPlaceSheetResult.saved) {
                _refreshSavedPlaces();
              } else if (result == QuickPlaceSheetResult.book && saved != null) {
                await _useSavedPlace(saved);
              }
            }

            return IntrinsicHeight(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _Shortcut(
                    Icons.home_rounded,
                    'Home',
                    home?['addressLine']?.toString() ?? 'Add',
                    AppColors.orange,
                    onTap: () => openPlace('HOME'),
                  ),
                  const VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
                  _Shortcut(
                    Icons.work_rounded,
                    'Work',
                    work?['addressLine']?.toString() ?? 'Add',
                    AppColors.blue,
                    onTap: () => openPlace('WORK'),
                  ),
                  const VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
                  _Shortcut(
                    Icons.star_rounded,
                    'Favorites',
                    favoriteCount == 0 ? 'Add' : '$favoriteCount saved',
                    AppColors.orange,
                    onTap: () => openPlace('FAVORITE'),
                  ),
                  const VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
                  FutureBuilder<List<MapPlace>>(
                    future: _recentFuture,
                    builder: (context, recentSnapshot) => _Shortcut(
                    Icons.access_time_filled_rounded,
                    'Recent',
                    recentSnapshot.hasData ? '${recentSnapshot.data!.length} places' : 'View',
                    AppColors.blue,
                    onTap: _openRecent,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    ),
  );

  Widget _field(
    IconData icon,
    Color iconColor,
    String text,
    Color textColor,
    IconData? trailing, {
    VoidCallback? onTap,
  }) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE2E5EB)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: textColor,
                fontSize: 14.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (trailing != null)
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5FB),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(trailing, color: AppColors.blue, size: 19),
            ),
        ],
      ),
    ),
  );
}

class _Shortcut extends StatelessWidget {
  const _Shortcut(
    this.icon,
    this.title,
    this.subtitle,
    this.color, {
    this.onTap,
  });
  final IconData icon;
  final String title, subtitle;
  final Color color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Tooltip(
      message: subtitle,
      child: SizedBox(
        width: 70,
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 3),
            Text(
              title,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11.5,
                color: AppColors.navy,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              subtitle,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10.5, color: AppColors.muted),
            ),
          ],
        ),
      ),
    ),
  );
}
