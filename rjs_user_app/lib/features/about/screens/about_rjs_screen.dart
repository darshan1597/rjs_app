import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';

class AboutRjsScreen extends StatefulWidget {
  const AboutRjsScreen({super.key});

  @override
  State<AboutRjsScreen> createState() => _AboutRjsScreenState();
}

class _AboutRjsScreenState extends State<AboutRjsScreen> {
  bool _storyExpanded = false;

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: -1,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (_) {},
    body: SafeArea(
      top: false,
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: AppPageHeader(
              title: 'About RJS',
              onMenuTap: () => showRjsDrawer(context),
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              16,
              12,
              16,
              118 + MediaQuery.paddingOf(context).bottom,
            ),
            sliver: SliverList.list(
              children: [
                const _AboutHero(),
                const SizedBox(height: 11),
                const _StatsPanel(),
                const SizedBox(height: 11),
                _StoryPanel(
                  expanded: _storyExpanded,
                  onToggle: () =>
                      setState(() => _storyExpanded = !_storyExpanded),
                ),
                const SizedBox(height: 11),
                const _MissionVisionPanel(),
                const SizedBox(height: 11),
                const _OfferPanel(),
                const SizedBox(height: 11),
                const _WhyChoosePanel(),
                const SizedBox(height: 11),
                const _ContactPanel(),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _AboutHero extends StatelessWidget {
  const _AboutHero();

  @override
  Widget build(BuildContext context) => Container(
    height: 170,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: const Color(0xFFF2F7FF),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFDDE8F8)),
    ),
    child: Stack(
      children: [
        Positioned(
          right: 0,
          bottom: 0,
          width: 235,
          height: 170,
          child: Image.asset(
            'assets/images/about-fleet-banner.png',
            fit: BoxFit.cover,
            alignment: Alignment.centerRight,
          ),
        ),
        const Positioned(
          left: 17,
          top: 24,
          right: 185,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'RJS Tours',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'Your Journey, Our Priority',
                style: TextStyle(
                  color: AppColors.orange,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 11),
              Text(
                'Making every journey safe, comfortable and memorable.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 10.5,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        Positioned(
          left: 17,
          bottom: 14,
          child: Container(
            width: 38,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.orange,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ],
    ),
  );
}

class _StatsPanel extends StatelessWidget {
  const _StatsPanel();
  static const stats = [
    (
      Icons.workspace_premium_outlined,
      '5+',
      'Years of Service',
      AppColors.blue,
    ),
    (Icons.groups_2_outlined, '10K+', 'Happy Customers', AppColors.orange),
    (Icons.map_outlined, '500+', 'Routes Covered', AppColors.blue),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      children: List.generate(
        stats.length,
        (i) => Expanded(
          child: Container(
            decoration: BoxDecoration(
              border: i == stats.length - 1
                  ? null
                  : const Border(right: BorderSide(color: Color(0xFFE2E6ED))),
            ),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: stats[i].$4.withValues(alpha: .09),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(stats[i].$1, color: stats[i].$4, size: 22),
                ),
                const SizedBox(height: 7),
                Text(
                  stats[i].$2,
                  style: TextStyle(
                    color: stats[i].$4,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                FittedBox(
                  child: Text(
                    stats[i].$3,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 8.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _StoryPanel extends StatelessWidget {
  const _StoryPanel({required this.expanded, required this.onToggle});
  final bool expanded;
  final VoidCallback onToggle;
  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _Title('Our Story'),
              const SizedBox(height: 7),
              AnimatedSize(
                duration: const Duration(milliseconds: 320),
                curve: Curves.easeOutCubic,
                alignment: Alignment.topCenter,
                child: Text(
                  expanded
                      ? 'RJS Tours began with a simple goal—to provide reliable and affordable travel solutions for everyone. Over the years, we have grown with the trust and support of our customers and partners. Today, we connect travellers with carefully maintained vehicles, experienced drivers and thoughtfully designed journeys across cities and destinations. What started as a small commitment has become a promise to make every trip safer, simpler and more memorable.'
                      : 'RJS Tours began with a simple goal—to provide reliable and affordable travel solutions for everyone. Over the years, we have grown with the trust and support of our customers and partners.',
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 10,
                    height: 1.48,
                  ),
                ),
              ),
              const SizedBox(height: 3),
              InkWell(
                onTap: onToggle,
                borderRadius: BorderRadius.circular(6),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        expanded ? 'Read Less' : 'Read More',
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 3),
                      AnimatedRotation(
                        turns: expanded ? .5 : 0,
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
        ),
        const SizedBox(width: 12),
        Container(
          width: 88,
          height: 88,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: const Color(0xFFE1E8F3)),
          ),
          child: Image.asset(
            'assets/images/about-story-road.png',
            fit: BoxFit.cover,
          ),
        ),
      ],
    ),
  );
}

class _MissionVisionPanel extends StatelessWidget {
  const _MissionVisionPanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Our Mission & Vision'),
        const SizedBox(height: 10),
        Row(
          children: const [
            Expanded(
              child: _PurposeCard(
                icon: Icons.track_changes_rounded,
                color: AppColors.orange,
                title: 'Our Mission',
                text: 'To deliver safe, reliable and customer-centric travel experiences through innovation and excellence.',
              ),
            ),
            SizedBox(width: 9),
            Expanded(
              child: _PurposeCard(
                icon: Icons.visibility_outlined,
                color: AppColors.blue,
                title: 'Our Vision',
                text: 'To become the most trusted travel partner, connecting people and places seamlessly.',
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _PurposeCard extends StatelessWidget {
  const _PurposeCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.text,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    height: 102,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .055),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: color.withValues(alpha: .13)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                text,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 8.5,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _OfferPanel extends StatelessWidget {
  const _OfferPanel();
  static const offers = [
    (Icons.directions_car_outlined, 'One Way &\nRound Trips', AppColors.blue),
    (Icons.airport_shuttle_outlined, 'Outstation\nTrips', AppColors.orange),
    (Icons.calendar_month_outlined, 'Tour\nPackages', AppColors.blue),
    (Icons.car_rental_outlined, 'Rental\nServices', AppColors.orange),
    (Icons.support_agent_outlined, '24/7 Customer\nSupport', AppColors.blue),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('What We Offer'),
        const SizedBox(height: 11),
        Row(
          children: List.generate(
            offers.length,
            (i) => Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: i == offers.length - 1
                      ? null
                      : const Border(
                          right: BorderSide(color: Color(0xFFE2E6ED)),
                        ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: offers[i].$3.withValues(alpha: .09),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(offers[i].$1, color: offers[i].$3, size: 20),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      offers[i].$2,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 8.2,
                        height: 1.3,
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
  );
}

class _WhyChoosePanel extends StatelessWidget {
  const _WhyChoosePanel();
  static const reasons = [
    'Verified Drivers',
    'Well Maintained Vehicles',
    'Transparent Pricing',
    'On-time Service',
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Why Choose RJS?'),
        const SizedBox(height: 10),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: reasons.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
              decoration: BoxDecoration(
                color: (i.isEven ? AppColors.blue : AppColors.orange)
                    .withValues(alpha: .065),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    color: i.isEven ? AppColors.blue : AppColors.orange,
                    size: 14,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    reasons[i],
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _ContactPanel extends StatelessWidget {
  const _ContactPanel();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFFF0F6FF), Color(0xFFFFF2E8)],
      ),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: const Color(0xFFDDE6F3)),
    ),
    child: Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.blue, Color(0xFF4387EF)],
            ),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.headset_mic_outlined,
            color: Colors.white,
            size: 25,
          ),
        ),
        const SizedBox(width: 11),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Have questions?',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 3),
              Text(
                "We're here to help you. Reach out anytime.",
                style: TextStyle(color: AppColors.muted, fontSize: 9),
              ),
            ],
          ),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pushNamed('/help-support'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.orange,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(9),
            ),
            textStyle: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          child: const Text('Contact Support'),
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
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
