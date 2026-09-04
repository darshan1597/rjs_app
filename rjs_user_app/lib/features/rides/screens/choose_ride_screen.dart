import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../location/screens/location_search_screen.dart';
import '../services/customer_booking_service.dart';
import 'driver_search_screen.dart';

class ChooseRideScreen extends StatefulWidget {
  const ChooseRideScreen({
    super.key,
    required this.pickup,
    required this.destination,
  });

  final String pickup;
  final String destination;

  @override
  State<ChooseRideScreen> createState() => _ChooseRideScreenState();
}

class _ChooseRideScreenState extends State<ChooseRideScreen> {
  late String _pickup;
  late String _destination;
  int _selectedRide = 0;
  bool _searching = false;

  static const _rides = [
    _Ride(
      name: 'Auto',
      variant: 'AUTO',
      amount: 94,
      category: 'Auto',
      description: 'Quick & affordable',
      detail: 'Best for short rides',
      seats: '3',
      price: '₹94',
      eta: '3 min away',
      image: 'assets/images/schedule-auto.png',
    ),
    _Ride(
      name: 'Hatchback',
      variant: 'HATCHBACK',
      amount: 182,
      category: 'Car',
      description: 'Comfortable for daily rides',
      detail: 'AC',
      seats: '4',
      price: '₹182',
      eta: '4 min away',
      image: 'assets/images/popup-car.png',
    ),
    _Ride(
      name: 'Sedan',
      variant: 'SEDAN',
      amount: 318,
      category: 'Car',
      description: 'More space, premium comfort',
      detail: 'AC',
      seats: '4',
      price: '₹318',
      eta: '6 min away',
      image: 'assets/images/ride-sedan.png',
    ),
    _Ride(
      name: 'SUV',
      variant: 'SUV',
      amount: 368,
      category: 'Car',
      description: 'Extra space for groups',
      detail: 'AC',
      seats: '6',
      price: '₹368',
      eta: '7 min away',
      image: 'assets/images/ride-suv.png',
    ),
    _Ride(
      name: 'Tempo Traveller',
      variant: 'TEMPO_TRAVELLER',
      amount: 1250,
      category: 'Car',
      description: 'Perfect for groups',
      detail: 'AC',
      seats: '9–12',
      price: '₹1,250',
      eta: '12 min away',
      image: 'assets/images/popup-tempo-traveller.png',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pickup = widget.pickup;
    _destination = widget.destination;
  }

  Future<void> _editDestination() async {
    final value = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(initialValue: _destination),
      ),
    );
    if (value != null && value.trim().isNotEmpty && mounted) {
      setState(() => _destination = value.trim());
    }
  }

  Future<void> _searchVehicle() async {
    setState(() => _searching = true);
    try {
      final ride = _rides[_selectedRide];
      final booking = await CustomerBookingService.create(
        pickupAddress: _pickup,
        destinationAddress: _destination,
        vehicleVariant: ride.variant,
      );
      if (!mounted) return;
      await Navigator.pushReplacement<void, void>(
        context,
        MaterialPageRoute(
          builder: (_) => DriverSearchScreen(
            booking: booking,
            vehicleName: ride.name,
            vehicleImage: ride.image,
            seats: ride.seats,
          ),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    body: SafeArea(
      bottom: false,
      child: Column(
        children: [
          Expanded(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              children: [
                _header(context),
                _routeMap(),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      for (
                        var rideIndex = 0;
                        rideIndex < _rides.length;
                        rideIndex++
                      ) ...[
                        _RideCard(
                          ride: _rides[rideIndex],
                          selected: _selectedRide == rideIndex,
                          onTap: () =>
                              setState(() => _selectedRide = rideIndex),
                        ),
                        if (rideIndex != _rides.length - 1)
                          const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
                const _PricingNote(),
                const SizedBox(height: 16),
              ],
            ),
          ),
          _BottomAction(
            ride: _rides[_selectedRide],
            searching: _searching,
            onContinue: _searchVehicle,
          ),
        ],
      ),
    ),
  );

  Widget _header(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 9, 16, 14),
    child: Row(
      children: [
        InkWell(
          onTap: () => Navigator.pop(context),
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
            child: const Icon(
              Icons.arrow_back_rounded,
              color: AppColors.navy,
              size: 27,
            ),
          ),
        ),
        const Expanded(
          child: Column(
            children: [
              Text(
                'Choose Your Ride',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Multiple options for your journey',
                style: TextStyle(color: AppColors.muted, fontSize: 12.5),
              ),
            ],
          ),
        ),
        const SizedBox(width: 48),
      ],
    ),
  );

  Widget _routeMap() => Stack(
    children: [
      Container(
        height: 170,
        margin: const EdgeInsets.only(top: 120),
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/images/home-map-placeholder.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _RoutePainter())),
            const Positioned(
              left: 39,
              bottom: 22,
              child: _MapPin(color: AppColors.orange),
            ),
            const Positioned(
              right: 54,
              top: 24,
              child: _MapPin(color: AppColors.blue),
            ),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.blue,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '~ 8.4 km • 28 min',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
            Positioned(
              right: 16,
              bottom: 15,
              child: Container(
                width: 47,
                height: 47,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [
                    BoxShadow(color: Color(0x200A244A), blurRadius: 10),
                  ],
                ),
                child: const Icon(
                  Icons.my_location_rounded,
                  color: AppColors.navy,
                ),
              ),
            ),
          ],
        ),
      ),
      Positioned(
        left: 16,
        right: 16,
        top: 0,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 18, 15, 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(
                color: Color(0x180A244A),
                blurRadius: 16,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              const _RouteDots(),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _RouteText(title: _pickup, subtitle: 'Pickup location'),
                    const SizedBox(height: 20),
                    _RouteText(
                      title: _destination,
                      subtitle: 'Selected destination',
                    ),
                  ],
                ),
              ),
              TextButton.icon(
                onPressed: _editDestination,
                icon: const Icon(Icons.edit_outlined, size: 18),
                label: const Text('Edit'),
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

class _RouteText extends StatelessWidget {
  const _RouteText({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 14,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 2),
      Text(
        subtitle,
        style: const TextStyle(color: AppColors.muted, fontSize: 11.5),
      ),
    ],
  );
}

class _RouteDots extends StatelessWidget {
  const _RouteDots();

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 76,
    width: 18,
    child: Column(
      children: [
        const Icon(Icons.circle, color: AppColors.orange, size: 14),
        Expanded(
          child: CustomPaint(
            painter: _DottedLinePainter(),
            size: const Size(1, double.infinity),
          ),
        ),
        const Icon(Icons.circle, color: AppColors.blue, size: 14),
      ],
    ),
  );
}

class _DottedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF9AA6B8)
      ..strokeWidth = 1.5;
    for (double y = 2; y < size.height; y += 6) {
      canvas.drawLine(
        Offset(size.width / 2, y),
        Offset(size.width / 2, y + 3),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MapPin extends StatelessWidget {
  const _MapPin({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) => Icon(
    Icons.location_on_rounded,
    color: color,
    size: 38,
    shadows: const [Shadow(color: Colors.white, blurRadius: 5)],
  );
}

class _RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(55, size.height - 30)
      ..cubicTo(
        size.width * .28,
        size.height * .72,
        size.width * .52,
        size.height * .68,
        size.width * .53,
        size.height * .49,
      )
      ..cubicTo(
        size.width * .58,
        size.height * .27,
        size.width * .78,
        size.height * .32,
        size.width - 67,
        42,
      );
    canvas.drawPath(
      path,
      Paint()
        ..color = AppColors.blue
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RideCard extends StatelessWidget {
  const _RideCard({
    required this.ride,
    required this.selected,
    required this.onTap,
  });
  final _Ride ride;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(17),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      height: 94,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFFFF8F3) : Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(
          color: selected ? AppColors.orange : const Color(0xFFE0E5EC),
          width: selected ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 88,
            child: Image.asset(ride.image, fit: BoxFit.contain),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  ride.name,
                  style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  ride.description,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 11.5,
                  ),
                ),
                const SizedBox(height: 5),
                Row(
                  children: [
                    const Icon(
                      Icons.person_outline_rounded,
                      size: 16,
                      color: AppColors.muted,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      ride.seats,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.ac_unit_rounded,
                      size: 15,
                      color: AppColors.muted,
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        ride.detail,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 10.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                children: [
                  Text(
                    ride.price,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.muted,
                    size: 17,
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                ride.eta,
                style: const TextStyle(
                  color: Color(0xFF079447),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(width: 3),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    ),
  );
}

class _PricingNote extends StatelessWidget {
  const _PricingNote();

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.fromLTRB(16, 18, 16, 0),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FAF4),
      borderRadius: BorderRadius.circular(15),
    ),
    child: const Row(
      children: [
        CircleAvatar(
          backgroundColor: Color(0xFFE1F6E8),
          child: Icon(Icons.verified_user_outlined, color: Color(0xFF079447)),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fair & Transparent Pricing',
                style: TextStyle(
                  color: Color(0xFF087A3A),
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'No hidden charges. Final fare may vary slightly based on traffic.',
                style: TextStyle(color: AppColors.muted, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({
    required this.ride,
    required this.searching,
    required this.onContinue,
  });
  final _Ride ride;
  final bool searching;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      17,
      13,
      17,
      13 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      boxShadow: [
        BoxShadow(
          color: Color(0x190A244A),
          blurRadius: 14,
          offset: Offset(0, -3),
        ),
      ],
    ),
    child: Row(
      children: [
        const Icon(
          Icons.directions_car_outlined,
          color: AppColors.navy,
          size: 27,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Selected Vehicle',
                style: TextStyle(
                  color: AppColors.navy,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
              Text(
                '${ride.name} • ${ride.price}',
                style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
              ),
            ],
          ),
        ),
        SizedBox(
          width: 190,
          height: 54,
          child: FilledButton(
            onPressed: searching ? null : onContinue,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.orange,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      searching ? 'Starting Search...' : 'Search ${ride.name}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                if (!searching) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.search_rounded),
                ],
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _Ride {
  const _Ride({
    required this.name,
    required this.variant,
    required this.amount,
    required this.category,
    required this.description,
    required this.detail,
    required this.seats,
    required this.price,
    required this.eta,
    required this.image,
  });
  final String name;
  final String variant;
  final int amount;
  final String category;
  final String description;
  final String detail;
  final String seats;
  final String price;
  final String eta;
  final String image;
}
