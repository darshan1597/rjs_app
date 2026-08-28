import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';

class CityRoundTripScreen extends StatefulWidget {
  const CityRoundTripScreen({super.key});

  @override
  State<CityRoundTripScreen> createState() => _CityRoundTripScreenState();
}

class _CityRoundTripScreenState extends State<CityRoundTripScreen> {
  int _selectedVehicle = 1;
  int _selectedDuration = 4;
  double _duration = 5.5;
  bool _bookNow = true;

  static const _vehicles = [
    _Vehicle('Auto', '3 Seater', 'assets/images/schedule-auto.png'),
    _Vehicle('Car', '4 Seater', 'assets/images/popup-car.png'),
    _Vehicle('SUV', '6 Seater', 'assets/images/ride-suv.png'),
    _Vehicle('Sedan', '4 Seater', 'assets/images/ride-sedan.png'),
    _Vehicle('8 Seater', '8 Seater', 'assets/images/schedule-8-seater.png'),
  ];

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
              title: 'City Round Trip',
              backgroundAsset: 'assets/images/city-round-trip-banner.png',
              onMenuTap: _openDrawer,
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              16,
              7,
              16,
              118 + MediaQuery.paddingOf(context).bottom,
            ),
            sliver: SliverList.list(
              children: [
                const _LocationPanel(),
                const SizedBox(height: 12),
                _DateTimePanel(
                  bookNow: _bookNow,
                  onChanged: (value) => setState(() => _bookNow = value),
                ),
                const SizedBox(height: 12),
                _DurationPanel(
                  selectedIndex: _selectedDuration,
                  duration: _duration,
                  onPresetSelected: (index) => setState(() {
                    _selectedDuration = index;
                    _duration = switch (index) {
                      0 => .5,
                      1 => 1,
                      2 => 2,
                      3 => 3,
                      _ => 5,
                    };
                  }),
                  onDurationChanged: (value) => setState(() {
                    _selectedDuration = 4;
                    _duration = value;
                  }),
                ),
                const SizedBox(height: 12),
                _VehiclePanel(
                  vehicles: _vehicles,
                  selectedIndex: _selectedVehicle,
                  onSelected: (index) =>
                      setState(() => _selectedVehicle = index),
                ),
                const SizedBox(height: 12),
                const _WaitingNotice(),
                const SizedBox(height: 14),
                const _ContinueButton(),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  void _openDrawer() => showRjsDrawer(context);
}

// Kept temporarily while the shared header migration settles.
// ignore: unused_element
class _Header extends StatelessWidget {
  const _Header({required this.onMenuTap});
  final VoidCallback onMenuTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 7, 16, 6),
    child: Row(
      children: [
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Color(0x160A244A),
                blurRadius: 14,
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
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'City Round Trip',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Ride and return at your convenience',
                style: TextStyle(color: AppColors.muted, fontSize: 12.5),
              ),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              onPressed: () {},
              icon: const Icon(
                Icons.notifications_none_rounded,
                color: AppColors.navy,
                size: 29,
              ),
            ),
            const Positioned(
              right: 7,
              top: 5,
              child: CircleAvatar(
                radius: 4.5,
                backgroundColor: AppColors.orange,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

// ignore: unused_element
class _RoundTripBanner extends StatelessWidget {
  const _RoundTripBanner();

  @override
  Widget build(BuildContext context) => Container(
    height: 108,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(19),
      gradient: const LinearGradient(
        colors: [Color(0xFFF1F7FF), Color(0xFFE5F1FF)],
      ),
    ),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(19),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/images/city-round-trip-banner.png',
            fit: BoxFit.cover,
            alignment: Alignment.centerRight,
            filterQuality: FilterQuality.high,
          ),
          Positioned(
            left: 14,
            top: 19,
            child: Container(
              width: 58,
              height: 65,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(color: Color(0x120A244A), blurRadius: 12),
                ],
              ),
              child: const Icon(
                Icons.sync_alt_rounded,
                color: AppColors.orange,
                size: 34,
              ),
            ),
          ),
          const Positioned(
            left: 87,
            top: 22,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Go anywhere in the city',
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Stay for a while and\nreturn comfortably.',
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _LocationPanel extends StatelessWidget {
  const _LocationPanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Stack(
      alignment: Alignment.centerRight,
      children: [
        Padding(
          padding: EdgeInsets.only(right: 47),
          child: Column(
            children: [
              _LocationRow(
                color: AppColors.orange,
                label: 'Pickup Location',
                hint: 'Enter pickup location',
              ),
              SizedBox(height: 9),
              _LocationRow(
                color: AppColors.blue,
                label: 'Drop Location',
                hint: 'Enter drop location',
              ),
            ],
          ),
        ),
        _SwapButton(),
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
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      SizedBox(
        width: 30,
        height: 42,
        child: Center(
          child: Icon(Icons.location_on_rounded, color: color, size: 25),
        ),
      ),
      const SizedBox(width: 9),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              height: 39,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: const Color(0xFFDDE2EA)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      hint,
                      style: const TextStyle(
                        color: Color(0xFF9299A8),
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.blue,
                    size: 19,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _SwapButton extends StatelessWidget {
  const _SwapButton();

  @override
  Widget build(BuildContext context) => Container(
    width: 42,
    height: 42,
    decoration: BoxDecoration(
      color: Colors.white,
      shape: BoxShape.circle,
      border: Border.all(color: const Color(0xFFE1E5EC)),
    ),
    child: const Icon(Icons.swap_vert_rounded, color: AppColors.navy),
  );
}

class _DateTimePanel extends StatelessWidget {
  const _DateTimePanel({required this.bookNow, required this.onChanged});

  final bool bookNow;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.schedule_rounded, color: AppColors.orange),
            SizedBox(width: 8),
            Text(
              'When do you want to ride?',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          height: 42,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: const Color(0xFFF2F5F9),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _RideTimeChoice(
                  label: 'Book Now',
                  icon: Icons.flash_on_rounded,
                  selected: bookNow,
                  onTap: () => onChanged(true),
                ),
              ),
              Expanded(
                child: _RideTimeChoice(
                  label: 'Schedule',
                  icon: Icons.calendar_month_rounded,
                  selected: !bookNow,
                  onTap: () => onChanged(false),
                ),
              ),
            ],
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          child: bookNow
              ? const SizedBox.shrink()
              : const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Row(
                    children: [
                      Expanded(child: _Picker('Pickup Date', 'May 25, 2026')),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: SizedBox(height: 56, child: VerticalDivider()),
                      ),
                      Expanded(child: _Picker('Pickup Time', '09:30 AM')),
                    ],
                  ),
                ),
        ),
      ],
    ),
  );
}

class _RideTimeChoice extends StatelessWidget {
  const _RideTimeChoice({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(9),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 190),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: Color(0x120A244A),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 17,
              color: selected ? AppColors.orange : AppColors.muted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? AppColors.navy : AppColors.muted,
                fontSize: 11.5,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _Picker extends StatelessWidget {
  const _Picker(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: AppColors.navy, fontSize: 11)),
      const SizedBox(height: 6),
      Container(
        height: 37,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFDDE2EA)),
          borderRadius: BorderRadius.circular(10),
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

class _DurationPanel extends StatelessWidget {
  const _DurationPanel({
    required this.selectedIndex,
    required this.duration,
    required this.onPresetSelected,
    required this.onDurationChanged,
  });
  final int selectedIndex;
  final double duration;
  final ValueChanged<int> onPresetSelected;
  final ValueChanged<double> onDurationChanged;

  String get durationText {
    final hours = duration.floor();
    final minutes = ((duration - hours) * 60).round();
    return minutes == 0 ? '$hours Hours' : '$hours Hours $minutes Mins';
  }

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.schedule_rounded, color: AppColors.blue, size: 20),
            SizedBox(width: 8),
            Text(
              'How long will you stay?',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.only(left: 28, top: 5),
          child: Text(
            'Select the total time in destination',
            style: TextStyle(color: AppColors.muted, fontSize: 10.5),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: List.generate(5, (index) {
            final labels = ['30 mins', '1 hr', '2 hr', '3 hr', 'Custom'];
            final selected = selectedIndex == index;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: index == 4 ? 0 : 6),
                child: InkWell(
                  onTap: () => onPresetSelected(index),
                  borderRadius: BorderRadius.circular(9),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    height: 34,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(
                        color: selected
                            ? AppColors.blue
                            : const Color(0xFFDDE2EA),
                      ),
                    ),
                    child: Text(
                      labels[index],
                      style: TextStyle(
                        color: selected ? AppColors.blue : AppColors.navy,
                        fontSize: 9.5,
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          child: selectedIndex == 4
              ? Column(
                  children: [
                    const SizedBox(height: 13),
                    Row(
                      children: [
                        const Text(
                          'Custom duration',
                          style: TextStyle(
                            color: AppColors.navy,
                            fontSize: 10.5,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          durationText,
                          style: const TextStyle(
                            color: AppColors.blue,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 3,
                        thumbShape: const RoundSliderThumbShape(
                          enabledThumbRadius: 7,
                        ),
                        overlayShape: const RoundSliderOverlayShape(
                          overlayRadius: 13,
                        ),
                      ),
                      child: Slider(
                        value: duration,
                        min: 5,
                        max: 12,
                        divisions: 14,
                        activeColor: AppColors.blue,
                        inactiveColor: const Color(0xFFDDE2EA),
                        onChanged: onDurationChanged,
                      ),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '5 hours',
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 9.5,
                          ),
                        ),
                        Text(
                          '12 hours',
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 9.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                )
              : const SizedBox.shrink(),
        ),
      ],
    ),
  );
}

class _VehiclePanel extends StatelessWidget {
  const _VehiclePanel({
    required this.vehicles,
    required this.selectedIndex,
    required this.onSelected,
  });
  final List<_Vehicle> vehicles;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(12, 12, 0, 13),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.local_taxi_rounded, color: Color(0xFF169647), size: 19),
            SizedBox(width: 8),
            Text(
              'Select Vehicle Type',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 9),
        SizedBox(
          height: 112,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(right: 14),
            itemCount: vehicles.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final vehicle = vehicles[index];
              final selected = selectedIndex == index;
              return InkWell(
                onTap: () => onSelected(index),
                borderRadius: BorderRadius.circular(15),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 94,
                  padding: const EdgeInsets.fromLTRB(6, 6, 6, 7),
                  decoration: BoxDecoration(
                    color: selected ? const Color(0xFFFFF8F4) : Colors.white,
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: selected
                          ? AppColors.orange
                          : const Color(0xFFDDE2EA),
                      width: selected ? 1.7 : 1,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Column(
                        children: [
                          Expanded(
                            child: Image.asset(
                              vehicle.image,
                              fit: BoxFit.contain,
                            ),
                          ),
                          Text(
                            vehicle.name,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            vehicle.seats,
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 9.5,
                            ),
                          ),
                        ],
                      ),
                      if (selected)
                        const Positioned(
                          left: 0,
                          top: 0,
                          child: CircleAvatar(
                            radius: 9,
                            backgroundColor: AppColors.orange,
                            child: Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    ),
  );
}

class _WaitingNotice extends StatelessWidget {
  const _WaitingNotice();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: const Color(0xFFEAF3FF),
      borderRadius: BorderRadius.circular(17),
    ),
    child: const Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: AppColors.blue,
          child: Icon(Icons.shield_rounded, color: Colors.white, size: 23),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Round trip includes driver waiting time',
                style: TextStyle(
                  color: AppColors.blue,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'No extra charges for the return ride within your selected time.',
                style: TextStyle(color: AppColors.muted, fontSize: 9.5),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _ContinueButton extends StatelessWidget {
  const _ContinueButton();

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 59,
    child: FilledButton(
      onPressed: () {},
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Continue',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 2),
          Text(
            'Review trip details and book',
            style: TextStyle(fontSize: 10.5),
          ),
        ],
      ),
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
      borderRadius: BorderRadius.circular(19),
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

class _Vehicle {
  const _Vehicle(this.name, this.seats, this.image);
  final String name;
  final String seats;
  final String image;
}
