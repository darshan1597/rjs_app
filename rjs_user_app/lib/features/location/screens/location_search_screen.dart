import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../saved_places/services/saved_places_service.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({super.key, this.initialValue});

  final String? initialValue;

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  late final TextEditingController _search;
  late Future<List<Map<String, dynamic>>> _placesFuture;
  String _query = '';
  bool _showAllFavorites = false;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController(text: widget.initialValue ?? '');
    _query = _search.text.trim();
    _placesFuture = SavedPlacesService.getAll();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _select(String value) => Navigator.pop(context, value);

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    body: SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            child: Row(
              children: [
                _RoundButton(
                  icon: Icons.arrow_back_rounded,
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Choose Destination',
                        style: TextStyle(
                          color: AppColors.navy,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Where would you like to go?',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _search,
              autofocus: true,
              textInputAction: TextInputAction.done,
              onChanged: (value) => setState(() => _query = value.trim()),
              onSubmitted: (value) {
                if (value.trim().length >= 3) _select(value.trim());
              },
              decoration: InputDecoration(
                hintText: 'Search or enter destination',
                prefixIcon: const Icon(
                  Icons.location_on_rounded,
                  color: AppColors.orange,
                ),
                suffixIcon: _query.isEmpty
                    ? IconButton(
                        tooltip: 'Locate on map',
                        onPressed: () => ScaffoldMessenger.of(context)
                            .showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Map location selection will be available after live maps are integrated.',
                                ),
                                behavior: SnackBarBehavior.floating,
                              ),
                            ),
                        icon: const Icon(
                          Icons.my_location_rounded,
                          color: AppColors.blue,
                        ),
                      )
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
                  borderRadius: BorderRadius.circular(15),
                  borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: const BorderSide(color: Color(0xFFDDE3EC)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: const BorderSide(
                    color: AppColors.blue,
                    width: 1.4,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _placesFuture,
              builder: (context, snapshot) {
                final places = snapshot.data ?? const <Map<String, dynamic>>[];
                final filtered = _query.isEmpty
                    ? places
                    : places.where((place) {
                        final text = '${place['label']} ${place['addressLine']}'
                            .toLowerCase();
                        return text.contains(_query.toLowerCase());
                      }).toList();
                final favoritePlaces = places
                    .where((place) => place['type'] == 'FAVORITE')
                    .toList();
                final visiblePlaces = _query.isNotEmpty
                    ? filtered
                    : [
                        ...places.where((place) => place['type'] != 'FAVORITE'),
                        ...(_showAllFavorites
                            ? favoritePlaces
                            : favoritePlaces.take(2)),
                      ];
                return ListView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  children: [
                    if (_query.length >= 3)
                      _LocationTile(
                        icon: Icons.arrow_forward_rounded,
                        color: AppColors.orange,
                        title: 'Use “$_query”',
                        subtitle: 'Continue with the entered address',
                        onTap: () => _select(_query),
                      ),
                    if (_query.isEmpty) ...[
                      _LocationTile(
                        icon: Icons.my_location_rounded,
                        color: AppColors.blue,
                        title: 'Current Location',
                        subtitle: 'Use your device location',
                        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Current location will work after map integration.',
                            ),
                            behavior: SnackBarBehavior.floating,
                          ),
                        ),
                      ),
                      const _SectionTitle('Saved Places'),
                    ],
                    if (snapshot.connectionState == ConnectionState.waiting)
                      const Padding(
                        padding: EdgeInsets.all(30),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppColors.orange,
                          ),
                        ),
                      )
                    else if (filtered.isEmpty && _query.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Text(
                          'Add Home, Work or Favorites for faster selection.',
                          style: TextStyle(color: AppColors.muted),
                        ),
                      )
                    else if (visiblePlaces.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text(
                            'No saved places match “$_query”',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.muted),
                          ),
                        ),
                      )
                    else
                      ...visiblePlaces.map(
                        (place) => _LocationTile(
                          icon: switch (place['type']) {
                            'HOME' => Icons.home_rounded,
                            'WORK' => Icons.work_rounded,
                            _ => Icons.star_rounded,
                          },
                          color: place['type'] == 'WORK'
                              ? AppColors.blue
                              : AppColors.orange,
                          title: place['label'] as String? ?? 'Saved Place',
                          subtitle: place['addressLine'] as String? ?? '',
                          onTap: () =>
                              _select(place['addressLine'] as String? ?? ''),
                        ),
                      ),
                    if (_query.isEmpty && favoritePlaces.length > 2)
                      Center(
                        child: TextButton.icon(
                          onPressed: () => setState(
                            () => _showAllFavorites = !_showAllFavorites,
                          ),
                          icon: Icon(
                            _showAllFavorites
                                ? Icons.expand_less_rounded
                                : Icons.expand_more_rounded,
                          ),
                          label: Text(
                            _showAllFavorites
                                ? 'Show less'
                                : 'Show ${favoritePlaces.length - 2} more',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    if (_query.isEmpty) ...[
                      const _SectionTitle('Recent'),
                      _LocationTile(
                        icon: Icons.history_rounded,
                        color: AppColors.blue,
                        title: 'Kempegowda International Airport',
                        subtitle: 'KIAL Road, Devanahalli, Bengaluru',
                        onTap: () => _select(
                          'Kempegowda International Airport, Bengaluru',
                        ),
                      ),
                      _LocationTile(
                        icon: Icons.history_rounded,
                        color: AppColors.blue,
                        title: 'Bengaluru City Railway Station',
                        subtitle: 'Majestic, Bengaluru',
                        onTap: () =>
                            _select('Bengaluru City Railway Station, Majestic'),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    ),
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
    child: Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Color(0x160A244A),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Icon(icon, color: AppColors.navy, size: 27),
    ),
  );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(2, 20, 2, 9),
    child: Text(
      text,
      style: const TextStyle(
        color: AppColors.navy,
        fontSize: 14.5,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

class _LocationTile extends StatelessWidget {
  const _LocationTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
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
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE5E9F0)),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withValues(alpha: .1),
                child: Icon(icon, color: color, size: 21),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
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
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      ),
    ),
  );
}
