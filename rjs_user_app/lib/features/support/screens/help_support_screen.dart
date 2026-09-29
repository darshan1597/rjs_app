import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

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
                'Choose a help topic or contact the RJS support team below.',
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
                      Icons.support_agent_rounded,
                      color: AppColors.muted,
                      size: 21,
                    ),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'Phone, WhatsApp and email support',
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

  Future<Map<String, String>> _config() async {
    try {
      final raw = await const MethodChannel('com.rjstours.customer/config')
          .invokeMapMethod<String, dynamic>('getSupportConfig');
      return {
        'phone': raw?['phone']?.toString() ?? '',
        'email': raw?['email']?.toString() ?? 'support@rjstours.in',
      };
    } catch (_) {
      return const {'phone': '', 'email': 'support@rjstours.in'};
    }
  }

  Future<void> _launch(BuildContext context, Uri uri) async {
    try {
      if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    } catch (_) {
      // The same friendly message is shown for missing or unavailable apps.
    }
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No compatible app was found on this phone.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(8, 10, 8, 9),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Quick Support'),
        const SizedBox(height: 10),
        FutureBuilder<Map<String, String>>(
          future: _config(),
          builder: (context, snapshot) {
            final phone = snapshot.data?['phone'] ?? '';
            final email = snapshot.data?['email'] ?? 'support@rjstours.in';
            final displayPhone = phone.isEmpty ? 'Not configured' : '+$phone';
            final items = [
              (
                Icons.call_rounded,
                'WhatsApp Support',
                'Message us on WhatsApp',
                displayPhone,
                const Color(0xFF20A541),
                phone.isEmpty ? null : Uri.parse('https://wa.me/$phone'),
              ),
              (
                Icons.phone_in_talk_outlined,
                'Call Us',
                'Talk to our support executive',
                displayPhone,
                const Color(0xFF9148DD),
                phone.isEmpty ? null : Uri(scheme: 'tel', path: phone),
              ),
              (
                Icons.mail_outline_rounded,
                'Email Us',
                'Send us an email anytime',
                email,
                const Color(0xFFFF8A00),
                Uri(
                  scheme: 'mailto',
                  path: email,
                  queryParameters: const {'subject': 'RJS customer support'},
                ),
              ),
            ];
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: List.generate(items.length, (i) {
                final item = items[i];
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: i == items.length - 1 ? 0 : 7,
                    ),
                    child: Material(
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: const BorderSide(color: Color(0xFFE2E7EF)),
                      ),
                      child: InkWell(
                        onTap: item.$6 == null
                            ? null
                            : () => _launch(context, item.$6!),
                        borderRadius: BorderRadius.circular(10),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(6, 10, 6, 8),
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
                      ),
                    ),
                  ),
                );
              }),
            );
          },
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
            onTap: () => _showTopic(context, topics[i].$2, topics[i].$3),
          ),
        ),
      ],
    ),
  );

  void _showTopic(BuildContext context, String title, String message) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                message,
                style: const TextStyle(color: AppColors.muted, height: 1.5),
              ),
              const SizedBox(height: 12),
              const Text(
                'For help with a specific ride, keep the booking number ready and contact RJS support above.',
                style: TextStyle(color: AppColors.navy, height: 1.45),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OtherResourcesPanel extends StatelessWidget {
  const _OtherResourcesPanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Other Resources'),
        const SizedBox(height: 7),
        _HelpRow(
          icon: Icons.help_outline_rounded,
          color: AppColors.navy,
          title: 'FAQs',
          subtitle: 'Find answers to frequently asked questions',
          onTap: () => _showResource(
            context,
            'FAQs',
            'Common questions about bookings, payments and your account can be handled from the related help topics above.',
          ),
        ),
        _HelpRow(
          icon: Icons.shield_outlined,
          color: AppColors.navy,
          title: 'Safety & Guidelines',
          subtitle: 'Travel safety, policies and guidelines',
          onTap: () => _showResource(
            context,
            'Safety & Guidelines',
            'Verify the vehicle and driver shown in the app, never share your trip OTP before entering the vehicle, and call 112 in an emergency.',
          ),
        ),
        _HelpRow(
          icon: Icons.receipt_long_outlined,
          color: AppColors.navy,
          title: 'Terms & Conditions',
          subtitle: 'Read our terms, conditions and policies',
          divider: false,
          onTap: () => _showResource(
            context,
            'Terms & Conditions',
            'The production terms and privacy-policy URLs must be configured before publishing the app.',
          ),
        ),
      ],
    ),
  );

  void _showResource(BuildContext context, String title, String message) =>
      showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
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
    this.onTap,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final bool divider;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Container(
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
