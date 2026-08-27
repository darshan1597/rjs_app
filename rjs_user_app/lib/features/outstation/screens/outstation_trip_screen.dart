import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';

class OutstationTripScreen extends StatefulWidget {
  const OutstationTripScreen({super.key});

  @override
  State<OutstationTripScreen> createState() => _OutstationTripScreenState();
}

class _OutstationTripScreenState extends State<OutstationTripScreen> {
  bool _roundTrip = false;
  int _selectedVehicle = 0;

  static const _vehicles = [
    _Vehicle('Car', '4 Seater', 'assets/images/popup-car.png'),
    _Vehicle('SUV', '6 Seater', 'assets/images/ride-suv.png'),
    _Vehicle(
      'Tempo Traveller',
      '9-12 Seater',
      'assets/images/popup-tempo-traveller.png',
    ),
    _Vehicle('Bus', '20+ Seater', 'assets/images/popup-bus.png'),
  ];

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: -1,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (index) {
      if (index == 0) Navigator.pop(context);
    },
    body: SafeArea(
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _Header(onMenuTap: () => showRjsDrawer(context)),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 118),
            sliver: SliverList.list(
              children: [
                const _OutstationBanner(),
                const SizedBox(height: 12),
                _TripTypePanel(
                  roundTrip: _roundTrip,
                  onChanged: (value) => setState(() => _roundTrip = value),
                ),
                const SizedBox(height: 12),
                const _LocationPanel(),
                const SizedBox(height: 12),
                _DateTimePanel(roundTrip: _roundTrip),
                const SizedBox(height: 12),
                _VehiclePanel(
                  vehicles: _vehicles,
                  selectedIndex: _selectedVehicle,
                  onSelected: (index) =>
                      setState(() => _selectedVehicle = index),
                ),
                const SizedBox(height: 12),
                const _FarePanel(),
                const SizedBox(height: 14),
                const _FindVehiclesButton(),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

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
                'Outstation Trip',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Travel beyond the city',
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

class _OutstationBanner extends StatelessWidget {
  const _OutstationBanner();

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(19),
    child: SizedBox(
      height: 112,
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
                Icons.route_rounded,
                color: Color(0xFF6952CC),
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
                  'Plan your outstation journey',
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  "One way or round trip,\nwe'll take you there.",
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

class _TripTypePanel extends StatelessWidget {
  const _TripTypePanel({required this.roundTrip, required this.onChanged});
  final bool roundTrip;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Trip Type',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 9),
        Row(
          children: [
            Expanded(
              child: _TripChoice(
                label: 'One Way',
                selected: !roundTrip,
                onTap: () => onChanged(false),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _TripChoice(
                label: 'Round Trip',
                selected: roundTrip,
                onTap: () => onChanged(true),
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
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 190),
      height: 42,
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFFFF8F4) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: selected ? AppColors.orange : const Color(0xFFDDE2EA),
          width: selected ? 1.6 : 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            selected
                ? Icons.radio_button_checked_rounded
                : Icons.radio_button_off_rounded,
            color: selected ? AppColors.orange : AppColors.muted,
            size: 19,
          ),
          const SizedBox(width: 7),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
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
    child: Column(
      children: [
        _LocationRow(
          color: AppColors.orange,
          label: 'Pickup Location',
          hint: 'Enter pickup location',
        ),
        SizedBox(height: 8),
        _LocationRow(
          color: AppColors.blue,
          label: 'Destination',
          hint: 'Enter destination',
        ),
        SizedBox(height: 12),
        _AddStopButton(),
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
        radius: 19,
        backgroundColor: color.withValues(alpha: .09),
        child: Icon(Icons.location_on_rounded, color: color, size: 22),
      ),
      const SizedBox(width: 13),
      Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Color(0xFFE4E8EF))),
          ),
          child: Row(
            children: [
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
                    const SizedBox(height: 4),
                    Text(
                      hint,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 10.5,
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
    ],
  );
}

class _AddStopButton extends StatelessWidget {
  const _AddStopButton();

  @override
  Widget build(BuildContext context) => Container(
    height: 40,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFFBFD0E8)),
    ),
    child: const Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.add_circle_outline_rounded, color: AppColors.blue, size: 20),
        SizedBox(width: 7),
        Text(
          'Add Stop',
          style: TextStyle(
            color: AppColors.blue,
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          ' (Optional)',
          style: TextStyle(color: AppColors.muted, fontSize: 10.5),
        ),
      ],
    ),
  );
}

class _DateTimePanel extends StatelessWidget {
  const _DateTimePanel({required this.roundTrip});
  final bool roundTrip;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date & Time',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        const _DateRow(
          iconColor: AppColors.orange,
          title: 'Departure',
          dateLabel: 'Departure Date',
          date: 'May 25, 2026',
          timeLabel: 'Departure Time',
          time: '09:30 AM',
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 230),
          curve: Curves.easeOutCubic,
          child: roundTrip
              ? const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: _DateRow(
                    iconColor: AppColors.blue,
                    title: 'Return',
                    dateLabel: 'Return Date',
                    date: 'May 27, 2026',
                    timeLabel: 'Return Time',
                    time: '06:00 PM',
                  ),
                )
              : const SizedBox.shrink(),
        ),
      ],
    ),
  );
}

class _DateRow extends StatelessWidget {
  const _DateRow({
    required this.iconColor,
    required this.title,
    required this.dateLabel,
    required this.date,
    required this.timeLabel,
    required this.time,
  });
  final Color iconColor;
  final String title;
  final String dateLabel;
  final String date;
  final String timeLabel;
  final String time;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      CircleAvatar(
        radius: 19,
        backgroundColor: iconColor.withValues(alpha: .09),
        child: Icon(Icons.calendar_month_rounded, color: iconColor, size: 21),
      ),
      const SizedBox(width: 10),
      Expanded(
        flex: 5,
        child: _Picker(label: dateLabel, value: date, title: title),
      ),
      const Padding(
        padding: EdgeInsets.symmetric(horizontal: 8),
        child: SizedBox(height: 48, child: VerticalDivider()),
      ),
      Expanded(
        flex: 4,
        child: _Picker(label: timeLabel, value: time),
      ),
    ],
  );
}

class _Picker extends StatelessWidget {
  const _Picker({required this.label, required this.value, this.title});
  final String label;
  final String value;
  final String? title;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (title != null) ...[
        Text(
          title!,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
      ],
      Text(
        label,
        style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
      ),
      const SizedBox(height: 5),
      Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 9),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(9),
          border: Border.all(color: const Color(0xFFDDE2EA)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value,
                style: const TextStyle(color: AppColors.navy, fontSize: 10.5),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
          ],
        ),
      ),
    ],
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
        const Text(
          'Select Vehicle Type',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
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
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 11,
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

class _FarePanel extends StatelessWidget {
  const _FarePanel();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          Icons.check_circle_outline_rounded,
          color: Color(0xFF169647),
          size: 22,
        ),
        SizedBox(width: 8),
        Expanded(
          child: _FareText(
            title: 'Fare Includes',
            body: 'Driver Allowance, Fuel,\nBasic Toll, State Permit',
          ),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: SizedBox(height: 57, child: VerticalDivider()),
        ),
        Icon(Icons.error_outline_rounded, color: AppColors.orange, size: 22),
        SizedBox(width: 8),
        Expanded(
          child: _FareText(
            title: 'Additional Charges May Apply',
            body: 'Extra KMs, Parking, Entry Fees,\nState Taxes',
          ),
        ),
      ],
    ),
  );
}

class _FareText extends StatelessWidget {
  const _FareText({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        maxLines: 2,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 9.5,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 4),
      Text(
        body,
        style: const TextStyle(
          color: AppColors.muted,
          fontSize: 8.5,
          height: 1.35,
        ),
      ),
    ],
  );
}

class _FindVehiclesButton extends StatelessWidget {
  const _FindVehiclesButton();

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
                'Find Vehicles',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              SizedBox(height: 2),
              Text(
                'View available vehicles & fares',
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
