import 'package:flutter/material.dart';

import '../../../core/network/customer_auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/customer_logout.dart';
import '../../../shared/widgets/notification_popup.dart';
import 'personal_information_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _customer;

  @override
  void initState() {
    super.initState();
    _loadCustomer();
  }

  Future<void> _loadCustomer() async {
    final cached = await CustomerAuthService.getCachedCustomer();
    if (mounted && cached != null) setState(() => _customer = cached);
    final current = await CustomerAuthService.getMe();
    if (mounted && current != null) setState(() => _customer = current);
  }

  Future<void> _editPersonalInformation() async {
    final customer = _customer;
    if (customer == null) return;
    final updated = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => PersonalInformationScreen(customer: customer),
      ),
    );
    if (mounted && updated != null) setState(() => _customer = updated);
  }

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: 4,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (index) {
      if (index == 0 && Navigator.canPop(context)) Navigator.pop(context);
    },
    body: SafeArea(
      top: false,
      bottom: false,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              16,
              MediaQuery.paddingOf(context).top + 8,
              16,
              118 + MediaQuery.paddingOf(context).bottom,
            ),
            sliver: SliverList.list(
              children: [
                _ProfileHeader(onMenu: () => showRjsDrawer(context)),
                const SizedBox(height: 15),
                _ProfileCard(customer: _customer),
                const SizedBox(height: 12),
                const _BookingsPanel(),
                const SizedBox(height: 12),
                _SettingsPanel(
                  onPersonalInformation: _editPersonalInformation,
                  onAddresses: () =>
                      Navigator.pushNamed(context, '/saved-places'),
                ),
                const SizedBox(height: 12),
                const _LogoutButton(),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.onMenu});
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _HeaderIcon(icon: Icons.menu_rounded, onTap: onMenu),
      const SizedBox(width: 13),
      const Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'My Profile',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Manage your account and preferences',
              style: TextStyle(color: AppColors.muted, fontSize: 12.5),
            ),
          ],
        ),
      ),
      const _HeaderIcon(icon: Icons.settings_outlined),
      const SizedBox(width: 8),
      _HeaderIcon(
        icon: Icons.notifications_none_rounded,
        notification: true,
        onTap: () => showRjsNotifications(context),
      ),
    ],
  );
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({
    required this.icon,
    this.notification = false,
    this.onTap,
  });
  final IconData icon;
  final bool notification;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
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
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, color: AppColors.navy, size: 29),
          if (notification)
            Positioned(
              right: 7,
              top: 7,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppColors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.customer});

  final Map<String, dynamic>? customer;

  String get _phone {
    final raw = customer?['phone'] as String? ?? '';
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 12) {
      return '+${digits.substring(0, 2)} ${digits.substring(2, 7)} ${digits.substring(7)}';
    }
    return raw.isEmpty ? 'Mobile number' : raw;
  }

  @override
  Widget build(BuildContext context) => Container(
    height: 154,
    padding: const EdgeInsets.symmetric(horizontal: 18),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFDCE8FA)),
      gradient: const LinearGradient(
        colors: [Color(0xFFF1F6FF), Color(0xFFEAF3FF)],
      ),
      image: const DecorationImage(
        image: AssetImage('assets/images/profile-card-city-transparent.png'),
        fit: BoxFit.cover,
        alignment: Alignment.centerRight,
      ),
    ),
    child: Row(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 100,
              height: 100,
              padding: const EdgeInsets.all(7),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFDCEAFF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Color(0xFF679AF2),
                  size: 68,
                ),
              ),
            ),
            Positioned(
              right: -2,
              bottom: 5,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE0E6EF)),
                  boxShadow: const [
                    BoxShadow(color: Color(0x18000000), blurRadius: 6),
                  ],
                ),
                child: const Icon(
                  Icons.photo_camera_outlined,
                  color: AppColors.navy,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                customer?['name'] as String? ?? 'Loading...',
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 9),
              _ContactLine(Icons.phone_outlined, _phone),
              const SizedBox(height: 7),
              _ContactLine(
                Icons.mail_outline_rounded,
                (customer?['email'] as String?)?.isNotEmpty == true
                    ? customer!['email'] as String
                    : 'Email not added',
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _ContactLine extends StatelessWidget {
  const _ContactLine(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: AppColors.muted, size: 17),
      const SizedBox(width: 8),
      Flexible(
        child: Text(
          text,
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
      ),
    ],
  );
}

class _BookingsPanel extends StatelessWidget {
  const _BookingsPanel();
  static const bookings = [
    (Icons.calendar_month_outlined, 'Upcoming', '3', AppColors.blue),
    (Icons.directions_car_outlined, 'Completed', '112', Color(0xFF20963A)),
    (Icons.history_rounded, 'Cancelled', '13', AppColors.orange),
    (Icons.receipt_long_outlined, 'All Bookings', '128', Color(0xFF923FE1)),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('My Bookings'),
        const SizedBox(height: 15),
        Row(
          children: List.generate(
            bookings.length,
            (i) => Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: i == bookings.length - 1
                      ? null
                      : const Border(
                          right: BorderSide(color: Color(0xFFE1E6EF)),
                        ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: bookings[i].$4.withValues(alpha: .09),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        bookings[i].$1,
                        color: bookings[i].$4,
                        size: 23,
                      ),
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      child: Text(
                        bookings[i].$2,
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 9.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      bookings[i].$3,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
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

class _SettingsPanel extends StatelessWidget {
  const _SettingsPanel({
    required this.onPersonalInformation,
    required this.onAddresses,
  });

  final VoidCallback onPersonalInformation;
  final VoidCallback onAddresses;
  static const items = [
    (
      Icons.person_outline_rounded,
      'Personal Information',
      'Edit your personal details',
    ),
    (Icons.credit_card_outlined, 'Payment Methods', 'UPI, Cards & Wallet'),
    (Icons.location_on_outlined, 'Addresses', 'Saved addresses for pickups'),
    (
      Icons.notifications_none_rounded,
      'Notifications',
      'Manage your notification preferences',
    ),
    (
      Icons.security_outlined,
      'Privacy & Security',
      'Manage privacy and security settings',
    ),
    (
      Icons.support_agent_outlined,
      'Help & Support',
      'FAQs, support and contact us',
    ),
    (Icons.info_outline_rounded, 'About RJS Tours', 'App version 1.0.0'),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Account & Settings'),
        const SizedBox(height: 9),
        ...List.generate(
          items.length,
          (i) => InkWell(
            onTap: i == 0
                ? onPersonalInformation
                : i == 2
                ? onAddresses
                : null,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 9),
              decoration: BoxDecoration(
                border: i == items.length - 1
                    ? null
                    : const Border(
                        bottom: BorderSide(color: Color(0xFFE8EBF0)),
                      ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F5FF),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(items[i].$1, color: AppColors.blue, size: 19),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          items[i].$2,
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          items[i].$3,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.muted,
                    size: 20,
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

class _LogoutButton extends StatelessWidget {
  const _LogoutButton();
  @override
  Widget build(BuildContext context) => Container(
    height: 64,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0C102040),
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: TextButton.icon(
      onPressed: () => confirmCustomerLogout(context),
      icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 20),
      label: const Text(
        'Logout',
        style: TextStyle(
          color: Colors.red,
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(14)});
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
      fontSize: 13,
      fontWeight: FontWeight.w800,
    ),
  );
}
