import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

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
              title: 'Help & Support',
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
              children: const [
                _SupportHero(),
                SizedBox(height: 12),
                _QuickSupportPanel(),
                SizedBox(height: 12),
                _PopularTopicsPanel(),
                SizedBox(height: 12),
                _OtherResourcesPanel(),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _SupportHero extends StatelessWidget {
  const _SupportHero();

  @override
  Widget build(BuildContext context) => Container(
    height: 168,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: const Color(0xFFEEF5FF),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFDDE9FB)),
    ),
    child: Stack(
      children: [
        Positioned(
          right: -43,
          top: 0,
          bottom: -8,
          width: 235,
          child: Image.asset(
            'assets/images/support-agent-transparent.png',
            fit: BoxFit.contain,
            alignment: Alignment.bottomRight,
          ),
        ),
        Positioned(
          left: 17,
          top: 21,
          right: 150,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'How can we help you?',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 5),
              const Text(
                'Search for answers or choose a support option below.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 10.5,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),
              Container(
                height: 43,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0D102040),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      color: AppColors.muted,
                      size: 21,
                    ),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'Search for help topics...',
                        maxLines: 1,
                        style: TextStyle(
                          color: Color(0xFFA8AFC0),
                          fontSize: 10.5,
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

class _QuickSupportPanel extends StatelessWidget {
  const _QuickSupportPanel();
  static const items = [
    (
      Icons.call_rounded,
      'WhatsApp Support',
      'Message us on WhatsApp',
      '+91 98765 43210',
      Color(0xFF20A541),
    ),
    (
      Icons.phone_in_talk_outlined,
      'Call Us',
      'Talk to our support executive',
      '080-1234 5678',
      Color(0xFF9148DD),
    ),
    (
      Icons.mail_outline_rounded,
      'Email Us',
      'Send us an email anytime',
      'support@rjstours.in',
      Color(0xFFFF8A00),
    ),
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(8, 10, 8, 9),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Quick Support'),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(items.length, (i) {
            final item = items[i];
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i == items.length - 1 ? 0 : 7),
                padding: const EdgeInsets.fromLTRB(6, 10, 6, 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E7EF)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: item.$5.withValues(alpha: .1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(item.$1, color: item.$5, size: 24),
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      child: Text(
                        item.$2,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 28,
                      child: Text(
                        item.$3,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 8.5,
                          height: 1.3,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: item.$5.withValues(alpha: .07),
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: FittedBox(
                        child: Text(
                          item.$4,
                          style: TextStyle(
                            color: item.$5,
                            fontSize: 8.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ],
    ),
  );
}

class _PopularTopicsPanel extends StatelessWidget {
  const _PopularTopicsPanel();
  static const topics = [
    (
      Icons.confirmation_number_outlined,
      'Bookings & Cancellations',
      'How to book, modify or cancel your trip',
      AppColors.blue,
    ),
    (
      Icons.account_balance_wallet_outlined,
      'Payments & Refunds',
      'Payment methods, refunds and wallet related help',
      Color(0xFF20A541),
    ),
    (
      Icons.inventory_2_outlined,
      'Tours & Packages',
      'Details about tour packages and inclusions',
      Color(0xFFFF8A00),
    ),
    (
      Icons.person_outline_rounded,
      'Account & Profile',
      'Manage your account, profile and preferences',
      Color(0xFF9148DD),
    ),
    (
      Icons.directions_car_outlined,
      'Vehicles & Services',
      'Vehicle types, amenities and service related help',
      Color(0xFFE9465D),
    ),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Popular Help Topics'),
        const SizedBox(height: 7),
        ...List.generate(
          topics.length,
          (i) => _HelpRow(
            icon: topics[i].$1,
            color: topics[i].$4,
            title: topics[i].$2,
            subtitle: topics[i].$3,
            divider: i != topics.length - 1,
          ),
        ),
      ],
    ),
  );
}

class _OtherResourcesPanel extends StatelessWidget {
  const _OtherResourcesPanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        _Title('Other Resources'),
        SizedBox(height: 7),
        _HelpRow(
          icon: Icons.help_outline_rounded,
          color: AppColors.navy,
          title: 'FAQs',
          subtitle: 'Find answers to frequently asked questions',
        ),
        _HelpRow(
          icon: Icons.shield_outlined,
          color: AppColors.navy,
          title: 'Safety & Guidelines',
          subtitle: 'Travel safety, policies and guidelines',
        ),
        _HelpRow(
          icon: Icons.receipt_long_outlined,
          color: AppColors.navy,
          title: 'Terms & Conditions',
          subtitle: 'Read our terms, conditions and policies',
          divider: false,
        ),
      ],
    ),
  );
}

class _HelpRow extends StatelessWidget {
  const _HelpRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.divider = true,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final bool divider;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 9),
    decoration: BoxDecoration(
      border: divider
          ? const Border(bottom: BorderSide(color: Color(0xFFE7EAF0)))
          : null,
    ),
    child: Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .09),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(color: AppColors.muted, fontSize: 9),
              ),
            ],
          ),
        ),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.muted,
          size: 19,
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(10)});
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
      fontSize: 12.5,
      fontWeight: FontWeight.w800,
    ),
  );
}
