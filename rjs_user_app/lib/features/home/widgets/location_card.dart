import 'package:flutter/material.dart';

import '../../../core/network/customer_auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../location/screens/location_search_screen.dart';
import '../../location/models/map_place.dart';
import '../../location/services/maps_service.dart';
import '../../rides/screens/choose_ride_screen.dart';
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
  MapPlace? _destination;
  MapPlace? _pickup;
  bool _openingDestination = false;
  double _pullDistance = 0;
  bool _draggingMap = false;

  @override
  void initState() {
    super.initState();
    _placesFuture = SavedPlacesService.getAll();
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Future<void> _chooseDestination() async {
    if (_openingDestination) return;
    final pickupFuture = _pickup == null
        ? MapsService.currentPlace()
        : Future<MapPlace>.value(_pickup!);
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
            final places = snapshot.data ?? const <Map<String, dynamic>>[];
            final hasHome = places.any((place) => place['type'] == 'HOME');
            final hasWork = places.any((place) => place['type'] == 'WORK');
            final favoriteCount = places
                .where((place) => place['type'] == 'FAVORITE')
                .length;
            Map<String, dynamic>? findPlace(String type) {
              for (final place in places) {
                if (place['type'] == type) return place;
              }
              return null;
            }

            Future<void> openPlace(String type) async {
              final changed = type == 'FAVORITE'
                  ? await showFavoritePlacesSheet(context)
                  : await showQuickPlaceSheet(
                      context,
                      type: type,
                      address: findPlace(type),
                    );
              if (changed == true && mounted) {
                setState(() => _placesFuture = SavedPlacesService.getAll());
              }
            }

            return IntrinsicHeight(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _Shortcut(
                    Icons.home_rounded,
                    'Home',
                    hasHome ? 'Saved' : 'Add',
                    AppColors.orange,
                    onTap: () => openPlace('HOME'),
                  ),
                  const VerticalDivider(color: Color(0xFFE5E7EC), width: 1),
                  _Shortcut(
                    Icons.work_rounded,
                    'Work',
                    hasWork ? 'Saved' : 'Add',
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
                  const _Shortcut(
                    Icons.access_time_filled_rounded,
                    'Recent',
                    'View',
                    AppColors.blue,
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
  );
}
