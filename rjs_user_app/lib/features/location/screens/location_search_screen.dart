import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../models/map_place.dart';
import '../services/maps_service.dart';
import '../../saved_places/services/saved_places_service.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({super.key, this.initialValue, this.initialPlace});
  final String? initialValue;
  final MapPlace? initialPlace;

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  late final TextEditingController _search;
  late final String _sessionToken;
  Timer? _debounce;
  List<Map<String, dynamic>> _predictions = const [];
  bool _busy = false;
  List<Map<String, dynamic>> _saved = const [];
  bool _showAllFavorites = false;
  bool _mapMode = false;
  bool _resolvingPin = false;
  MapPlace? _pinPlace;
  LatLng? _mapCenter;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController(text: widget.initialValue ?? '');
    _sessionToken = _newSessionToken();
    if (_search.text.trim().length >= 3) _scheduleSearch(_search.text);
    _loadSaved();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  String _newSessionToken() {
    final random = Random.secure();
    String hex(int length) => List.generate(length, (_) => random.nextInt(16).toRadixString(16)).join();
    return '${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + random.nextInt(4)).toRadixString(16)}${hex(3)}-${hex(12)}';
  }

  void _scheduleSearch(String value) {
    final query = value.trim();
    _debounce?.cancel();
    if (query.length < 3) {
      setState(() => _predictions = const []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () => _find(query));
  }

  Future<void> _find(String query) async {
    setState(() => _busy = true);
    try {
      final results = await MapsService.autocomplete(input: query, sessionToken: _sessionToken);
      if (mounted && _search.text.trim() == query) setState(() => _predictions = results);
    } catch (error) {
      if (mounted) _error(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _select(Map<String, dynamic> prediction) async {
    setState(() => _busy = true);
    try {
      final place = await MapsService.placeDetails(prediction['placeId'].toString(), _sessionToken);
      if (mounted) Navigator.pop<MapPlace>(context, place);
    } catch (error) {
      if (mounted) _error(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _currentLocation() async {
    setState(() => _busy = true);
    try {
      final place = await MapsService.currentPlace();
      if (mounted) Navigator.pop<MapPlace>(context, place);
    } catch (error) {
      if (mounted) _error(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openMapPicker() async {
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);
    try {
      MapPlace initial;
      if (widget.initialPlace != null &&
          (_search.text.trim().isEmpty || _search.text.trim() == widget.initialPlace!.address)) {
        initial = widget.initialPlace!;
      } else if (_predictions.isNotEmpty) {
        initial = await MapsService.placeDetails(
          _predictions.first['placeId'].toString(),
          _sessionToken,
        );
      } else if (_search.text.trim().length >= 3) {
        final matches = await MapsService.autocomplete(
          input: _search.text.trim(),
          sessionToken: _sessionToken,
        );
        if (matches.isEmpty) throw Exception('Select a valid location before opening the map');
        initial = await MapsService.placeDetails(matches.first['placeId'].toString(), _sessionToken);
      } else {
        initial = await MapsService.currentPlace();
      }
      if (!mounted) return;
      setState(() {
        _pinPlace = initial;
        _mapCenter = LatLng(initial.latitude, initial.longitude);
        _mapMode = true;
      });
    } catch (error) {
      if (mounted) _error(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resolveMapCenter() async {
    final center = _mapCenter;
    if (center == null) return;
    setState(() => _resolvingPin = true);
    try {
      final place = await MapsService.reverseGeocode(center.latitude, center.longitude);
      if (mounted && _mapCenter == center) setState(() => _pinPlace = place);
    } catch (_) {
      if (mounted && _mapCenter == center) {
        setState(() => _pinPlace = MapPlace(
          address: 'Pinned location',
          latitude: center.latitude,
          longitude: center.longitude,
        ));
      }
    } finally {
      if (mounted) setState(() => _resolvingPin = false);
    }
  }

  Future<void> _centerOnCurrentLocation() async {
    try {
      final place = await MapsService.currentPlace();
      final target = LatLng(place.latitude, place.longitude);
      _pinPlace = place;
      _mapCenter = target;
      await _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 17));
      if (mounted) setState(() {});
    } catch (error) {
      if (mounted) _error(error);
    }
  }

  Future<void> _loadSaved() async {
    try {
      final saved = await SavedPlacesService.getAll();
      if (mounted) setState(() => _saved = saved);
    } catch (_) {
      // Destination search still works if saved places cannot be loaded.
    }
  }

  Future<void> _selectSaved(Map<String, dynamic> saved) async {
    final location = saved['location'];
    if (location is Map && location['latitude'] is num && location['longitude'] is num) {
      Navigator.pop<MapPlace>(context, MapPlace(
        name: saved['label']?.toString(),
        address: saved['addressLine']?.toString() ?? '',
        latitude: (location['latitude'] as num).toDouble(),
        longitude: (location['longitude'] as num).toDouble(),
      ));
      return;
    }
    setState(() => _busy = true);
    try {
      final results = await MapsService.autocomplete(input: saved['addressLine']?.toString() ?? '', sessionToken: _sessionToken);
      if (results.isEmpty) throw Exception('This saved address could not be located');
      await _select(results.first);
    } catch (error) {
      if (mounted) _error(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _error(Object error) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(error.toString().replaceFirst('Exception: ', '')),
    behavior: SnackBarBehavior.floating,
  ));

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    body: SafeArea(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: Row(children: [
            _RoundButton(icon: Icons.arrow_back_rounded, onTap: () => Navigator.pop(context)),
            const SizedBox(width: 14),
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Choose Destination', style: TextStyle(color: AppColors.navy, fontSize: 22, fontWeight: FontWeight.w800)),
              SizedBox(height: 2),
              Text('Search a real place or use your location', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
            ])),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: _search,
            autofocus: true,
            onChanged: _scheduleSearch,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search destination',
              prefixIcon: const Icon(Icons.search_rounded, color: AppColors.orange),
              suffixIcon: IconButton(tooltip: 'Use current location', onPressed: _busy ? null : _currentLocation, icon: const Icon(Icons.my_location_rounded, color: AppColors.blue)),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xFFDDE3EC))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xFFDDE3EC))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: AppColors.blue, width: 1.4)),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 9, 16, 0),
          child: SizedBox(
            width: double.infinity,
            height: 43,
            child: OutlinedButton.icon(
              onPressed: _busy ? null : (_mapMode ? () => setState(() => _mapMode = false) : _openMapPicker),
              icon: Icon(_mapMode ? Icons.search_rounded : Icons.map_outlined),
              label: Text(_mapMode ? 'Back to search' : 'Locate on map'),
              style: OutlinedButton.styleFrom(foregroundColor: AppColors.blue, side: const BorderSide(color: AppColors.blue), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13))),
            ),
          ),
        ),
        if (_busy) const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: LinearProgressIndicator(color: AppColors.orange)),
        const SizedBox(height: 12),
        Expanded(
          child: _mapMode ? _mapPicker() : ListView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
            children: [
              _LocationTile(icon: Icons.my_location_rounded, color: AppColors.blue, title: 'Current Location', subtitle: 'Use your device GPS position', onTap: _busy ? () {} : _currentLocation),
              if (_search.text.trim().length < 3 && _saved.isNotEmpty) ...[
                const Padding(padding: EdgeInsets.fromLTRB(2, 12, 2, 9), child: Text('Saved Places', style: TextStyle(color: AppColors.navy, fontSize: 14.5, fontWeight: FontWeight.w800))),
                ..._saved.where((place) => place['type'] != 'FAVORITE').map((place) => _savedTile(place)),
                ...(_showAllFavorites ? _saved.where((place) => place['type'] == 'FAVORITE') : _saved.where((place) => place['type'] == 'FAVORITE').take(2)).map((place) => _savedTile(place)),
                if (_saved.where((place) => place['type'] == 'FAVORITE').length > 2)
                  Center(child: TextButton.icon(
                    onPressed: () => setState(() => _showAllFavorites = !_showAllFavorites),
                    icon: Icon(_showAllFavorites ? Icons.expand_less_rounded : Icons.expand_more_rounded),
                    label: Text(_showAllFavorites ? 'Show less' : 'Show more'),
                  )),
              ],
              if (_search.text.trim().length < 3)
                const Padding(padding: EdgeInsets.only(top: 22), child: Text('Enter at least 3 characters to search Google Maps.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted))),
              ..._predictions.map((place) => _LocationTile(
                icon: Icons.location_on_rounded,
                color: AppColors.orange,
                title: place['primaryText']?.toString() ?? place['description']?.toString() ?? 'Location',
                subtitle: place['secondaryText']?.toString() ?? '',
                onTap: () => _select(place),
              )),
              if (!_busy && _search.text.trim().length >= 3 && _predictions.isEmpty)
                const Padding(padding: EdgeInsets.only(top: 22), child: Text('No matching places found.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted))),
            ],
          ),
        ),
      ]),
    ),
  );

  Widget _mapPicker() {
    final center = _mapCenter;
    if (center == null) return const Center(child: CircularProgressIndicator());
    return Stack(children: [
      GoogleMap(
        mapId: GoogleMapsConfig.mapId,
        initialCameraPosition: CameraPosition(target: center, zoom: 17),
        myLocationEnabled: true,
        myLocationButtonEnabled: false,
        zoomControlsEnabled: false,
        mapToolbarEnabled: false,
        onMapCreated: (controller) => _mapController = controller,
        onCameraMove: (position) {
          _mapCenter = position.target;
          _pinPlace = null;
        },
        onCameraIdle: _resolveMapCenter,
      ),
      const IgnorePointer(child: Center(child: Padding(
        padding: EdgeInsets.only(bottom: 42),
        child: Icon(Icons.location_pin, color: AppColors.orange, size: 52, shadows: [Shadow(color: Color(0x55000000), blurRadius: 8)]),
      ))),
      Positioned(right: 16, bottom: 116, child: FloatingActionButton.small(
        heroTag: 'map-current-location',
        backgroundColor: Colors.white,
        foregroundColor: AppColors.blue,
        onPressed: _centerOnCurrentLocation,
        child: const Icon(Icons.my_location_rounded),
      )),
      Positioned(left: 16, right: 16, bottom: 14, child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x260A244A), blurRadius: 16)]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_resolvingPin ? 'Finding address…' : (_pinPlace?.address ?? 'Move the map to place the pin'), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.navy, fontSize: 12.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 9),
          SizedBox(width: double.infinity, height: 44, child: FilledButton.icon(
            onPressed: _resolvingPin || _pinPlace == null ? null : () => Navigator.pop<MapPlace>(context, _pinPlace),
            style: FilledButton.styleFrom(backgroundColor: AppColors.orange, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            icon: const Icon(Icons.check_rounded),
            label: const Text('Confirm pinned location', style: TextStyle(fontWeight: FontWeight.w800)),
          )),
        ]),
      )),
    ]);
  }

  Widget _savedTile(Map<String, dynamic> place) => _LocationTile(
    icon: place['type'] == 'HOME' ? Icons.home_rounded : place['type'] == 'WORK' ? Icons.work_rounded : Icons.star_rounded,
    color: place['type'] == 'WORK' ? AppColors.blue : AppColors.orange,
    title: place['label']?.toString() ?? 'Saved Place',
    subtitle: place['addressLine']?.toString() ?? '',
    onTap: () => _selectSaved(place),
  );
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    customBorder: const CircleBorder(),
    child: Container(width: 48, height: 48, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0x160A244A), blurRadius: 12, offset: Offset(0, 4))]), child: Icon(icon, color: AppColors.navy, size: 27)),
  );
}

class _LocationTile extends StatelessWidget {
  const _LocationTile({required this.icon, required this.color, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
          decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE5E9F0)), borderRadius: BorderRadius.circular(15)),
          child: Row(children: [
            CircleAvatar(backgroundColor: color.withValues(alpha: .1), child: Icon(icon, color: color, size: 21)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.navy, fontSize: 13.5, fontWeight: FontWeight.w800)),
              if (subtitle.isNotEmpty) ...[const SizedBox(height: 3), Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 11.5))],
            ])),
            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ]),
        ),
      ),
    ),
  );
}
