import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import 'tour_package_details_screen.dart';

class TourPackagesScreen extends StatefulWidget {
  const TourPackagesScreen({super.key});

  @override
  State<TourPackagesScreen> createState() => _TourPackagesScreenState();
}

class _TourPackagesScreenState extends State<TourPackagesScreen> {
  bool _bangaloreFavorite = false;
  bool _coorgFavorite = false;

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: -1,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (index) {
      if (index == 0) Navigator.pop(context);
    },
    body: SafeArea(
      top: false,
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: AppPageHeader(
              title: 'Tour Packages',
              backgroundAsset: 'assets/images/outstation-banner.png',
              onMenuTap: () => showRjsDrawer(context),
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              16,
              8,
              16,
              118 + MediaQuery.paddingOf(context).bottom,
            ),
            sliver: SliverList.list(
              children: [
                const _LocationPanel(),
                const SizedBox(height: 12),
                const _DatePanel(),
                const SizedBox(height: 12),
                const _CustomPackagePanel(),
                const SizedBox(height: 12),
                const _PreferencePanel(),
                const SizedBox(height: 12),
                _PopularPackages(
                  bangaloreFavorite: _bangaloreFavorite,
                  coorgFavorite: _coorgFavorite,
                  onBangaloreFavorite: () =>
                      setState(() => _bangaloreFavorite = !_bangaloreFavorite),
                  onCoorgFavorite: () =>
                      setState(() => _coorgFavorite = !_coorgFavorite),
                ),
                const SizedBox(height: 14),
                const _SearchButton(),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

// Kept temporarily while the shared header migration settles.
// ignore: unused_element
class _TourHeader extends StatelessWidget {
  const _TourHeader({required this.onMenuTap});
  final VoidCallback onMenuTap;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 137,
    child: Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/images/outstation-banner.png',
          fit: BoxFit.cover,
          alignment: Alignment.centerRight,
          filterQuality: FilterQuality.high,
        ),
        Positioned(
          left: 16,
          top: 31,
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0x180A244A),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: IconButton(
              onPressed: onMenuTap,
              icon: const Icon(
                Icons.menu_rounded,
                color: AppColors.navy,
                size: 25,
              ),
              constraints: const BoxConstraints.tightFor(width: 42, height: 42),
              padding: EdgeInsets.zero,
            ),
          ),
        ),
        const Positioned(
          left: 71,
          top: 37,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tour Packages',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Explore amazing places with our & driver',
                style: TextStyle(color: AppColors.muted, fontSize: 11.5),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _LocationPanel extends StatelessWidget {
  const _LocationPanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      children: [
        _LocationRow(
          color: AppColors.blue,
          label: 'Pick-up Location',
          hint: 'Enter pick-up location',
        ),
        Divider(height: 18),
        _LocationRow(
          color: Color(0xFF179A48),
          label: 'Destination',
          hint: 'Search destination or select a place',
        ),
      ],
    ),
  );
}

class _LocationRow extends StatelessWidget {
  const _LocationRow({
    required this.color,
    required this.label,
    required this.hint,
  });
  final Color color;
  final String label;
  final String hint;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      CircleAvatar(
        radius: 20,
        backgroundColor: color.withValues(alpha: .08),
        child: Icon(Icons.location_on_outlined, color: color, size: 24),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              hint,
              style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
            ),
          ],
        ),
      ),
      const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
    ],
  );
}

class _DatePanel extends StatelessWidget {
  const _DatePanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Title('Date & Time'),
        SizedBox(height: 11),
        Row(
          children: [
            Expanded(
              child: _DateField(label: 'Date', value: 'May 25, 2026'),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: SizedBox(height: 57, child: VerticalDivider()),
            ),
            Expanded(
              child: _DateField(
                label: 'End Date (Optional)',
                value: 'May 27, 2026',
              ),
            ),
          ],
        ),
        SizedBox(height: 11),
        _InfoStrip(
          icon: Icons.info_outline_rounded,
          text: 'For multi-day tours, select end date. For one day tours, end date is optional.',
        ),
      ],
    ),
  );
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          const Icon(
            Icons.calendar_month_rounded,
            color: AppColors.blue,
            size: 18,
          ),
          const SizedBox(width: 7),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 7),
      Container(
        height: 38,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFDDE2EA)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value,
                style: const TextStyle(color: AppColors.navy, fontSize: 11),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 19),
          ],
        ),
      ),
    ],
  );
}

class _CustomPackagePanel extends StatelessWidget {
  const _CustomPackagePanel();

  @override
  Widget build(BuildContext context) => Container(
    height: 93,
    padding: const EdgeInsets.symmetric(horizontal: 14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0F6FF),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Row(
      children: [
        SizedBox(
          width: 78,
          height: 78,
          child: Image.asset(
            'assets/images/custom-package-travel.png',
            fit: BoxFit.contain,
            filterQuality: FilterQuality.high,
            color: const Color(0xFFF0F6FF),
            colorBlendMode: BlendMode.multiply,
          ),
        ),
        const SizedBox(width: 6),
        const Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Want a custom package?',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 6),
              Text(
                "Tell us your plan and we'll create the perfect itinerary for you.",
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 9.5,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.edit_square, size: 17),
          label: const Text('Create Custom Package'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.blue,
            side: const BorderSide(color: AppColors.blue),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            textStyle: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _PreferencePanel extends StatelessWidget {
  const _PreferencePanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Title('Tour Preferences'),
        SizedBox(height: 9),
        _VehiclePreference(),
        SizedBox(height: 10),
        _InfoStrip(
          icon: Icons.info_outline_rounded,
          text: 'All vehicles are with driver, fuel, toll & taxes included in the price.',
        ),
      ],
    ),
  );
}

class _VehiclePreference extends StatelessWidget {
  const _VehiclePreference();

  @override
  Widget build(BuildContext context) => Container(
    height: 58,
    padding: const EdgeInsets.symmetric(horizontal: 10),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFFDDE2EA)),
    ),
    child: Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const Color(0xFFEFF9F1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(
            Icons.directions_car_rounded,
            color: Color(0xFF179A48),
            size: 20,
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Vehicle Type',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Only Cars',
                style: TextStyle(color: AppColors.navy, fontSize: 9.5),
              ),
            ],
          ),
        ),
        Container(
          width: 118,
          height: 38,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: Color(0xFFDDE2EA)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Any Car',
                  style: TextStyle(color: AppColors.navy, fontSize: 10.5),
                ),
              ),
              Icon(Icons.keyboard_arrow_down_rounded, size: 18),
            ],
          ),
        ),
      ],
    ),
  );
}

class _PopularPackages extends StatelessWidget {
  const _PopularPackages({
    required this.bangaloreFavorite,
    required this.coorgFavorite,
    required this.onBangaloreFavorite,
    required this.onCoorgFavorite,
  });
  final bool bangaloreFavorite;
  final bool coorgFavorite;
  final VoidCallback onBangaloreFavorite;
  final VoidCallback onCoorgFavorite;

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(10, 12, 10, 10),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Popular Tour Packages'),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _TourCard(
                badge: 'One Day',
                image: 'assets/images/tour-bangalore.png',
                title: 'Bangalore City Tour',
                description: 'Lalbagh, Cubbon Park, Vidhana Soudha, ISKCON Temple & more',
                duration: '8 Hours',
                distance: '120 KM',
                price: '₹2,499',
                favorite: bangaloreFavorite,
                onFavorite: onBangaloreFavorite,
                onViewDetails: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const TourPackageDetailsScreen(),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _TourCard(
                badge: '2 Days / 1 Night',
                image: 'assets/images/tour-coorg.png',
                title: 'Coorg Getaway',
                description: "Abbey Falls, Raja's Seat, Madikeri Fort, Dubare Elephant Camp & more",
                duration: '2 Days / 1 Night',
                distance: '600 KM',
                price: '₹9,999',
                favorite: coorgFavorite,
                onFavorite: onCoorgFavorite,
                onViewDetails: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const TourPackageDetailsScreen(),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        const _InfoStrip(
          icon: Icons.sell_outlined,
          text: 'Packages include car, driver allowance, fuel, toll, parking & taxes.',
        ),
      ],
    ),
  );
}

class _TourCard extends StatelessWidget {
  const _TourCard({
    required this.badge,
    required this.image,
    required this.title,
    required this.description,
    required this.duration,
    required this.distance,
    required this.price,
    required this.favorite,
    required this.onFavorite,
    required this.onViewDetails,
  });
  final String badge;
  final String image;
  final String title;
  final String description;
  final String duration;
  final String distance;
  final String price;
  final bool favorite;
  final VoidCallback onFavorite;
  final VoidCallback onViewDetails;

  @override
  Widget build(BuildContext context) => Container(
    height: 292,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: const Color(0xFFDDE2EA)),
    ),
    clipBehavior: Clip.antiAlias,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 101,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                image,
                fit: BoxFit.cover,
                filterQuality: FilterQuality.high,
              ),
              Positioned(
                left: 7,
                top: 7,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 4,
                top: 3,
                child: IconButton(
                  onPressed: onFavorite,
                  icon: Icon(
                    favorite
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    color: favorite ? AppColors.orange : Colors.white,
                    size: 23,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(9, 9, 9, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 9,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 8),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.schedule_rounded,
                        color: AppColors.navy,
                        size: 13,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        duration,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Text(
                        '  •  ',
                        style: TextStyle(color: AppColors.muted, fontSize: 8),
                      ),
                      const Icon(
                        Icons.directions_car_rounded,
                        color: AppColors.navy,
                        size: 13,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        distance,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        price,
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    OutlinedButton(
                      onPressed: onViewDetails,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.blue,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: const Size(0, 32),
                        side: const BorderSide(color: AppColors.blue),
                        textStyle: const TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      child: const Text('View Details'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _InfoStrip extends StatelessWidget {
  const _InfoStrip({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
    decoration: BoxDecoration(
      color: const Color(0xFFF0F6FF),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      children: [
        Icon(icon, color: AppColors.blue, size: 16),
        const SizedBox(width: 7),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
          ),
        ),
      ],
    ),
  );
}

class _SearchButton extends StatelessWidget {
  const _SearchButton();

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 59,
    child: FilledButton(
      onPressed: () {},
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.blue,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      child: const Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Search Packages',
                style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
              ),
              SizedBox(height: 2),
              Text(
                'View available cars & prices',
                style: TextStyle(fontSize: 10),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: Icon(Icons.arrow_forward_rounded, size: 25),
          ),
        ],
      ),
    ),
  );
}

class _Title extends StatelessWidget {
  const _Title(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: AppColors.navy,
      fontSize: 13,
      fontWeight: FontWeight.w800,
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(12)});
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      boxShadow: const [
        BoxShadow(
          color: Color(0x120A244A),
          blurRadius: 18,
          offset: Offset(0, 7),
        ),
      ],
    ),
    child: child,
  );
}
