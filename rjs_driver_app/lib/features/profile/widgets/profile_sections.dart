import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../support/screens/contact_support_screen.dart';

const _sectionTitle = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

class DriverIdentityCard extends StatelessWidget {
  const DriverIdentityCard({super.key});

  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      children: [
        SizedBox(
          width: 92,
          height: 92,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: AppColors.green,
                  shape: BoxShape.circle,
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/driver-ramesh.png',
                    width: 86,
                    height: 86,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                right: -1,
                bottom: 4,
                child: CircleAvatar(
                  radius: 14,
                  backgroundColor: AppColors.green,
                  child: const Icon(
                    Icons.camera_alt_rounded,
                    color: Colors.white,
                    size: 15,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Ramesh',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 8),
                  Flexible(child: _VerifiedChip()),
                ],
              ),
              SizedBox(height: 7),
              Row(
                children: [
                  Icon(Icons.star_rounded, color: Color(0xFFFFB000), size: 18),
                  SizedBox(width: 5),
                  Text(
                    '4.8  ·  128 Trips',
                    style: TextStyle(color: AppColors.navy, fontSize: 11),
                  ),
                ],
              ),
              SizedBox(height: 7),
              _ContactLine(Icons.phone_outlined, '+91 98765 43210'),
              SizedBox(height: 6),
              _ContactLine(Icons.mail_outline_rounded, 'ramesh.driver@rjs.com'),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: AppColors.navy, size: 25),
      ],
    ),
  );
}

class _VerifiedChip extends StatelessWidget {
  const _VerifiedChip();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
    decoration: BoxDecoration(
      color: AppColors.green.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(14),
    ),
    child: const Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.verified_user_rounded, color: AppColors.green, size: 14),
        SizedBox(width: 4),
        Flexible(
          child: Text(
            'Verified Driver',
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.green,
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
            ),
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
      Icon(icon, color: AppColors.muted, size: 16),
      const SizedBox(width: 7),
      Flexible(
        child: Text(
          text,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.muted, fontSize: 10.5),
        ),
      ),
    ],
  );
}

class DriverVehicleCard extends StatelessWidget {
  const DriverVehicleCard({super.key});

  @override
  Widget build(BuildContext context) => _Panel(
    color: const Color(0xFFFBFFFC),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('My Vehicle', style: _sectionTitle),
        const SizedBox(height: 11),
        Row(
          children: [
            Container(
              width: 82,
              height: 82,
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/images/driver-auto-thumbnail.png',
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 13),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'KA 05 AB 1234',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Bajaj RE Compact',
                    style: TextStyle(color: AppColors.navy, fontSize: 10.5),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'CNG  ·  Green & Yellow',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                  SizedBox(height: 7),
                  _ActiveChip(),
                ],
              ),
            ),
            const SizedBox(width: 7),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _VehicleInfo(Icons.local_taxi_outlined, 'Vehicle Type', 'Auto'),
                SizedBox(height: 8),
                _VehicleInfo(Icons.water_drop_outlined, 'Fuel Type', 'CNG'),
                SizedBox(height: 8),
                _VehicleInfo(
                  Icons.calendar_month_outlined,
                  'Registration Date',
                  '12 Mar 2024',
                ),
              ],
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.navy,
              size: 23,
            ),
          ],
        ),
      ],
    ),
  );
}

class _ActiveChip extends StatelessWidget {
  const _ActiveChip();
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: AppColors.green.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(10),
    ),
    child: const Padding(
      padding: EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      child: Text(
        'Active',
        style: TextStyle(
          color: AppColors.green,
          fontSize: 8,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

class _VehicleInfo extends StatelessWidget {
  const _VehicleInfo(this.icon, this.label, this.value);
  final IconData icon;
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      CircleAvatar(
        radius: 13,
        backgroundColor: AppColors.green.withValues(alpha: .08),
        child: Icon(icon, color: AppColors.green, size: 14),
      ),
      const SizedBox(width: 6),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.muted, fontSize: 7.5),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    ],
  );
}

class PerformanceCard extends StatelessWidget {
  const PerformanceCard({super.key});
  static const values = [
    (Icons.calendar_month_rounded, '28', 'Trips Completed', AppColors.green),
    (Icons.route_rounded, '312 km', 'Distance Travelled', AppColors.blue),
    (Icons.star_rounded, '4.8', 'Average Rating', AppColors.orange),
    (Icons.thumb_up_alt_outlined, '98%', 'Acceptance Rate', Color(0xFF9148DD)),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      children: [
        const Row(
          children: [
            Text('My Performance', style: _sectionTitle),
            Spacer(),
            Text(
              'This Month ⌄',
              style: TextStyle(color: AppColors.muted, fontSize: 9),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: List.generate(
            values.length,
            (i) => Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: i == 3
                      ? null
                      : const Border(
                          right: BorderSide(color: AppColors.border),
                        ),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: values[i].$4.withValues(alpha: .09),
                      child: Icon(values[i].$1, color: values[i].$4, size: 18),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      values[i].$2,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      values[i].$3,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 8,
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

class ProfileMenuCard extends StatelessWidget {
  const ProfileMenuCard({super.key});
  static const items = [
    (
      Icons.person_outline_rounded,
      'Personal Information',
      'View and update your personal details',
    ),
    (
      Icons.description_outlined,
      'Documents',
      'Upload and manage your documents',
    ),
    (
      Icons.account_balance_wallet_outlined,
      'Bank Details',
      'Manage your bank account and payments',
    ),
    (
      Icons.shield_outlined,
      'Safety & Support',
      'Emergency contacts and safety tools',
    ),
    (
      Icons.notifications_none_rounded,
      'Notifications',
      'Manage your notification preferences',
    ),
    (
      Icons.help_outline_rounded,
      'Help & Support',
      'FAQs, support and contact us',
    ),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: Column(
      children: List.generate(
        items.length,
        (i) => _MenuRow(data: items[i], last: i == items.length - 1),
      ),
    ),
  );
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.data, required this.last});
  final (IconData, String, String) data;
  final bool last;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 9),
    decoration: BoxDecoration(
      border: last
          ? null
          : const Border(bottom: BorderSide(color: AppColors.border)),
    ),
    child: Row(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: AppColors.green.withValues(alpha: .08),
          child: Icon(data.$1, color: AppColors.green, size: 17),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data.$2,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                data.$3,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.navy,
          size: 21,
        ),
      ],
    ),
  );
}

class ContactSupportCard extends StatelessWidget {
  const ContactSupportCard({super.key});
  @override
  Widget build(BuildContext context) => _Panel(
    color: const Color(0xFFF7FCF9),
    child: Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: AppColors.green.withValues(alpha: .08),
          child: const Icon(
            Icons.support_agent_rounded,
            color: AppColors.green,
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Need Help?',
                style: TextStyle(
                  color: AppColors.green,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                "We're here to help you 24/7",
                style: TextStyle(color: AppColors.muted, fontSize: 9),
              ),
            ],
          ),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const ContactSupportScreen(),
            ),
          ),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.green,
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(7),
            ),
          ),
          child: const Text(
            'Contact Support',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    ),
  );
}

class LogoutCard extends StatelessWidget {
  const LogoutCard({super.key});
  @override
  Widget build(BuildContext context) => _Panel(
    child: const Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: Color(0xFFFFE9EA),
          child: Icon(Icons.logout_rounded, color: AppColors.red, size: 19),
        ),
        SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Logout',
                style: TextStyle(
                  color: AppColors.red,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Log out from your driver account',
                style: TextStyle(color: AppColors.muted, fontSize: 9),
              ),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: AppColors.navy),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({
    required this.child,
    this.padding = const EdgeInsets.all(12),
    this.color = Colors.white,
  });
  final Widget child;
  final EdgeInsets padding;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 13,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: child,
  );
}
