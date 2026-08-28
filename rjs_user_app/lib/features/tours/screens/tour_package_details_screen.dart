import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class TourPackageDetailsScreen extends StatefulWidget {
  const TourPackageDetailsScreen({super.key});

  @override
  State<TourPackageDetailsScreen> createState() =>
      _TourPackageDetailsScreenState();
}

class _TourPackageDetailsScreenState extends State<TourPackageDetailsScreen> {
  bool _favorite = false;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      backgroundColor: const Color(0xFFFBFCFF),
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: EdgeInsets.fromLTRB(12, 10, 12, 124 + bottomInset),
              sliver: SliverList.list(
                children: [
                  _Header(
                    favorite: _favorite,
                    onBack: () => Navigator.pop(context),
                    onFavorite: () => setState(() => _favorite = !_favorite),
                  ),
                  const SizedBox(height: 12),
                  const _HeroCard(),
                  const SizedBox(height: 10),
                  const _FactsPanel(),
                  const SizedBox(height: 10),
                  const _AboutPanel(),
                  const SizedBox(height: 10),
                  const _ItineraryPanel(),
                  const SizedBox(height: 10),
                  const _InclusionsPanel(),
                  const SizedBox(height: 10),
                  const _VehiclePanel(),
                  const SizedBox(height: 10),
                  const _NotesPanel(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _BookingBar(bottomInset: bottomInset),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.favorite,
    required this.onBack,
    required this.onFavorite,
  });
  final bool favorite;
  final VoidCallback onBack;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 62,
    child: Row(
      children: [
        _HeaderButton(icon: Icons.arrow_back_rounded, onTap: onBack),
        const SizedBox(width: 14),
        const Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tour Package Details',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Bangalore City Tour',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
            ],
          ),
        ),
        _HeaderButton(
          icon: favorite ? Icons.favorite : Icons.favorite_border_rounded,
          color: favorite ? AppColors.orange : AppColors.blue,
          onTap: onFavorite,
        ),
        const SizedBox(width: 8),
        _HeaderButton(
          icon: Icons.ios_share_rounded,
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Sharing will be available soon.')),
          ),
        ),
      ],
    ),
  );
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({required this.icon, required this.onTap, this.color});
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    elevation: 3,
    shadowColor: Colors.black12,
    borderRadius: BorderRadius.circular(12),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 46,
        height: 46,
        child: Icon(icon, color: color ?? AppColors.navy, size: 26),
      ),
    ),
  );
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context) => AspectRatio(
    aspectRatio: 2.32,
    child: ClipRRect(
      borderRadius: BorderRadius.circular(15),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/tour-bangalore.png', fit: BoxFit.cover),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.center,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0xCC000000)],
              ),
            ),
          ),
          Positioned(
            left: 12,
            top: 12,
            child: _Pill(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: AppColors.blue,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 7),
                  const Text(
                    'One Day Tour',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Positioned(
            left: 12,
            right: 12,
            bottom: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bangalore City Tour',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Explore the best of Bangalore in a day',
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
              ],
            ),
          ),
          Positioned(
            right: 10,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black54,
                border: Border.all(color: Colors.white70),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.photo_library_outlined,
                    color: Colors.white,
                    size: 13,
                  ),
                  SizedBox(width: 5),
                  Text(
                    '1/12',
                    style: TextStyle(color: Colors.white, fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _FactsPanel extends StatelessWidget {
  const _FactsPanel();

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
    child: const Row(
      children: [
        Expanded(
          child: _Fact(
            Icons.schedule_rounded,
            AppColors.blue,
            'Duration',
            '8 Hours',
          ),
        ),
        _Divider(),
        Expanded(
          child: _Fact(
            Icons.directions_car_rounded,
            Color(0xFF2D9B43),
            'Total Distance',
            '120 KM',
          ),
        ),
        _Divider(),
        Expanded(
          child: _Fact(
            Icons.person_outline_rounded,
            Color(0xFF9747E5),
            'Ideal For',
            '1 - 4 People',
          ),
        ),
        _Divider(),
        Expanded(
          child: _Fact(
            Icons.support_agent_rounded,
            AppColors.orange,
            'Driver',
            'Included',
          ),
        ),
      ],
    ),
  );
}

class _Fact extends StatelessWidget {
  const _Fact(this.icon, this.color, this.label, this.value);
  final IconData icon;
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 19),
      ),
      const SizedBox(height: 6),
      FittedBox(
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.muted,
            fontSize: 9,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      const SizedBox(height: 2),
      FittedBox(
        child: Text(
          value,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    ],
  );
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 54, color: const Color(0xFFE4E8EF));
}

class _AboutPanel extends StatefulWidget {
  const _AboutPanel();

  @override
  State<_AboutPanel> createState() => _AboutPanelState();
}

class _AboutPanelState extends State<_AboutPanel> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('About This Tour'),
        const SizedBox(height: 6),
        AnimatedSize(
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
          alignment: Alignment.topCenter,
          child: Text(
            _expanded
                ? "Discover Bangalore's most famous attractions in this wholesome one-day tour. From historical landmarks to beautiful gardens and vibrant neighbourhoods, experience the city's charm in complete comfort. Your driver stays with you throughout the journey, so you can spend more time exploring and less time planning routes or finding parking. The itinerary is flexible and can be adjusted to suit your pace, meal breaks and interests."
                : "Discover Bangalore's most famous attractions in this wholesome one-day tour. From historical landmarks to beautiful gardens and vibrant spots – experience the city's charm with comfort.",
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 10.5,
              height: 1.45,
            ),
          ),
        ),
        const SizedBox(height: 3),
        InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _expanded ? 'Read Less' : 'Read More',
                  style: const TextStyle(
                    color: AppColors.blue,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 4),
                AnimatedRotation(
                  turns: _expanded ? .5 : 0,
                  duration: const Duration(milliseconds: 250),
                  child: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppColors.blue,
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _ItineraryPanel extends StatelessWidget {
  const _ItineraryPanel();
  static const names = [
    'Vidhana Soudha',
    'Lalbagh Botanical\nGarden',
    'ISKCON Temple',
    'Cubbon Park',
    'Commercial Street',
  ];
  static const times = [
    '9:00 AM - 9:45 AM',
    '10:00 AM - 11:30 AM',
    '12:00 PM - 1:00 PM',
    '2:00 PM - 3:00 PM',
    '4:00 PM - 5:00 PM',
  ];
  static const descriptions = [
    'Admire Karnataka’s grand legislature and its iconic neo-Dravidian architecture.',
    'Walk through the historic glasshouse, flower gardens and peaceful green paths.',
    'Visit the hilltop temple complex known for its ornate shrines and calm atmosphere.',
    'Relax among shaded avenues, heritage buildings and Bengaluru’s green heart.',
    'Finish with colourful shops, local flavours and one of the city’s liveliest streets.',
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle("Places You'll Visit"),
        const SizedBox(height: 12),
        Stack(
          children: [
            const Positioned(
              left: 37,
              top: 38,
              bottom: 38,
              child: _JourneyProgressLine(),
            ),
            Column(
              children: List.generate(
                names.length,
                (i) => _ScrollReveal(
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: i == names.length - 1 ? 0 : 15,
                    ),
                    child: _Stop(
                      index: i,
                      name: names[i],
                      time: times[i],
                      description: descriptions[i],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFF0F6FF),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.blue, size: 14),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  'The above is a suggested itinerary. Timings may vary based on your preference.',
                  style: TextStyle(color: AppColors.muted, fontSize: 9),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Stop extends StatelessWidget {
  const _Stop({
    required this.index,
    required this.name,
    required this.time,
    required this.description,
  });
  final int index;
  final String name;
  final String time;
  final String description;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFD9E6F8)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14075AC9),
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: _StripCrop(index: index, size: 68),
          ),
          Positioned(
            left: -2,
            top: -2,
            child: Container(
              width: 21,
              height: 21,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppColors.blue,
                shape: BoxShape.circle,
              ),
              child: Text(
                '${index + 1}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
      const SizedBox(width: 13),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              name,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              description,
              style: const TextStyle(
                color: AppColors.muted,
                fontSize: 9.5,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(
                  Icons.schedule_rounded,
                  color: AppColors.blue,
                  size: 12,
                ),
                const SizedBox(width: 4),
                Text(
                  time,
                  style: const TextStyle(
                    color: AppColors.blue,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ],
  );
}

class _StripCrop extends StatelessWidget {
  const _StripCrop({required this.index, required this.size});
  final int index;
  final double size;

  @override
  Widget build(BuildContext context) => ClipOval(
    child: SizedBox(
      width: size,
      height: size,
      child: OverflowBox(
        alignment: Alignment(-1 + index * .5, 0),
        minWidth: size * 5,
        maxWidth: size * 5,
        minHeight: size,
        maxHeight: size,
        child: Image.asset(
          'assets/images/tour-itinerary-strip.png',
          width: size * 5,
          height: size,
          fit: BoxFit.cover,
        ),
      ),
    ),
  );
}

class _ScrollReveal extends StatelessWidget {
  const _ScrollReveal({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final position = Scrollable.of(context).position;
    return AnimatedBuilder(
      animation: position,
      child: child,
      builder: (context, child) {
        final render = context.findRenderObject();
        var amount = 1.0;
        if (render is RenderBox && render.hasSize) {
          final top = render.localToGlobal(Offset.zero).dy;
          final viewport = MediaQuery.sizeOf(context).height;
          amount = ((viewport - top - 45) / 125).clamp(0.0, 1.0);
        }
        return Opacity(
          opacity: amount,
          child: Transform.translate(
            offset: Offset(0, 24 * (1 - amount)),
            child: child,
          ),
        );
      },
    );
  }
}

class _JourneyProgressLine extends StatelessWidget {
  const _JourneyProgressLine();

  @override
  Widget build(BuildContext context) {
    final position = Scrollable.of(context).position;
    return AnimatedBuilder(
      animation: position,
      builder: (context, _) {
        final render = context.findRenderObject();
        var progress = 0.0;
        if (render is RenderBox && render.hasSize) {
          final top = render.localToGlobal(Offset.zero).dy;
          final trigger = MediaQuery.sizeOf(context).height * .68;
          progress = ((trigger - top) / render.size.height).clamp(0.0, 1.0);
        }
        return CustomPaint(
          size: const Size(3, double.infinity),
          painter: _VerticalRoutePainter(progress: progress),
        );
      },
    );
  }
}

class _VerticalRoutePainter extends CustomPainter {
  const _VerticalRoutePainter({required this.progress});
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final track = Paint()
      ..color = const Color(0xFFD4DFEF)
      ..strokeWidth = 2;
    for (double y = 0; y < size.height; y += 8) {
      canvas.drawLine(
        Offset(1.5, y),
        Offset(1.5, (y + 4).clamp(0, size.height)),
        track,
      );
    }
    canvas.drawLine(
      const Offset(1.5, 0),
      Offset(1.5, size.height * progress),
      Paint()
        ..color = AppColors.blue
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _VerticalRoutePainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _InclusionsPanel extends StatelessWidget {
  const _InclusionsPanel();
  @override
  Widget build(BuildContext context) => const _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('Tour Inclusions'),
        SizedBox(height: 9),
        Row(
          children: [
            Expanded(
              child: _Inclusion(
                Icons.directions_car_rounded,
                'Car',
                'AC Vehicle',
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _Inclusion(
                Icons.support_agent_rounded,
                'Driver',
                'Experienced',
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _Inclusion(
                Icons.local_gas_station_rounded,
                'Fuel',
                'Included',
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _Inclusion(
                Icons.local_parking_rounded,
                'Toll & Parking',
                'Included',
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _Inclusion(
                Icons.receipt_long_rounded,
                'Taxes',
                'All Taxes',
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _Inclusion extends StatelessWidget {
  const _Inclusion(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 7),
    decoration: BoxDecoration(
      border: Border.all(color: const Color(0xFFE0E5ED)),
      borderRadius: BorderRadius.circular(7),
    ),
    child: Row(
      children: [
        Container(
          width: 25,
          height: 25,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF8EC),
            borderRadius: BorderRadius.circular(7),
          ),
          child: Icon(icon, color: const Color(0xFF25983A), size: 15),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 7.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                subtitle,
                maxLines: 1,
                style: const TextStyle(color: AppColors.muted, fontSize: 6.5),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _VehiclePanel extends StatelessWidget {
  const _VehiclePanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('Vehicle Type'),
        const SizedBox(height: 8),
        Row(
          children: [
            Image.asset(
              'assets/images/ride-sedan.png',
              width: 86,
              height: 55,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Any Car',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    'Sedan / Hatchback / SUV',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                  SizedBox(height: 6),
                  Wrap(
                    spacing: 9,
                    runSpacing: 3,
                    children: [
                      _Trait(Icons.ac_unit_rounded, 'AC'),
                      _Trait(
                        Icons.health_and_safety_outlined,
                        'Clean & Sanitized',
                      ),
                      _Trait(
                        Icons.settings_suggest_outlined,
                        'Well Maintained',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.directions_car_outlined, size: 15),
              label: const Text('Change Vehicle'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.blue,
                side: const BorderSide(color: AppColors.blue),
                padding: const EdgeInsets.symmetric(horizontal: 9),
                textStyle: const TextStyle(
                  fontSize: 8.5,
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

class _Trait extends StatelessWidget {
  const _Trait(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, color: AppColors.muted, size: 12),
      const SizedBox(width: 3),
      Text(text, style: const TextStyle(color: AppColors.muted, fontSize: 7.5)),
    ],
  );
}

class _NotesPanel extends StatelessWidget {
  const _NotesPanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionTitle('Important Notes'),
              SizedBox(height: 6),
              Text(
                '•  Package price is for the entire vehicle, not per person.\n•  Entry tickets / personal expenses / meals are not included.\n•  Extra kilometer charges will apply if you exceed the package limit.\n•  Pickup and drop will be at the same location.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 9,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 94,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF5DE),
            border: Border.all(color: const Color(0xFFFFDF9A)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.verified_user_outlined,
                color: Color(0xFFFFA400),
                size: 23,
              ),
              SizedBox(width: 6),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Safe & Trusted',
                      style: TextStyle(
                        color: Color(0xFFD87D00),
                        fontSize: 8.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Your safety is our priority',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: 7.5,
                        height: 1.35,
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

class _BookingBar extends StatelessWidget {
  const _BookingBar({required this.bottomInset});
  final double bottomInset;
  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(20, 10, 20, 10 + bottomInset),
    decoration: const BoxDecoration(
      color: Colors.white,
      boxShadow: [
        BoxShadow(
          color: Color(0x16000000),
          blurRadius: 14,
          offset: Offset(0, -3),
        ),
      ],
    ),
    child: Row(
      children: [
        const SizedBox(
          width: 158,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Total Package Price',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    '₹2,499',
                    style: TextStyle(
                      color: AppColors.blue,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      '(All taxes included)',
                      maxLines: 1,
                      style: TextStyle(color: AppColors.muted, fontSize: 8),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 48,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0861ED),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Book This Package',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Spacer(),
                      Icon(Icons.arrow_forward_rounded),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 5),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.verified_user_outlined,
                    color: AppColors.blue,
                    size: 12,
                  ),
                  SizedBox(width: 4),
                  Text(
                    'Free Cancellation up to 24 hrs',
                    style: TextStyle(color: AppColors.muted, fontSize: 8.5),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(12)});
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0A102040),
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: child,
  );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: AppColors.navy,
      fontSize: 12,
      fontWeight: FontWeight.w800,
    ),
  );
}

class _Pill extends StatelessWidget {
  const _Pill({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
    ),
    child: child,
  );
}
