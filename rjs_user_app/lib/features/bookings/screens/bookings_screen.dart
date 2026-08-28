import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/notification_popup.dart';

enum _TripFilter { all, live, upcoming, completed }

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  _TripFilter _filter = _TripFilter.all;

  bool get _showLive =>
      _filter == _TripFilter.all || _filter == _TripFilter.live;
  bool get _showUpcoming =>
      _filter == _TripFilter.all || _filter == _TripFilter.upcoming;
  bool get _showCompleted =>
      _filter == _TripFilter.all || _filter == _TripFilter.completed;

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: 1,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (_) {},
    body: SafeArea(
      top: false,
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              16,
              MediaQuery.paddingOf(context).top + 8,
              16,
              118 + MediaQuery.paddingOf(context).bottom,
            ),
            sliver: SliverList.list(
              children: [
                _Header(
                  onMenu: () => showRjsDrawer(context),
                  onFilter: _showFilters,
                ),
                const SizedBox(height: 14),
                if (_filter != _TripFilter.all) ...[
                  _ActiveFilter(
                    filter: _filter,
                    onClear: () => setState(() => _filter = _TripFilter.all),
                  ),
                  const SizedBox(height: 10),
                ],
                if (_showLive) ...[
                  const _LiveTrips(),
                  const SizedBox(height: 10),
                ],
                if (_showUpcoming) ...[
                  const _UpcomingTrips(),
                  const SizedBox(height: 10),
                ],
                if (_showCompleted) const _CompletedTrips(),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  Future<void> _showFilters() async {
    final selected = await showModalBottomSheet<_TripFilter>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 22),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDDE2EA),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Filter Bookings',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              _FilterTile(
                label: 'Live Trip',
                icon: Icons.near_me_outlined,
                color: const Color(0xFF16A33B),
                selected: _filter == _TripFilter.live,
                value: _TripFilter.live,
              ),
              _FilterTile(
                label: 'Upcoming Trip',
                icon: Icons.calendar_month_outlined,
                color: AppColors.blue,
                selected: _filter == _TripFilter.upcoming,
                value: _TripFilter.upcoming,
              ),
              _FilterTile(
                label: 'Completed Trip',
                icon: Icons.check_circle_outline_rounded,
                color: const Color(0xFF9747E5),
                selected: _filter == _TripFilter.completed,
                value: _TripFilter.completed,
              ),
            ],
          ),
        ),
      ),
    );
    if (selected != null && mounted) setState(() => _filter = selected);
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onMenu, required this.onFilter});
  final VoidCallback onMenu;
  final VoidCallback onFilter;
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
              'My Bookings',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Manage all your trips in one place',
              style: TextStyle(color: AppColors.muted, fontSize: 12.5),
            ),
          ],
        ),
      ),
      _HeaderButton(icon: Icons.filter_alt_outlined, onTap: onFilter),
      const SizedBox(width: 8),
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
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 3,
    shadowColor: const Color(0x180A244A),
    child: InkWell(
      onTap: onTap ?? () {},
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 48,
        height: 48,
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
    ),
  );
}

class _ActiveFilter extends StatelessWidget {
  const _ActiveFilter({required this.filter, required this.onClear});
  final _TripFilter filter;
  final VoidCallback onClear;
  @override
  Widget build(BuildContext context) {
    final label = switch (filter) {
      _TripFilter.live => 'Live Trip',
      _TripFilter.upcoming => 'Upcoming Trip',
      _TripFilter.completed => 'Completed Trip',
      _ => '',
    };
    return Align(
      alignment: Alignment.centerLeft,
      child: InputChip(
        label: Text(label),
        selected: true,
        selectedColor: const Color(0xFFEAF2FF),
        checkmarkColor: AppColors.blue,
        labelStyle: const TextStyle(
          color: AppColors.blue,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
        side: const BorderSide(color: AppColors.blue),
        onDeleted: onClear,
      ),
    );
  }
}

class _FilterTile extends StatelessWidget {
  const _FilterTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.value,
  });
  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final _TripFilter value;
  @override
  Widget build(BuildContext context) => ListTile(
    onTap: () => Navigator.pop(context, value),
    contentPadding: EdgeInsets.zero,
    leading: Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color),
    ),
    title: Text(
      label,
      style: const TextStyle(
        color: AppColors.navy,
        fontSize: 14,
        fontWeight: FontWeight.w700,
      ),
    ),
    trailing: Icon(
      selected ? Icons.radio_button_checked : Icons.radio_button_off,
      color: selected ? AppColors.blue : AppColors.muted,
    ),
  );
}

class _LiveTrips extends StatelessWidget {
  const _LiveTrips();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(
          icon: Icons.near_me_outlined,
          color: Color(0xFF18A33B),
          title: 'Live Trips',
          count: '1 Active',
        ),
        const SizedBox(height: 11),
        Container(
          height: 164,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF5FFF7),
            border: Border.all(color: const Color(0xFFCFEBD5)),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Badge(
                      'LIVE',
                      color: Color(0xFF159D38),
                      background: Color(0xFFE0F7E5),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Airport Transfer',
                      style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 10),
                    _RoutePoint(
                      color: Color(0xFF16A33B),
                      text: 'Koramangala, Bengaluru',
                    ),
                    SizedBox(height: 8),
                    _RoutePoint(
                      color: Colors.red,
                      text: 'Kempegowda International Airport',
                    ),
                    Spacer(),
                    Row(
                      children: [
                        Icon(
                          Icons.directions_car_outlined,
                          color: AppColors.navy,
                          size: 17,
                        ),
                        SizedBox(width: 5),
                        Text(
                          'Sedan  •  KA01 AB 1234',
                          style: TextStyle(
                            color: AppColors.navy,
                            fontSize: 8.5,
                          ),
                        ),
                        SizedBox(width: 10),
                        Icon(Icons.person, color: AppColors.navy, size: 16),
                        SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Ramesh Kumar  ⭐ 4.8',
                            style: TextStyle(
                              color: AppColors.navy,
                              fontSize: 8.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 126,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(color: const Color(0xFFDCE7DF)),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    SizedBox(
                      height: 58,
                      width: double.infinity,
                      child: Image.asset(
                        'assets/images/home-map-placeholder.png',
                        fit: BoxFit.cover,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.fromLTRB(9, 6, 9, 2),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Arriving in',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontSize: 8.5,
                              ),
                            ),
                            Text(
                              '18 mins',
                              style: TextStyle(
                                color: Color(0xFF16A33B),
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(8, 2, 8, 6),
                      child: SizedBox(
                        width: double.infinity,
                        height: 28,
                        child: TextButton(
                          onPressed: () {},
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFE6F8E9),
                            foregroundColor: const Color(0xFF159D38),
                            textStyle: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          child: const Text('Track Live  ›'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _UpcomingTrips extends StatelessWidget {
  const _UpcomingTrips();
  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          icon: Icons.calendar_month_outlined,
          color: AppColors.blue,
          title: 'Upcoming Trips',
          count: '2 Trips',
        ),
        SizedBox(height: 10),
        _TripCard(
          image: 'assets/images/tour-bangalore.png',
          badge: 'One Day Trip',
          title: 'Bangalore City Tour',
          from: 'Koramangala, Bengaluru',
          to: 'Koramangala, Bengaluru',
          date: 'May 25, 2026',
          time: '09:00 AM',
          people: '1 - 4 People',
          vehicle: 'Any Car',
          details: '8 Hours   •   120 KM',
          price: '₹2,499',
        ),
        SizedBox(height: 8),
        _TripCard(
          image: 'assets/images/tour-coorg.png',
          badge: 'Outstation',
          title: 'Coorg Getaway',
          from: 'Bengaluru',
          to: 'Coorg',
          date: 'May 28, 2026',
          time: '07:00 AM',
          people: '2 - 4 People',
          vehicle: 'SUV',
          details: '2 Days / 1 Night   •   600 KM',
          price: '₹9,999',
        ),
      ],
    ),
  );
}

class _CompletedTrips extends StatelessWidget {
  const _CompletedTrips();
  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          icon: Icons.check_circle_outline_rounded,
          color: Color(0xFF9747E5),
          title: 'Completed Trips',
          count: '8 Trips',
        ),
        SizedBox(height: 10),
        _CompactTrip(
          image: 'assets/images/tour-coorg.png',
          badge: 'Outstation',
          title: 'Mysore One Day Trip',
          to: 'Mysore',
          time: '08:00 AM',
          people: '2 - 4 People',
          price: '₹4,499',
        ),
        SizedBox(height: 8),
        _CompactTrip(
          image: 'assets/images/outstation-banner.png',
          badge: 'One Day Trip',
          title: 'Nandi Hills Sunrise',
          to: 'Nandi Hills',
          time: '08:30 AM',
          people: '1 - 4 People',
          price: '₹1,999',
        ),
      ],
    ),
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.icon,
    required this.color,
    required this.title,
    required this.count,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String count;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: color, size: 19),
      const SizedBox(width: 8),
      Text(
        title,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 13,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(width: 10),
      Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 6),
      Text(
        count,
        style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
      ),
    ],
  );
}

class _TripCard extends StatelessWidget {
  const _TripCard({
    required this.image,
    required this.badge,
    required this.title,
    required this.from,
    required this.to,
    required this.date,
    required this.time,
    required this.people,
    required this.vehicle,
    required this.details,
    required this.price,
  });
  final String image,
      badge,
      title,
      from,
      to,
      date,
      time,
      people,
      vehicle,
      details,
      price;
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: const Color(0xFFE0E5ED)),
      borderRadius: BorderRadius.circular(9),
    ),
    clipBehavior: Clip.antiAlias,
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(7),
                child: Image.asset(
                  image,
                  width: 76,
                  height: 76,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Badge(badge),
                    const SizedBox(height: 5),
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 7),
                    _RoutePoint(color: Color(0xFF16A33B), text: from),
                    const SizedBox(height: 5),
                    _RoutePoint(color: Colors.red, text: to),
                  ],
                ),
              ),
              Container(width: 1, height: 61, color: const Color(0xFFE2E6ED)),
              const SizedBox(width: 10),
              SizedBox(
                width: 91,
                child: Column(
                  children: [
                    _Meta(Icons.calendar_month_outlined, date),
                    SizedBox(height: 7),
                    _Meta(Icons.schedule_outlined, time),
                    SizedBox(height: 7),
                    _Meta(Icons.person_outline_rounded, people),
                  ],
                ),
              ),
            ],
          ),
        ),
        Container(height: 1, color: const Color(0xFFE5E8EE)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Row(
            children: [
              const Icon(
                Icons.directions_car_outlined,
                size: 16,
                color: AppColors.navy,
              ),
              const SizedBox(width: 5),
              Text(
                vehicle,
                style: const TextStyle(color: AppColors.muted, fontSize: 9),
              ),
              const Spacer(),
              Text(
                details,
                style: const TextStyle(color: AppColors.muted, fontSize: 9),
              ),
              const Spacer(),
              Text(
                price,
                style: const TextStyle(
                  color: AppColors.blue,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 5),
              const Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: AppColors.navy,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _CompactTrip extends StatelessWidget {
  const _CompactTrip({
    required this.image,
    required this.badge,
    required this.title,
    required this.to,
    required this.time,
    required this.people,
    required this.price,
  });
  final String image, badge, title, to, time, people, price;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: const Color(0xFFE0E5ED)),
      borderRadius: BorderRadius.circular(9),
    ),
    child: Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(7),
          child: Image.asset(image, width: 68, height: 68, fit: BoxFit.cover),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Badge(badge),
              const SizedBox(height: 5),
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 5),
              const _RoutePoint(color: Color(0xFF16A33B), text: 'Bengaluru'),
              const SizedBox(height: 4),
              _RoutePoint(color: Colors.red, text: to),
            ],
          ),
        ),
        Container(width: 1, height: 51, color: const Color(0xFFE2E6ED)),
        const SizedBox(width: 9),
        SizedBox(
          width: 80,
          child: Column(
            children: [
              const _Meta(Icons.calendar_month_outlined, 'May 18, 2026'),
              const SizedBox(height: 6),
              _Meta(Icons.schedule_outlined, time),
              const SizedBox(height: 6),
              _Meta(Icons.person_outline_rounded, people),
            ],
          ),
        ),
        const SizedBox(width: 7),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              price,
              style: const TextStyle(
                color: AppColors.blue,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F8EB),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Completed',
                style: TextStyle(
                  color: Color(0xFF168C35),
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _Badge extends StatelessWidget {
  const _Badge(
    this.text, {
    this.color = AppColors.blue,
    this.background = const Color(0xFFEDF4FF),
  });
  final String text;
  final Color color, background;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(9),
    ),
    child: Text(
      text,
      style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w700),
    ),
  );
}

class _RoutePoint extends StatelessWidget {
  const _RoutePoint({required this.color, required this.text});
  final Color color;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 2),
        ),
      ),
      const SizedBox(width: 7),
      Expanded(
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.navy, fontSize: 9.5),
        ),
      ),
    ],
  );
}

class _Meta extends StatelessWidget {
  const _Meta(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: AppColors.navy, size: 14),
      const SizedBox(width: 6),
      Expanded(
        child: Text(
          text,
          maxLines: 1,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 8.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    ],
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B102040),
          blurRadius: 12,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: child,
  );
}
