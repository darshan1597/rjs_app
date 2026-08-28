import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';

class RentalPackagesScreen extends StatefulWidget {
  const RentalPackagesScreen({super.key});

  @override
  State<RentalPackagesScreen> createState() => _RentalPackagesScreenState();
}

class _RentalPackagesScreenState extends State<RentalPackagesScreen> {
  int _tripType = 0;
  int _carType = 1;
  int _package = 1;
  final Set<int> _addons = {};

  static const _cars = [
    _Car('Hatchback', '4 Seater', 'assets/images/popup-car.png'),
    _Car('Sedan', '4 Seater', 'assets/images/ride-sedan.png'),
    _Car('SUV', '6 Seater', 'assets/images/ride-suv.png'),
    _Car('7 Seater', '7 Seater', 'assets/images/schedule-8-seater.png'),
    _Car('Luxury', '4 Seater', 'assets/images/popup-car.png'),
  ];

  static const _packages = [
    _Package('4 Hours', '40 KMs Included', '₹1,999', 4, 40),
    _Package('8 Hours', '80 KMs Included', '₹3,199', 8, 80),
    _Package('12 Hours', '120 KMs Included', '₹4,199', 12, 120),
    _Package('24 Hours', '250 KMs Included', '₹6,199', 24, 250),
  ];

  @override
  Widget build(BuildContext context) {
    final selectedPackage = _packages[_package];
    return BookRideScaffold(
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
                title: 'Rental Packages',
                backgroundAsset: 'assets/images/rental-banner.png',
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
                  _TripAndDatePanel(
                    selected: _tripType,
                    onSelected: (value) => setState(() => _tripType = value),
                  ),
                  const SizedBox(height: 12),
                  const _PickupPanel(),
                  if (_tripType == 2) ...[
                    const SizedBox(height: 12),
                    const _KilometresPanel(),
                  ],
                  const SizedBox(height: 12),
                  _CarTypePanel(
                    cars: _cars,
                    selectedIndex: _carType,
                    onSelected: (value) => setState(() => _carType = value),
                  ),
                  if (_tripType == 0) ...[
                    const SizedBox(height: 12),
                    _PackagesPanel(
                      selectedIndex: _package,
                      onSelected: (value) => setState(() => _package = value),
                    ),
                  ],
                  const SizedBox(height: 12),
                  _AddonsPanel(
                    selected: _addons,
                    onToggle: (index) => setState(() {
                      _addons.contains(index)
                          ? _addons.remove(index)
                          : _addons.add(index);
                    }),
                  ),
                  const SizedBox(height: 12),
                  _PackageSummary(
                    package: selectedPackage,
                    tripType: _tripType,
                    car: _cars[_carType],
                  ),
                  const SizedBox(height: 14),
                  const _ViewCarsButton(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
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
                'Rental Packages',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Rent a car with driver for your needs',
                style: TextStyle(color: AppColors.muted, fontSize: 12.5),
              ),
            ],
          ),
        ),
        Stack(
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
class _RentalBanner extends StatelessWidget {
  const _RentalBanner();

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(19),
    child: SizedBox(
      height: 112,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/images/rental-banner.png',
            fit: BoxFit.cover,
            alignment: Alignment.centerRight,
            filterQuality: FilterQuality.high,
          ),
          Positioned(
            left: 14,
            top: 20,
            child: Container(
              width: 58,
              height: 66,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                boxShadow: const [
                  BoxShadow(color: Color(0x130A244A), blurRadius: 12),
                ],
              ),
              child: const Icon(
                Icons.calendar_month_rounded,
                color: AppColors.blue,
                size: 32,
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
                  'Your car, your time',
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  "Choose duration & kilometres.\nWe'll take care of the rest.",
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 10.5,
                    height: 1.38,
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

class _TripAndDatePanel extends StatelessWidget {
  const _TripAndDatePanel({required this.selected, required this.onSelected});
  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Select Trip Type'),
        const SizedBox(height: 9),
        Row(
          children: [
            _TripChoice(
              title: 'Hourly',
              subtitle: 'Pay for hours',
              iconType: _TripIconType.hourly,
              selected: selected == 0,
              onTap: () => onSelected(0),
            ),
            const SizedBox(width: 7),
            _TripChoice(
              title: 'Daily',
              subtitle: '24 hours package',
              iconType: _TripIconType.daily,
              selected: selected == 1,
              onTap: () => onSelected(1),
            ),
            const SizedBox(width: 7),
            _TripChoice(
              title: 'Custom KM',
              subtitle: 'Pay per kilometre',
              iconType: _TripIconType.customKm,
              selected: selected == 2,
              onTap: () => onSelected(2),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const _Title('Date & Time'),
        const SizedBox(height: 9),
        Row(
          children: [
            const Expanded(
              child: _DatePicker(
                label: 'Start Date & Time',
                value: 'May 25, 2026   09:30 AM',
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: SizedBox(height: 53, child: VerticalDivider()),
            ),
            Expanded(
              child: _DatePicker(
                label: 'End Date & Time',
                value: switch (selected) {
                  1 => 'May 26, 2026   09:30 AM',
                  2 => 'May 25, 2026   09:30 PM',
                  _ => 'May 25, 2026   05:30 PM',
                },
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _TripChoice extends StatelessWidget {
  const _TripChoice({
    required this.title,
    required this.subtitle,
    required this.iconType,
    required this.selected,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final _TripIconType iconType;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(11),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 62,
        padding: const EdgeInsets.symmetric(horizontal: 7),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFFFF8F4) : Colors.white,
          borderRadius: BorderRadius.circular(11),
          border: Border.all(
            color: selected ? AppColors.orange : const Color(0xFFDDE2EA),
            width: selected ? 1.6 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _TripTypeIcon(
              type: iconType,
              color: selected ? AppColors.orange : AppColors.muted,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 8.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

enum _TripIconType { hourly, daily, customKm }

class _TripTypeIcon extends StatelessWidget {
  const _TripTypeIcon({required this.type, required this.color});
  final _TripIconType type;
  final Color color;

  @override
  Widget build(BuildContext context) => switch (type) {
    _TripIconType.hourly => Icon(
      Icons.schedule_outlined,
      color: color,
      size: 25,
    ),
    _TripIconType.daily => CustomPaint(
      size: const Size(31, 29),
      painter: _RoadIconPainter(color),
    ),
    _TripIconType.customKm => CustomPaint(
      size: const Size(30, 27),
      painter: _SpeedometerIconPainter(color),
    ),
  };
}

class _RoadIconPainter extends CustomPainter {
  const _RoadIconPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final fill = Paint()..color = color;
    final road = Path()
      ..moveTo(size.width * .04, size.height)
      ..lineTo(size.width * .31, 0)
      ..lineTo(size.width * .69, 0)
      ..lineTo(size.width * .96, size.height)
      ..close();
    canvas.drawPath(road, fill);

    final lanePaint = Paint()..color = Colors.white;
    for (final marker in const [(.20, 3.2), (.47, 4.1), (.76, 5.0)]) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(size.width * .5, size.height * marker.$1),
            width: 2.2,
            height: marker.$2,
          ),
          const Radius.circular(1.1),
        ),
        lanePaint,
      );
    }
  }

  @override
  bool shouldRepaint(_RoadIconPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _SpeedometerIconPainter extends CustomPainter {
  const _SpeedometerIconPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * .73);
    final radius = size.width * .39;
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.1
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      3.35,
      2.73,
      false,
      stroke,
    );
    for (final angle in [3.55, 4.15, 4.72, 5.3, 5.9]) {
      final outer = Offset(
        center.dx + radius * math.cos(angle),
        center.dy + radius * math.sin(angle),
      );
      final inner = Offset(
        center.dx + (radius - 3.6) * math.cos(angle),
        center.dy + (radius - 3.6) * math.sin(angle),
      );
      canvas.drawLine(inner, outer, stroke);
    }
    const needleAngle = 5.35;
    canvas.drawLine(
      center,
      Offset(
        center.dx + radius * .66 * math.cos(needleAngle),
        center.dy + radius * .66 * math.sin(needleAngle),
      ),
      stroke,
    );
    canvas.drawCircle(center, 2, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_SpeedometerIconPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _DatePicker extends StatelessWidget {
  const _DatePicker({required this.label, required this.value});
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
            size: 17,
          ),
          const SizedBox(width: 7),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      const SizedBox(height: 6),
      Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(9),
          border: Border.all(color: const Color(0xFFDDE2EA)),
        ),
        child: Row(
          children: [
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  value,
                  style: const TextStyle(color: AppColors.navy, fontSize: 10),
                ),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 17),
          ],
        ),
      ),
    ],
  );
}

class _PickupPanel extends StatelessWidget {
  const _PickupPanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Row(
      children: [
        Icon(Icons.location_on_outlined, color: AppColors.blue, size: 25),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Title('Pick-up Location'),
              SizedBox(height: 6),
              _InputBox('Enter pick-up location'),
            ],
          ),
        ),
      ],
    ),
  );
}

class _InputBox extends StatelessWidget {
  const _InputBox(this.hint);
  final String hint;

  @override
  Widget build(BuildContext context) => Container(
    height: 38,
    padding: const EdgeInsets.symmetric(horizontal: 10),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(9),
      border: Border.all(color: const Color(0xFFDDE2EA)),
    ),
    child: Row(
      children: [
        Expanded(
          child: Text(
            hint,
            style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
          ),
        ),
        const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
      ],
    ),
  );
}

class _CarTypePanel extends StatelessWidget {
  const _CarTypePanel({
    required this.cars,
    required this.selectedIndex,
    required this.onSelected,
  });
  final List<_Car> cars;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(12, 12, 0, 13),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Select Car Type'),
        const SizedBox(height: 9),
        SizedBox(
          height: 111,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(right: 14),
            itemCount: cars.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final car = cars[index];
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
                            child: Image.asset(car.image, fit: BoxFit.contain),
                          ),
                          Text(
                            car.name,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            car.seats,
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

class _KilometresPanel extends StatefulWidget {
  const _KilometresPanel();

  @override
  State<_KilometresPanel> createState() => _KilometresPanelState();
}

class _KilometresPanelState extends State<_KilometresPanel> {
  double _kilometres = 150;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            _Title('Kilometres & Limits '),
            Text(
              '(With Driver)',
              style: TextStyle(color: AppColors.muted, fontSize: 10.5),
            ),
          ],
        ),
        const SizedBox(height: 3),
        const Text(
          'Set your required kilometres',
          style: TextStyle(color: AppColors.muted, fontSize: 9.5),
        ),
        const SizedBox(height: 11),
        Row(
          children: [
            Expanded(
              flex: 6,
              child: Container(
                height: 72,
                padding: const EdgeInsets.symmetric(horizontal: 11),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFDDE2EA)),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 20,
                      backgroundColor: Color(0xFFF0F4FA),
                      child: Icon(
                        Icons.add_road_rounded,
                        color: AppColors.blue,
                      ),
                    ),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Total KM Required',
                            style: TextStyle(
                              color: AppColors.muted,
                              fontSize: 9.5,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: [
                              _KmButton(
                                icon: Icons.remove_rounded,
                                onTap: () => setState(
                                  () => _kilometres = (_kilometres - 10).clamp(
                                    50,
                                    500,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  _kilometres.round().toString(),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: AppColors.navy,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              _KmButton(
                                icon: Icons.add_rounded,
                                onTap: () => setState(
                                  () => _kilometres = (_kilometres + 10).clamp(
                                    50,
                                    500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 7),
                    const Text(
                      'KM',
                      style: TextStyle(color: AppColors.navy, fontSize: 10.5),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 4,
              child: Container(
                height: 72,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8F4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Includes ${_kilometres.round()} KM',
                      style: const TextStyle(
                        color: AppColors.orange,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Extra KM charged as per selected car',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: 8.5,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            trackHeight: 3,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            overlayShape: const RoundSliderOverlayShape(overlayRadius: 13),
          ),
          child: Slider(
            value: _kilometres,
            min: 50,
            max: 500,
            divisions: 45,
            activeColor: AppColors.orange,
            inactiveColor: const Color(0xFFDDE2EA),
            onChanged: (value) => setState(() => _kilometres = value),
          ),
        ),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '50 KM',
              style: TextStyle(color: AppColors.muted, fontSize: 9.5),
            ),
            Text(
              '500 KM',
              style: TextStyle(color: AppColors.muted, fontSize: 9.5),
            ),
          ],
        ),
      ],
    ),
  );
}

class _KmButton extends StatelessWidget {
  const _KmButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(6),
    child: Container(
      width: 29,
      height: 27,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFDDE2EA)),
      ),
      child: Icon(icon, color: AppColors.navy, size: 18),
    ),
  );
}

class _PackagesPanel extends StatelessWidget {
  const _PackagesPanel({required this.selectedIndex, required this.onSelected});
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(12, 12, 0, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text(
              'Hourly Packages ',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              '(With Driver)',
              style: TextStyle(color: AppColors.muted, fontSize: 10.5),
            ),
          ],
        ),
        const SizedBox(height: 3),
        const Text(
          'Includes fuel, driver allowance & basic taxes',
          style: TextStyle(color: AppColors.muted, fontSize: 9.5),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 112,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(right: 12),
            itemCount: _RentalPackagesScreenState._packages.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final package = _RentalPackagesScreenState._packages[index];
              final selected = selectedIndex == index;
              return InkWell(
                onTap: () => onSelected(index),
                borderRadius: BorderRadius.circular(13),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 105,
                  decoration: BoxDecoration(
                    color: selected ? const Color(0xFFFFF8F4) : Colors.white,
                    borderRadius: BorderRadius.circular(13),
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
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.schedule_rounded,
                            color: AppColors.blue,
                            size: 23,
                          ),
                          const SizedBox(height: 5),
                          Text(
                            package.duration,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(
                            width: double.infinity,
                            child: Text(
                              package.kmText,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontSize: 8.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            package.price,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.orange,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      if (selected)
                        const Positioned(
                          right: 5,
                          top: 5,
                          child: CircleAvatar(
                            radius: 8,
                            backgroundColor: AppColors.orange,
                            child: Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 11,
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
        const SizedBox(height: 9),
        Container(
          height: 27,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFFF0F6FF),
            borderRadius: BorderRadius.circular(7),
          ),
          child: const Text(
            'Extra Hour: ₹250/hour   •   Extra Km: ₹15/km',
            style: TextStyle(color: AppColors.muted, fontSize: 9.5),
          ),
        ),
      ],
    ),
  );
}

class _AddonsPanel extends StatelessWidget {
  const _AddonsPanel({required this.selected, required this.onToggle});
  final Set<int> selected;
  final ValueChanged<int> onToggle;

  @override
  Widget build(BuildContext context) {
    const addons = [
      ('Extra KMs', '₹15/km', Icons.speed_rounded),
      ('Toll Charges', 'Actuals', Icons.account_balance_outlined),
      ('Parking Charges', 'Actuals', Icons.local_parking_rounded),
      ('Outstation Permit', '₹300/day', Icons.file_present_outlined),
    ];
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text(
                'Add-ons ',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                '(Optional)',
                style: TextStyle(color: AppColors.muted, fontSize: 10.5),
              ),
            ],
          ),
          const SizedBox(height: 9),
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: addons.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final item = addons[index];
                final checked = selected.contains(index);
                return InkWell(
                  onTap: () => onToggle(index),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 128,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: checked
                            ? AppColors.blue
                            : const Color(0xFFDDE2EA),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(item.$3, color: AppColors.blue, size: 20),
                        const SizedBox(width: 7),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.$1,
                                maxLines: 1,
                                style: const TextStyle(
                                  color: AppColors.navy,
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                item.$2,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 8.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          checked
                              ? Icons.check_box_rounded
                              : Icons.check_box_outline_blank_rounded,
                          color: checked
                              ? AppColors.blue
                              : const Color(0xFFCCD3DE),
                          size: 17,
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
}

class _PackageSummary extends StatelessWidget {
  const _PackageSummary({
    required this.package,
    required this.tripType,
    required this.car,
  });
  final _Package package;
  final int tripType;
  final _Car car;

  String get price => switch (tripType) {
    1 => '₹2,499',
    2 => '₹2,299',
    _ => package.price,
  };

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0F6FF),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Package Summary'),
        const SizedBox(height: 12),
        Row(
          children: [
            _SummaryValue('Duration', switch (tripType) {
              1 => '24 Hours',
              2 => '1 Day',
              _ => package.duration,
            }),
            const SizedBox(height: 40, child: VerticalDivider()),
            _SummaryValue(
              tripType == 0 ? 'Km Included' : 'Car',
              tripType == 0 ? '${package.km} KMs' : car.name,
            ),
            const SizedBox(height: 40, child: VerticalDivider()),
            _SummaryValue(
              tripType == 2 ? 'Extra KM Charge' : 'Base Price',
              tripType == 2 ? '₹15 / km' : price,
            ),
          ],
        ),
        const Divider(height: 18),
        Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Estimated Price',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    '(Taxes included)',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                ],
              ),
            ),
            Text(
              price,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: AppColors.muted,
            ),
          ],
        ),
      ],
    ),
  );
}

class _SummaryValue extends StatelessWidget {
  const _SummaryValue(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(color: AppColors.navy, fontSize: 11.5),
        ),
      ],
    ),
  );
}

class _ViewCarsButton extends StatelessWidget {
  const _ViewCarsButton();

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 59,
    child: FilledButton(
      onPressed: () {},
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: const Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'View Available Cars',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              SizedBox(height: 2),
              Text(
                'See cars and book your package',
                style: TextStyle(fontSize: 10.5),
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
      fontSize: 12.5,
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

class _Car {
  const _Car(this.name, this.seats, this.image);
  final String name;
  final String seats;
  final String image;
}

class _Package {
  const _Package(this.duration, this.kmText, this.price, this.hours, this.km);
  final String duration;
  final String kmText;
  final String price;
  final int hours;
  final int km;
}
