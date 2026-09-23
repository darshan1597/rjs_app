import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/google_maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/notification_popup.dart';
import '../../location/models/map_place.dart';
import '../../location/screens/location_search_screen.dart';
import '../services/saved_places_service.dart';

enum QuickPlaceSheetResult { saved, book }

Future<QuickPlaceSheetResult?> showQuickPlaceSheet(
  BuildContext context, {
  required String type,
  Map<String, dynamic>? address,
}) => showModalBottomSheet<QuickPlaceSheetResult>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: Colors.transparent,
  builder: (_) => _QuickPlaceSheet(type: type, address: address),
);

Future<Object?> showFavoritePlacesSheet(BuildContext context) =>
    showModalBottomSheet<Object>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _FavoritePlacesSheet(),
    );

Future<bool> _confirmRemovePlace(
  BuildContext context, {
  required String label,
  required bool isFavorite,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => Dialog(
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                color: Color(0xFFFFF0E8),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.delete_outline_rounded,
                color: AppColors.orange,
                size: 25,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              isFavorite ? 'Remove favorite?' : 'Remove saved place?',
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Remove $label from your ${isFavorite ? 'favorites' : 'saved places'}?',
              style: const TextStyle(
                color: AppColors.muted,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(dialogContext, false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.navy,
                      side: const BorderSide(color: Color(0xFFD8DDE7)),
                      minimumSize: const Size.fromHeight(46),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Keep'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.pop(dialogContext, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.orange,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(46),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Remove'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  return confirmed == true;
}

class _SheetHandle extends StatelessWidget {
  const _SheetHandle();

  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      width: 48,
      height: 5,
      margin: const EdgeInsets.only(top: 11, bottom: 18),
      decoration: BoxDecoration(
        color: const Color(0xFFBEC3CC),
        borderRadius: BorderRadius.circular(20),
      ),
    ),
  );
}

class _QuickPlaceSheet extends StatefulWidget {
  const _QuickPlaceSheet({required this.type, this.address});
  final String type;
  final Map<String, dynamic>? address;

  @override
  State<_QuickPlaceSheet> createState() => _QuickPlaceSheetState();
}

class _QuickPlaceSheetState extends State<_QuickPlaceSheet> {
  late final TextEditingController _address;
  late final TextEditingController _label;
  bool _saving = false;
  late bool _editing;
  MapPlace? _selectedPlace;
  String? _error;

  String get _name => widget.type == 'HOME' ? 'Home' : 'Work';

  @override
  void initState() {
    super.initState();
    _editing = widget.address == null;
    _address = TextEditingController(
      text: widget.address?['addressLine'] as String? ?? '',
    );
    _label = TextEditingController(text: _name);
    final location = widget.address?['location'];
    if (location is Map &&
        location['latitude'] is num &&
        location['longitude'] is num) {
      _selectedPlace = MapPlace(
        address: _address.text,
        latitude: (location['latitude'] as num).toDouble(),
        longitude: (location['longitude'] as num).toDouble(),
      );
    }
  }

  Future<void> _pickPlace({bool mapFirst = false}) async {
    final selected = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _address.text,
          initialPlace: _selectedPlace,
          title: 'Choose $_name Location',
          searchHint: 'Search your ${_name.toLowerCase()} location',
          startOnMap: mapFirst,
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() {
        _selectedPlace = selected;
        _address.text = selected.address;
        _error = null;
      });
    }
  }

  @override
  void dispose() {
    _address.dispose();
    _label.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_address.text.trim().length < 5 || _selectedPlace == null) {
      setState(
        () => _error = 'Select your $_name location from search or the map.',
      );
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await SavedPlacesService.save(
        id: widget.address?['id'] as String?,
        type: widget.type,
        label: _name,
        addressLine: _address.text.trim(),
        landmark: widget.address?['landmark'] as String? ?? '',
        city: widget.address?['city'] as String? ?? 'Bengaluru',
        pincode: widget.address?['pincode'] as String? ?? '',
        latitude: _selectedPlace!.latitude,
        longitude: _selectedPlace!.longitude,
      );
      if (mounted) Navigator.pop(context, QuickPlaceSheetResult.saved);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _backToSaved() {
    final saved = widget.address;
    if (saved == null) return;
    final location = saved['location'];
    setState(() {
      _address.text = saved['addressLine']?.toString() ?? '';
      _selectedPlace =
          location is Map &&
              location['latitude'] is num &&
              location['longitude'] is num
          ? MapPlace(
              address: _address.text,
              latitude: (location['latitude'] as num).toDouble(),
              longitude: (location['longitude'] as num).toDouble(),
            )
          : null;
      _error = null;
      _editing = false;
    });
  }

  Widget _savedDetails(BuildContext context) => Container(
    constraints: BoxConstraints(
      maxHeight: MediaQuery.sizeOf(context).height * .78,
    ),
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    child: SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetHandle(),
          Text(
            'Saved $_name Location',
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Your saved destination for quick bookings',
            style: TextStyle(color: AppColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          _MapPreview(
            title: _address.text,
            icon: widget.type == 'HOME'
                ? Icons.home_rounded
                : Icons.work_rounded,
            place: _selectedPlace,
            onChange: () => setState(() => _editing = true),
          ),
          const SizedBox(height: 12),
          Text(
            _address.text,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _editing = true),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit Location'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () =>
                      Navigator.pop(context, QuickPlaceSheetResult.book),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.orange,
                  ),
                  icon: const Icon(Icons.directions_car_rounded, size: 18),
                  label: const Text('Book Ride'),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    if (!_editing) return _savedDetails(context);
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * .78,
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        0,
        20,
        22 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SheetHandle(),
            Text(
              '${widget.address == null ? 'Add' : 'Edit'} $_name Location',
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'Save your ${_name.toLowerCase()} location for faster bookings',
              style: const TextStyle(color: AppColors.muted, fontSize: 14),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _address,
              readOnly: true,
              onTap: () => _pickPlace(),
              decoration: _sheetInput(
                'Tap to choose your ${_name.toLowerCase()} location',
                Icons.location_on_outlined,
                onLocate: () => _pickPlace(mapFirst: true),
              ),
            ),
            const SizedBox(height: 14),
            _MapPreview(
              title: _address.text.trim().isEmpty
                  ? 'Select your location'
                  : _address.text.trim(),
              place: _selectedPlace,
              onChange: () => _pickPlace(mapFirst: true),
              icon: widget.type == 'HOME'
                  ? Icons.home_rounded
                  : Icons.work_rounded,
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _label,
              readOnly: true,
              decoration: _sheetInput(
                'Add a label',
                widget.type == 'HOME'
                    ? Icons.home_outlined
                    : Icons.work_outline_rounded,
              ),
            ),
            const SizedBox(height: 20),
            if (_error != null) ...[
              Text(
                _error!,
                style: const TextStyle(color: Colors.red, fontSize: 12.5),
              ),
              const SizedBox(height: 10),
            ],
            if (widget.address != null) ...[
              TextButton(
                onPressed: _backToSaved,
                child: const Text('Back to saved location'),
              ),
              const SizedBox(height: 4),
            ],
            SizedBox(
              width: double.infinity,
              height: 55,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.orange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  _saving ? 'Saving...' : 'Save Location',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FavoritePlacesSheet extends StatefulWidget {
  const _FavoritePlacesSheet();

  @override
  State<_FavoritePlacesSheet> createState() => _FavoritePlacesSheetState();
}

class _FavoritePlacesSheetState extends State<_FavoritePlacesSheet> {
  late Future<List<Map<String, dynamic>>> _future;
  late final TextEditingController _search;
  bool _changed = false;
  String _query = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController();
    _reload();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _reload() => _future = SavedPlacesService.getAll();

  Future<void> _openEditor([Map<String, dynamic>? address]) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            SavedPlaceEditorScreen(type: 'FAVORITE', address: address),
      ),
    );
    if (changed == true && mounted) {
      setState(() {
        _changed = true;
        _reload();
      });
    }
  }

  Future<void> _delete(Map<String, dynamic> place) async {
    final confirmed = await _confirmRemovePlace(
      context,
      label: '${place['label'] ?? 'this place'}',
      isFavorite: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await SavedPlacesService.delete(place['id'] as String);
      if (mounted) {
        setState(() {
          _error = null;
          _changed = true;
          _reload();
        });
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Container(
    height: MediaQuery.sizeOf(context).height * .72,
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SheetHandle(),
        Row(
          children: [
            const Expanded(
              child: Text(
                'Favorite Places',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pop(context, _changed),
              icon: const Icon(Icons.close_rounded, size: 29),
            ),
          ],
        ),
        const Text(
          'Tap a place to book a ride. Use the icons to edit or remove it.',
          style: TextStyle(color: AppColors.muted, fontSize: 13.5),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
        const SizedBox(height: 18),
        TextField(
          controller: _search,
          onChanged: (value) => setState(() => _query = value.trim()),
          decoration: InputDecoration(
            hintText: 'Search saved favorites',
            hintStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.navy),
            suffixIcon: _query.isEmpty
                ? null
                : IconButton(
                    onPressed: () {
                      _search.clear();
                      setState(() => _query = '');
                    },
                    icon: const Icon(Icons.close_rounded),
                  ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Expanded(
          child: FutureBuilder<List<Map<String, dynamic>>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CircularProgressIndicator(color: AppColors.orange),
                );
              }
              if (snapshot.hasError) {
                return const Center(
                  child: Text(
                    'Could not load favorites. Close and try again.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted),
                  ),
                );
              }
              final favorites = (snapshot.data ?? [])
                  .where((place) => place['type'] == 'FAVORITE')
                  .where((place) {
                    if (_query.isEmpty) return true;
                    final searchable =
                        '${place['label']} ${place['addressLine']}'
                            .toLowerCase();
                    return searchable.contains(_query.toLowerCase());
                  })
                  .toList();
              if (favorites.isEmpty) {
                return Center(
                  child: Text(
                    _query.isEmpty
                        ? 'No favorite places added yet'
                        : 'No favorites match “$_query”',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                );
              }
              return ListView.separated(
                itemCount: favorites.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final place = favorites[index];
                  return InkWell(
                    onTap: () => Navigator.pop(context, place),
                    borderRadius: BorderRadius.circular(15),
                    child: Container(
                      padding: const EdgeInsets.all(13),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE1E5EC)),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 25,
                            backgroundColor: Color(0xFFFFF0E8),
                            child: Icon(
                              Icons.star_rounded,
                              color: AppColors.orange,
                              size: 27,
                            ),
                          ),
                          const SizedBox(width: 13),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  place['label'] as String? ?? 'Favorite',
                                  style: const TextStyle(
                                    color: AppColors.navy,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14.5,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  place['addressLine'] as String? ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => _openEditor(place),
                            icon: const Icon(
                              Icons.edit_outlined,
                              color: AppColors.navy,
                            ),
                          ),
                          IconButton(
                            onPressed: () => _delete(place),
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snapshot) {
            final count = (snapshot.data ?? [])
                .where((place) => place['type'] == 'FAVORITE')
                .length;
            final canAdd = snapshot.hasData && count < 5;
            return SizedBox(
              width: double.infinity,
              height: 55,
              child: FilledButton.icon(
                onPressed: canAdd ? () => _openEditor() : null,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.orange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                icon: Icon(
                  canAdd ? Icons.add_rounded : Icons.star_rounded,
                  size: 24,
                ),
                label: Text(
                  count >= 5 ? '5/5 Favorites Saved' : 'Add New Favorite',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    ),
  );
}

InputDecoration _sheetInput(
  String hint,
  IconData icon, {
  VoidCallback? onLocate,
}) => InputDecoration(
  hintText: hint,
  hintStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
  prefixIcon: Icon(icon, color: AppColors.navy),
  suffixIcon: onLocate != null
      ? IconButton(
          onPressed: onLocate,
          icon: const Icon(Icons.my_location_rounded, color: AppColors.blue),
        )
      : null,
  filled: true,
  fillColor: Colors.white,
  border: OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
  ),
  enabledBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
  ),
);

class _MapPreview extends StatelessWidget {
  const _MapPreview({
    required this.title,
    required this.icon,
    required this.place,
    required this.onChange,
  });
  final String title;
  final IconData icon;
  final MapPlace? place;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(15),
    child: SizedBox(
      height: 175,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (place == null)
            Container(
              color: const Color(0xFFF1F6FF),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map_outlined, color: AppColors.blue, size: 34),
                  SizedBox(height: 5),
                  Text(
                    'Choose a location to preview it on the map',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ],
              ),
            )
          else
            IgnorePointer(
              child: GoogleMap(
                key: ValueKey('${place!.latitude},${place!.longitude}'),
                mapId: GoogleMapsConfig.mapId,
                initialCameraPosition: CameraPosition(
                  target: LatLng(place!.latitude, place!.longitude),
                  zoom: 16,
                ),
                markers: {
                  Marker(
                    markerId: const MarkerId('saved-place'),
                    position: LatLng(place!.latitude, place!.longitude),
                  ),
                },
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                mapToolbarEnabled: false,
              ),
            ),
          Material(
            color: Colors.transparent,
            child: InkWell(onTap: onChange),
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 12,
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
              elevation: 3,
              child: InkWell(
                onTap: onChange,
                borderRadius: BorderRadius.circular(13),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      Icon(icon, color: AppColors.orange),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Text(
                        place == null ? 'Choose' : 'Change',
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class SavedPlacesScreen extends StatefulWidget {
  const SavedPlacesScreen({super.key});

  @override
  State<SavedPlacesScreen> createState() => _SavedPlacesScreenState();
}

class _SavedPlacesScreenState extends State<SavedPlacesScreen> {
  List<Map<String, dynamic>> _addresses = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final addresses = await SavedPlacesService.getAll();
      if (mounted) setState(() => _addresses = addresses);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? _first(String type) {
    for (final address in _addresses) {
      if (address['type'] == type) return address;
    }
    return null;
  }

  Future<void> _openEditor(String type, [Map<String, dynamic>? address]) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => SavedPlaceEditorScreen(type: type, address: address),
      ),
    );
    if (changed == true) _load();
  }

  Future<void> _delete(Map<String, dynamic> address) async {
    final confirmed = await _confirmRemovePlace(
      context,
      label: '${address['label'] ?? address['type']}',
      isFavorite: address['type'] == 'FAVORITE',
    );
    if (!confirmed) return;
    await SavedPlacesService.delete(address['id'] as String);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final home = _first('HOME');
    final work = _first('WORK');
    final favorites = _addresses
        .where((item) => item['type'] == 'FAVORITE')
        .toList();
    return Scaffold(
      backgroundColor: const Color(0xFFFBFCFF),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
            children: [
              _Header(onMenu: () => showRjsDrawer(context)),
              const SizedBox(height: 22),
              const Text(
                'Quick Places',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 11),
              Row(
                children: [
                  Expanded(
                    child: _QuickPlace(
                      type: 'HOME',
                      title: 'Home',
                      icon: Icons.home_rounded,
                      color: AppColors.orange,
                      address: home,
                      onTap: () => _openEditor('HOME', home),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickPlace(
                      type: 'WORK',
                      title: 'Work',
                      icon: Icons.work_rounded,
                      color: AppColors.blue,
                      address: work,
                      onTap: () => _openEditor('WORK', work),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Favorites',
                      style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed:
                        _loading || _error != null || favorites.length >= 5
                        ? null
                        : () => _openEditor('FAVORITE'),
                    icon: const Icon(Icons.add_rounded, size: 19),
                    label: Text(
                      favorites.length >= 5 ? '5/5 Saved' : 'Add Place',
                    ),
                  ),
                ],
              ),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(45),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.orange),
                  ),
                )
              else if (_error != null)
                _Message(
                  icon: Icons.cloud_off_rounded,
                  text: _error!,
                  action: _load,
                )
              else if (favorites.isEmpty)
                _Message(
                  icon: Icons.star_outline_rounded,
                  text: 'No favorite places added yet.',
                  action: () => _openEditor('FAVORITE'),
                )
              else
                ...favorites.map(
                  (address) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _AddressCard(
                      address: address,
                      onEdit: () => _openEditor('FAVORITE', address),
                      onDelete: () => _delete(address),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onMenu});
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      _HeaderButton(icon: Icons.menu_rounded, onTap: onMenu),
      const SizedBox(width: 13),
      const Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Saved Places',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Your frequently used locations',
              style: TextStyle(color: AppColors.muted, fontSize: 12.5),
            ),
          ],
        ),
      ),
      _HeaderButton(
        icon: Icons.notifications_none_rounded,
        notification: true,
        onTap: () => showRjsNotifications(context),
      ),
    ],
  );
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    this.onTap,
    this.notification = false,
  });
  final IconData icon;
  final VoidCallback? onTap;
  final bool notification;

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
        boxShadow: [
          BoxShadow(
            color: Color(0x180A244A),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, color: AppColors.navy, size: 29),
          if (notification)
            Positioned(
              right: 7,
              top: 7,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppColors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

class _QuickPlace extends StatelessWidget {
  const _QuickPlace({
    required this.type,
    required this.title,
    required this.icon,
    required this.color,
    required this.address,
    required this.onTap,
  });
  final String type;
  final String title;
  final IconData icon;
  final Color color;
  final Map<String, dynamic>? address;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(16),
    child: Container(
      height: 125,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: .18)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C102040),
            blurRadius: 13,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withValues(alpha: .1),
                child: Icon(icon, color: color, size: 22),
              ),
              const Spacer(),
              Icon(
                address == null
                    ? Icons.add_circle_outline_rounded
                    : Icons.edit_outlined,
                color: AppColors.blue,
                size: 19,
              ),
            ],
          ),
          const Spacer(),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            address?['addressLine'] as String? ?? 'Add your $title address',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
          ),
        ],
      ),
    ),
  );
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
  });
  final Map<String, dynamic> address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: const Color(0xFFE6EAF0)),
    ),
    child: Row(
      children: [
        const CircleAvatar(
          backgroundColor: Color(0xFFFFF0E8),
          child: Icon(Icons.star_rounded, color: AppColors.orange),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                address['label'] as String? ?? 'Favorite',
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                address['addressLine'] as String? ?? '',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 11.5),
              ),
            ],
          ),
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert_rounded, color: AppColors.muted),
          onSelected: (value) => value == 'edit' ? onEdit() : onDelete(),
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'edit', child: Text('Edit')),
            PopupMenuItem(value: 'delete', child: Text('Remove')),
          ],
        ),
      ],
    ),
  );
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.text,
    required this.action,
  });
  final IconData icon;
  final String text;
  final VoidCallback action;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 38, horizontal: 20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      children: [
        Icon(icon, color: AppColors.blue, size: 36),
        const SizedBox(height: 10),
        Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 10),
        TextButton(onPressed: action, child: const Text('Add a place')),
      ],
    ),
  );
}

class SavedPlaceEditorScreen extends StatefulWidget {
  const SavedPlaceEditorScreen({super.key, required this.type, this.address});
  final String type;
  final Map<String, dynamic>? address;

  @override
  State<SavedPlaceEditorScreen> createState() => _SavedPlaceEditorScreenState();
}

class _EditorHeading extends StatelessWidget {
  const _EditorHeading({
    required this.icon,
    required this.title,
    required this.subtitle,
  });
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, color: AppColors.navy, size: 25),
      const SizedBox(width: 13),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
      ),
    ],
  );
}

class _SavedPlaceEditorScreenState extends State<SavedPlaceEditorScreen> {
  late final TextEditingController _label;
  late final TextEditingController _address;
  late final TextEditingController _landmark;
  late final TextEditingController _city;
  late final TextEditingController _pincode;
  bool _saving = false;
  String? _error;
  MapPlace? _selectedPlace;

  @override
  void initState() {
    super.initState();
    final value = widget.address;
    _label = TextEditingController(
      text: value?['label'] as String? ?? _defaultLabel,
    );
    _address = TextEditingController(
      text: value?['addressLine'] as String? ?? '',
    );
    _landmark = TextEditingController(
      text: value?['landmark'] as String? ?? '',
    );
    _city = TextEditingController(
      text: value?['city'] as String? ?? 'Bengaluru',
    );
    _pincode = TextEditingController(text: value?['pincode'] as String? ?? '');
    final location = value?['location'];
    if (location is Map &&
        location['latitude'] is num &&
        location['longitude'] is num) {
      _selectedPlace = MapPlace(
        address: _address.text,
        latitude: (location['latitude'] as num).toDouble(),
        longitude: (location['longitude'] as num).toDouble(),
      );
    }
  }

  Future<void> _pickPlace({bool mapFirst = false}) async {
    final selected = await Navigator.push<MapPlace>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          initialValue: _address.text,
          initialPlace: _selectedPlace,
          title:
              'Choose ${widget.type == 'HOME'
                  ? 'Home'
                  : widget.type == 'WORK'
                  ? 'Work'
                  : 'Favorite'} Location',
          searchHint: 'Search a location',
          startOnMap: mapFirst,
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() {
        _selectedPlace = selected;
        _address.text = selected.address;
      });
    }
  }

  String get _defaultLabel => switch (widget.type) {
    'HOME' => 'Home',
    'WORK' => 'Work',
    _ => '',
  };

  @override
  void dispose() {
    _label.dispose();
    _address.dispose();
    _landmark.dispose();
    _city.dispose();
    _pincode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_address.text.trim().length < 5 ||
        _selectedPlace == null ||
        _city.text.trim().length < 2 ||
        (widget.type == 'FAVORITE' && _label.text.trim().isEmpty)) {
      setState(
        () => _error = 'Select a real location, then enter a label and city',
      );
      return;
    }
    if (_pincode.text.isNotEmpty &&
        !RegExp(r'^\d{6}$').hasMatch(_pincode.text)) {
      setState(() => _error = 'Enter a valid 6-digit pincode');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await SavedPlacesService.save(
        id: widget.address?['id'] as String?,
        type: widget.type,
        label: _label.text.trim(),
        addressLine: _address.text.trim(),
        landmark: _landmark.text.trim(),
        city: _city.text.trim(),
        pincode: _pincode.text.trim(),
        latitude: _selectedPlace!.latitude,
        longitude: _selectedPlace!.longitude,
      );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    appBar: AppBar(
      backgroundColor: const Color(0xFFFBFCFF),
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: const Icon(Icons.arrow_back_rounded, color: AppColors.navy),
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.address == null
                ? 'Add Favorite Place'
                : 'Edit Favorite Place',
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Text(
            'Save a location for faster bookings',
            style: TextStyle(color: AppColors.muted, fontSize: 11.5),
          ),
        ],
      ),
    ),
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _address,
              readOnly: true,
              onTap: () => _pickPlace(),
              maxLines: 1,
              textCapitalization: TextCapitalization.sentences,
              decoration: _sheetInput(
                'Tap to choose a location',
                Icons.search_rounded,
                onLocate: () => _pickPlace(mapFirst: true),
              ),
            ),
            const SizedBox(height: 16),
            _MapPreview(
              title: _address.text.trim().isEmpty
                  ? 'Selected Location'
                  : _address.text.trim(),
              icon: Icons.location_on_rounded,
              place: _selectedPlace,
              onChange: () => _pickPlace(mapFirst: true),
            ),
            const SizedBox(height: 24),
            const _EditorHeading(
              icon: Icons.location_on_outlined,
              title: 'Add a label',
              subtitle: 'Choose a name to easily identify this place',
            ),
            const SizedBox(height: 11),
            TextField(
              controller: _label,
              textCapitalization: TextCapitalization.words,
              decoration: _input(
                'e.g. Gym, School, Mall...',
                Icons.star_outline_rounded,
              ),
            ),
            const SizedBox(height: 22),
            const _EditorHeading(
              icon: Icons.note_alt_outlined,
              title: 'Add a note',
              subtitle: 'Optional additional details',
            ),
            const SizedBox(height: 11),
            TextField(
              controller: _landmark,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: _input(
                'e.g. Near main gate, 2nd floor, etc.',
                Icons.notes_rounded,
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontSize: 11.5),
                ),
              ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.orange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  _saving ? 'Saving...' : 'Save to Favorites',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  InputDecoration _input(String label, IconData icon) => InputDecoration(
    hintText: label,
    alignLabelWithHint: true,
    prefixIcon: Icon(icon, color: AppColors.blue),
    filled: true,
    fillColor: const Color(0xFFFAFBFE),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: const BorderSide(color: Color(0xFFDCE3ED)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: const BorderSide(color: Color(0xFFDCE3ED)),
    ),
  );
}
