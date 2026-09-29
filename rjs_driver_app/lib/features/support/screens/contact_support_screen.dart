import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';

const _configChannel = MethodChannel('rjs.driver/config');

class ContactSupportScreen extends StatefulWidget {
  const ContactSupportScreen({super.key});

  @override
  State<ContactSupportScreen> createState() => _ContactSupportScreenState();
}

class _ContactSupportScreenState extends State<ContactSupportScreen> {
  bool _isOnline = true;

  void _selectTab(int index) {
    final Widget? page = switch (index) {
      0 => const DriverHomeScreen(),
      1 => const ScheduledRidesScreen(),
      3 => const EarningsScreen(),
      4 => const DriverProfileScreen(),
      _ => null,
    };
    if (page != null) {
      Navigator.of(context)
          .pushReplacement(MaterialPageRoute<void>(builder: (_) => page));
    }
  }

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
    child: Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            17,
            8,
            17,
            24 + MediaQuery.paddingOf(context).bottom,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Header(onBack: () => Navigator.of(context).pop()),
              const SizedBox(height: 17),
              const _SupportBanner(),
              const SizedBox(height: 20),
              const Text(
                'How would you like to get help?',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 13),
              const Row(
                children: [
                  Expanded(
                    child: _ContactMethod(
                      icon: Icons.phone_in_talk_outlined,
                      title: 'Call Support',
                      subtitle: '24/7 Available',
                      action: 'phone',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _ContactMethod(
                      icon: Icons.phone_rounded,
                      title: 'WhatsApp',
                      subtitle: 'Quick Response',
                      action: 'whatsapp',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _ContactMethod(
                      icon: Icons.mail_outline_rounded,
                      title: 'Email Us',
                      subtitle: 'support@rjs.com',
                      action: 'email',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              const _EmergencyCard(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: DriverBottomBar(
        selectedIndex: 4,
        isOnline: _isOnline,
        onSelected: _selectTab,
        onStatusTap: () => setState(() => _isOnline = !_isOnline),
      ),
    ),
  );
}

class _Header extends StatelessWidget {
  const _Header({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          onTap: onBack,
          customBorder: const CircleBorder(),
          child: const SizedBox(
            width: 43,
            height: 43,
            child: Icon(
              Icons.arrow_back_rounded,
              color: AppColors.navy,
              size: 25,
            ),
          ),
        ),
      ),
      const SizedBox(width: 13),
      const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact Support',
            style: TextStyle(
              color: AppColors.navy,
              fontSize: 21,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            "We're here to help you 24/7",
            style: TextStyle(color: AppColors.muted, fontSize: 11),
          ),
        ],
      ),
    ],
  );
}

class _SupportBanner extends StatelessWidget {
  const _SupportBanner();

  @override
  Widget build(BuildContext context) => Container(
    height: 132,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: const Color(0xFFF4FBF7),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFDCEEE3)),
    ),
    child: Stack(
      children: [
        const Positioned(
          left: 17,
          top: 25,
          child: CircleAvatar(
            radius: 31,
            backgroundColor: Colors.white,
            child: Icon(
              Icons.headset_mic_outlined,
              color: AppColors.green,
              size: 34,
            ),
          ),
        ),
        const Positioned(
          left: 91,
          top: 29,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Need help?',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 7),
              SizedBox(
                width: 145,
                child: Text(
                  'Choose a way to connect with our support team',
                  style: TextStyle(
                    color: AppColors.muted,
                    fontSize: 10.5,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        Positioned(
          right: -2,
          bottom: -11,
          width: 154,
          height: 132,
          child: Image.asset(
            'assets/images/support-agent-transparent.png',
            fit: BoxFit.contain,
            alignment: Alignment.bottomRight,
          ),
        ),
      ],
    ),
  );
}

class _ContactMethod extends StatelessWidget {
  const _ContactMethod({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.action,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String action;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: () => _launchContact(context, action),
    borderRadius: BorderRadius.circular(13),
    child: Container(
    height: 112,
    padding: const EdgeInsets.symmetric(horizontal: 5),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 12,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: AppColors.green, size: 31),
        const SizedBox(height: 10),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            subtitle,
            style: const TextStyle(
              color: AppColors.green,
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
    ),
  );
}

class _EmergencyCard extends StatelessWidget {
  const _EmergencyCard();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF8F8),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: const Color(0xFFFFAEB5)),
    ),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 19,
          backgroundColor: Color(0xFFFFE5E7),
          child: Icon(Icons.shield_rounded, color: AppColors.red, size: 21),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Emergency Help',
                style: TextStyle(
                  color: AppColors.red,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'For immediate assistance or safety concerns',
                style: TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        OutlinedButton.icon(
          onPressed: () => _launchContact(context, 'tel:112'),
          icon: const Icon(Icons.phone_outlined, size: 17),
          label: const Text('Call SOS'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.red,
            side: const BorderSide(color: Color(0xFFFFB4BA)),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            textStyle: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    ),
  );
}

Future<void> _launchContact(BuildContext context, String target) async {
  try {
    final config = await _configChannel.invokeMapMethod<String, dynamic>('support') ?? const {};
    final supportPhone = config['phone']?.toString() ?? '';
    final supportEmail = config['email']?.toString() ?? 'support@rjs.com';
    if ((target == 'phone' || target == 'whatsapp') && supportPhone.isEmpty) {
      throw Exception('RJS support number is not configured');
    }
    final cleanPhone = supportPhone.replaceAll(RegExp(r'[^0-9]'), '');
    final destination = switch (target) {
      'phone' => 'tel:$supportPhone',
      'whatsapp' => 'https://wa.me/$cleanPhone',
      'email' => 'mailto:$supportEmail',
      _ => target,
    };
    final launched = await launchUrl(
      Uri.parse(destination),
      mode: LaunchMode.externalApplication,
    );
    if (!launched) throw Exception('No compatible app was found');
  } catch (error) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Unable to open contact option: $error')),
    );
  }
}
