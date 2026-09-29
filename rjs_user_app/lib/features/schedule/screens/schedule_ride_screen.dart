import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/notification_popup.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/scheduled_time_picker.dart';
import '../../location/models/map_place.dart';
import '../../location/screens/location_search_screen.dart';
import '../../rides/screens/choose_ride_screen.dart';

class ScheduleRideScreen extends StatefulWidget {
  const ScheduleRideScreen({super.key});

  @override
  State<ScheduleRideScreen> createState() => _ScheduleRideScreenState();
}

class _ScheduleRideScreenState extends State<ScheduleRideScreen> {
  MapPlace? _pickup;
  MapPlace? _destination;
  late DateTime _scheduledFor;

  @override
  void initState() {
    super.initState();
    final initial = DateTime.now().add(const Duration(minutes: 35));
    _scheduledFor = DateTime(
      initial.year,
      initial.month,
      initial.day,
      initial.hour,
      initial.minute,
    );
  }

  Future<MapPlace?> _pickLocation(MapPlace? initial) =>
      Navigator.push<MapPlace>(
        context,
        MaterialPageRoute(
          builder: (_) => LocationSearchScreen(
            initialValue: initial?.address ?? '',
            initialPlace: initial,
          ),
        ),
      );

  Future<void> _selectPickup() async {
    final value = await _pickLocation(_pickup);
    if (value != null && mounted) setState(() => _pickup = value);
  }

  Future<void> _selectDestination() async {
    final value = await _pickLocation(_destination);
    if (value != null && mounted) setState(() => _destination = value);
  }

  void _swapLocations() => setState(() {
    final pickup = _pickup;
    _pickup = _destination;
    _destination = pickup;
  });

  Future<void> _pickDate() async {
    final value = await showDatePicker(
      context: context,
      initialDate: _scheduledFor,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (value != null && mounted) {
      final candidate = DateTime(
        value.year,
        value.month,
        value.day,
        _scheduledFor.hour,
        _scheduledFor.minute,
      );
      final minimum = DateTime.now().add(const Duration(minutes: 35));
      setState(
        () => _scheduledFor = candidate.isBefore(minimum) ? minimum : candidate,
      );
    }
  }

  Future<void> _pickTime() async {
    final value = await showScheduledTimePicker(
      context: context,
      date: _scheduledFor,
      initialTime: TimeOfDay.fromDateTime(_scheduledFor),
    );
    if (value != null && mounted) {
      setState(
        () => _scheduledFor = DateTime(
          _scheduledFor.year,
          _scheduledFor.month,
          _scheduledFor.day,
          value.hour,
          value.minute,
        ),
      );
    }
  }

  void _continue() {
    if (_pickup == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter both pickup and drop locations')),
      );
      return;
    }
    if (_scheduledFor.isBefore(
      DateTime.now().add(const Duration(minutes: 30)),
    )) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Choose a pickup time at least 30 minutes from now'),
        ),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (_) => ChooseRideScreen(
          pickup: _pickup!,
          destination: _destination!,
          scheduledFor: _scheduledFor,
        ),
      ),
    );
  }

  String get _dateLabel {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[_scheduledFor.month - 1]} ${_scheduledFor.day}, ${_scheduledFor.year}';
  }

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: -1,
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
              title: 'Schedule Ride',
              backgroundAsset: 'assets/images/schedule-banner-artwork.png',
              onMenuTap: _openDrawer,
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
                _AlignedLocationSection(
                  pickup: _pickup,
                  destination: _destination,
                  onPickup: _selectPickup,
                  onDestination: _selectDestination,
                  onSwap: _swapLocations,
                ),
                const SizedBox(height: 12),
                _DateTimeSection(
                  date: _dateLabel,
                  time: TimeOfDay.fromDateTime(_scheduledFor).format(context),
                  onDate: _pickDate,
                  onTime: _pickTime,
                ),
                const SizedBox(height: 12),
                const _AdvanceNotice(),
                const SizedBox(height: 14),
                _ScheduleButton(onPressed: _continue),
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
class _ScheduleHeader extends StatelessWidget {
  const _ScheduleHeader({required this.onMenuTap});

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
                'Schedule Ride',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Book a ride for later',
                style: TextStyle(color: AppColors.muted, fontSize: 12.5),
              ),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              onPressed: () => showRjsNotifications(context),
              icon: const Icon(
                Icons.notifications_none_rounded,
                color: AppColors.navy,
                size: 29,
              ),
            ),
            const Positioned(right: 2, top: 2, child: RjsNotificationDot()),
          ],
        ),
      ],
    ),
  );
}

// ignore: unused_element
class _ReferencePlanningBanner extends StatelessWidget {
  const _ReferencePlanningBanner();

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(20),
    child: SizedBox(
      height: 112,
      child: LayoutBuilder(
        builder: (context, constraints) => Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/schedule-banner-artwork.png',
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
            Positioned(
              left: constraints.maxWidth * .285,
              top: 21,
              width: constraints.maxWidth * .385,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Plan ahead, travel\nhassle-free',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 14.5,
                      height: 1.24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Schedule your ride in\nadvance and relax.',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 10.5,
                      height: 1.28,
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

class _AlignedLocationSection extends StatelessWidget {
  const _AlignedLocationSection({
    required this.pickup,
    required this.destination,
    required this.onPickup,
    required this.onDestination,
    required this.onSwap,
  });

  final MapPlace? pickup;
  final MapPlace? destination;
  final VoidCallback onPickup;
  final VoidCallback onDestination;
  final VoidCallback onSwap;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Stack(
      alignment: Alignment.centerRight,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 49),
          child: Column(
            children: [
              _AlignedLocationRow(
                iconColor: AppColors.orange,
                label: 'Pickup Location',
                value: pickup?.address ?? 'Enter pickup location',
                onTap: onPickup,
              ),
              const SizedBox(height: 8),
              _AlignedLocationRow(
                iconColor: AppColors.blue,
                label: 'Drop Location',
                value: destination?.address ?? 'Enter drop location',
                onTap: onDestination,
              ),
            ],
          ),
        ),
        InkWell(
          onTap: onSwap,
          customBorder: const CircleBorder(),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E6ED)),
            ),
            child: const Icon(Icons.swap_vert_rounded, color: AppColors.navy),
          ),
        ),
      ],
    ),
  );
}

class _AlignedLocationRow extends StatelessWidget {
  const _AlignedLocationRow({
    required this.iconColor,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final Color iconColor;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      SizedBox(
        width: 29,
        height: 39,
        child: Center(
          child: Icon(Icons.location_on_rounded, color: iconColor, size: 24),
        ),
      ),
      const SizedBox(width: 9),
      Expanded(child: _LocationInput(label, value, onTap)),
    ],
  );
}

class _LocationInput extends StatelessWidget {
  const _LocationInput(this.label, this.value, this.onTap);
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Column(
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
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(11),
        child: Container(
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
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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
      ),
    ],
  );
}

class _DateTimeSection extends StatelessWidget {
  const _DateTimeSection({
    required this.date,
    required this.time,
    required this.onDate,
    required this.onTime,
  });

  final String date;
  final String time;
  final VoidCallback onDate;
  final VoidCallback onTime;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      children: [
        Expanded(
          child: _PickerField(
            icon: Icons.calendar_month_rounded,
            title: 'Pick-up Date',
            value: date,
            onTap: onDate,
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: SizedBox(height: 62, child: VerticalDivider()),
        ),
        Expanded(
          child: _PickerField(
            icon: Icons.schedule_rounded,
            title: 'Pick-up Time',
            value: time,
            onTap: onTime,
          ),
        ),
      ],
    ),
  );
}

class _PickerField extends StatelessWidget {
  const _PickerField({
    required this.icon,
    required this.title,
    required this.value,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(icon, color: AppColors.orange, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 7),
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFDDE2EA)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(color: AppColors.navy, fontSize: 11.5),
                ),
              ),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: AppColors.navy,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

class _VehicleSection extends StatelessWidget {
  const _VehicleSection({
    required this.vehicles,
    required this.selectedIndex,
    required this.onSelected,
  });
  final List<_ScheduleVehicle> vehicles;
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
              final selected = index == selectedIndex;
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

class _AdditionalOptions extends StatelessWidget {
  const _AdditionalOptions();

  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Additional Options',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
        ),
        SizedBox(height: 7),
        _OptionRow(
          icon: Icons.schedule_rounded,
          title: 'Waiting Time',
          subtitle: 'Add extra waiting time',
          trailing: '30 mins',
        ),
        Divider(height: 1),
        _OptionRow(
          icon: Icons.note_alt_outlined,
          title: 'Add Note',
          subtitle: 'Write any special instructions',
          trailing: 'Optional',
        ),
      ],
    ),
  );
}

class _OptionRow extends StatelessWidget {
  const _OptionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.trailing,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final String trailing;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 52,
    child: Row(
      children: [
        Icon(icon, color: AppColors.orange, size: 21),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (trailing == 'Optional')
                    const Text(
                      ' (Optional)',
                      style: TextStyle(color: AppColors.muted, fontSize: 10.5),
                    ),
                ],
              ),
              Text(
                subtitle,
                style: const TextStyle(color: AppColors.muted, fontSize: 10),
              ),
            ],
          ),
        ),
        if (trailing != 'Optional')
          Text(
            trailing,
            style: const TextStyle(color: AppColors.navy, fontSize: 11),
          ),
        const SizedBox(width: 7),
        const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
      ],
    ),
  );
}

class _AdvanceNotice extends StatelessWidget {
  const _AdvanceNotice();

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
          radius: 21,
          backgroundColor: AppColors.blue,
          child: Icon(Icons.shield_rounded, color: Colors.white, size: 24),
        ),
        SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Booking in Advance',
                style: TextStyle(
                  color: AppColors.blue,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'You will receive a confirmation and reminder before your scheduled ride.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 10.5,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
        Icon(Icons.notifications_active_rounded, color: AppColors.blue),
      ],
    ),
  );
}

class _ScheduleButton extends StatelessWidget {
  const _ScheduleButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 58,
    child: FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Choose Vehicle',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          const Text(
            'View live fares and available vehicle types',
            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w500),
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

class _ScheduleVehicle {
  const _ScheduleVehicle({
    required this.name,
    required this.seats,
    required this.image,
  });
  final String name;
  final String seats;
  final String image;
}
