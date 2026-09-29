import 'package:flutter/material.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/notifications/driver_push_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../support/screens/contact_support_screen.dart';

const _sectionTitle = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

class DriverIdentityCard extends StatelessWidget {
  const DriverIdentityCard({
    this.driver,
    this.totalTrips,
    this.averageRating,
    super.key,
  });

  final Map<String, dynamic>? driver;
  final int? totalTrips;
  final num? averageRating;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => _showPersonalDetails(context, driver),
    child: _Panel(
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
                child: ClipOval(child: _driverPhoto(driver?['profilePhoto'])),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      _displayVehicle(driver?['name'], 'Driver'),
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Flexible(child: _VerifiedChip()),
                ],
              ),
              SizedBox(height: 7),
              Row(
                children: [
                  Icon(Icons.star_rounded, color: Color(0xFFFFB000), size: 18),
                  SizedBox(width: 5),
                  Text(
                    '${averageRating == null ? 'New' : averageRating!.toStringAsFixed(1)}  ·  ${totalTrips ?? 0} Trips',
                    style: TextStyle(color: AppColors.navy, fontSize: 11),
                  ),
                ],
              ),
              SizedBox(height: 7),
              _ContactLine(
                Icons.phone_outlined,
                _displayVehicle(driver?['phone'], 'Phone unavailable'),
              ),
              SizedBox(height: 6),
              _ContactLine(
                Icons.mail_outline_rounded,
                _displayVehicle(driver?['email'], 'Email not provided'),
              ),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: AppColors.navy, size: 25),
      ],
      ),
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
  const DriverVehicleCard({this.vehicle, super.key});

  final Map<String, dynamic>? vehicle;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => _showVehicleDetails(context, vehicle),
    child: _Panel(
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
                child: _vehicleImage(vehicle?['masterPhoto']),
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _displayVehicle(vehicle?['registrationNumber'], 'Not assigned'),
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_displayVehicle(vehicle?['manufacturer'], '')} ${_displayVehicle(vehicle?['model'], '')}'.trim(),
                    style: const TextStyle(color: AppColors.navy, fontSize: 10.5),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_displayVehicle(vehicle?['fuelType'], 'Fuel N/A')}  •  ${_displayVehicle(vehicle?['color'], 'Color N/A')}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                  const SizedBox(height: 7),
                  const _ActiveChip(),
                ],
              ),
            ),
            const SizedBox(width: 7),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _VehicleInfo(
                  Icons.directions_car_outlined,
                  'Vehicle Type',
                  _displayVehicle(vehicle?['category'], 'N/A'),
                ),
                const SizedBox(height: 8),
                _VehicleInfo(
                  Icons.category_outlined,
                  'Variant',
                  _displayVehicle(vehicle?['variant'], 'N/A'),
                ),
                const SizedBox(height: 8),
                _VehicleInfo(
                  Icons.key_outlined,
                  'Ownership',
                  _ownershipLabel(vehicle?['ownershipType']),
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
    ),
  );
}

Widget _vehicleImage(Object? path) {
  final source = DriverApiService.absoluteUrl(path?.toString());
  if (source.isEmpty) {
    return Image.asset('assets/images/driver-car-final.png', fit: BoxFit.contain);
  }
  return Image.network(
    source,
    fit: BoxFit.contain,
    errorBuilder: (_, __, ___) =>
        Image.asset('assets/images/driver-car-final.png', fit: BoxFit.contain),
  );
}

Widget _driverPhoto(Object? path) {
  final source = DriverApiService.absoluteUrl(path?.toString());
  if (source.isEmpty) {
    return Image.asset('assets/images/driver-ramesh.png', fit: BoxFit.cover);
  }
  return Image.network(
    source,
    fit: BoxFit.cover,
    errorBuilder: (_, __, ___) =>
        Image.asset('assets/images/driver-ramesh.png', fit: BoxFit.cover),
  );
}

String _displayVehicle(Object? value, String fallback) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String _ownershipLabel(Object? value) => switch (value?.toString()) {
  'RJS_OWNED' => 'RJS Owned',
  'DRIVER_OWNED' => 'Driver Owned',
  'THIRD_PARTY' => 'Third Party',
  _ => 'N/A',
};

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
  const PerformanceCard({this.data, super.key});
  final Map<String, dynamic>? data;

  @override
  Widget build(BuildContext context) {
    final rating = data?['averageRating'] as num?;
    final acceptance = data?['acceptanceRate'] as num?;
    final distance = data?['distanceKm'] as num? ?? 0;
    final values = [
      (
        Icons.calendar_month_rounded,
        '${(data?['completedTrips'] as num?)?.toInt() ?? 0}',
        'Trips Completed',
        AppColors.green,
      ),
      (
        Icons.route_rounded,
        '${distance.toStringAsFixed(distance % 1 == 0 ? 0 : 1)} km',
        'Distance Travelled',
        AppColors.blue,
      ),
      (
        Icons.star_rounded,
        rating == null ? '—' : rating.toStringAsFixed(1),
        'Average Rating',
        AppColors.orange,
      ),
      (
        Icons.thumb_up_alt_outlined,
        acceptance == null ? '—' : '${acceptance.toStringAsFixed(1)}%',
        'Acceptance Rate',
        const Color(0xFF9148DD),
      ),
    ];
    return _Panel(
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
}

class ProfileMenuCard extends StatelessWidget {
  const ProfileMenuCard({this.driver, super.key});
  final Map<String, dynamic>? driver;
  static const items = [
    (
      Icons.person_outline_rounded,
      'Personal Information',
      'View your verified personal details',
    ),
    (
      Icons.description_outlined,
      'Documents',
      'View your verified documents',
    ),
    (
      Icons.account_balance_wallet_outlined,
      'Bank Details',
      'View your payout account details',
    ),
    (
      Icons.shield_outlined,
      'Safety & Support',
      'Emergency contacts and safety tools',
    ),
    (
      Icons.notifications_none_rounded,
      'Notifications',
      'View your notification inbox',
    ),
    (
      Icons.help_outline_rounded,
      'Help & Support',
      'FAQs, support and contact us',
    ),
    (
      Icons.fact_check_outlined,
      'Correction Requests',
      'Track profile correction reviews',
    ),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: Column(
      children: List.generate(
        items.length,
        (i) => _MenuRow(
          data: items[i],
          last: i == items.length - 1,
          onTap: () => _openItem(context, i),
        ),
      ),
    ),
  );

  void _openItem(BuildContext context, int index) {
    switch (index) {
      case 0:
        _showPersonalDetails(context, driver);
        break;
      case 1:
        _showDocumentDetails(context, driver);
        break;
      case 2:
        _showBankDetails(context, driver);
        break;
      case 3:
      case 5:
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const ContactSupportScreen()),
        );
        break;
      case 4:
        _showNotificationPreferences(context, driver);
        break;
      case 6:
        _showCorrectionRequests(context);
        break;
    }
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.data,
    required this.last,
    required this.onTap,
  });
  final (IconData, String, String) data;
  final bool last;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
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
    ),
  );
}

Map<String, dynamic> _mapValue(Object? value) =>
    value is Map<String, dynamic> ? value : const {};

String _dateValue(Object? value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (date == null) return 'Not available';
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

void _showPersonalDetails(
  BuildContext context,
  Map<String, dynamic>? driver,
) {
  final personal = _mapValue(driver?['personal']);
  _showDetailsSheet(context, 'Personal Information', [
    ('Driver ID', _displayVehicle(driver?['driverCode'], 'Not available')),
    ('Full name', _displayVehicle(personal['fullName'] ?? driver?['name'], 'Not available')),
    ('Phone', _displayVehicle(personal['phone'] ?? driver?['phone'], 'Not available')),
    ('Email', _displayVehicle(personal['email'] ?? driver?['email'], 'Not provided')),
    ('Date of birth', _dateValue(personal['dateOfBirth'])),
    ('Gender', _displayVehicle(personal['gender'], 'Not available')),
    ('Address', _displayVehicle(personal['residentialAddress'], 'Not available')),
    ('Emergency contact', _displayVehicle(personal['emergencyContact'], 'Not available')),
    ('Service assignment', _displayVehicle(driver?['serviceAssignment'], 'Not available')),
  ], requestArea: 'PERSONAL');
}

void _showVehicleDetails(
  BuildContext context,
  Map<String, dynamic>? vehicle,
) {
  _showDetailsSheet(context, 'My Vehicle', [
    ('Registration number', _displayVehicle(vehicle?['registrationNumber'], 'Not assigned')),
    ('Manufacturer', _displayVehicle(vehicle?['manufacturer'], 'Not available')),
    ('Model', _displayVehicle(vehicle?['model'], 'Not available')),
    ('Category', _displayVehicle(vehicle?['category'], 'Not available')),
    ('Variant', _displayVehicle(vehicle?['variant'], 'Not available')),
    ('Fuel type', _displayVehicle(vehicle?['fuelType'], 'Not available')),
    ('Colour', _displayVehicle(vehicle?['color'], 'Not available')),
    ('Ownership', _ownershipLabel(vehicle?['ownershipType'])),
    ('Seating capacity', _displayVehicle(vehicle?['seatingCapacity'], 'Not available')),
    ('Manufacturing year', _displayVehicle(vehicle?['manufacturingYear'], 'Not available')),
  ], requestArea: 'VEHICLE');
}

void _showDocumentDetails(
  BuildContext context,
  Map<String, dynamic>? driver,
) {
  final licence = _mapValue(driver?['licence']);
  final documents = (driver?['documents'] as List? ?? const []);
  final rows = <(String, String)>[
    ('Licence number', _displayVehicle(licence['number'], 'Not available')),
    ('Issuing state', _displayVehicle(licence['issuingState'], 'Not available')),
    ('Issue date', _dateValue(licence['issueDate'])),
    ('Expiry date', _dateValue(licence['expiryDate'])),
    ('Additional documents', '${documents.length} uploaded'),
  ];
  for (final document in documents) {
    final item = _mapValue(document);
    rows.add((
      _displayVehicle(item['name'], 'Document'),
      _displayVehicle(item['fileName'], 'Uploaded'),
    ));
  }
  _showDetailsSheet(context, 'Documents', rows, requestArea: 'DOCUMENTS');
}

void _showBankDetails(BuildContext context, Map<String, dynamic>? driver) {
  final bank = _mapValue(driver?['bank']);
  _showDetailsSheet(context, 'Bank Details', [
    ('Account holder', _displayVehicle(bank['accountHolderName'], 'Not available')),
    ('Account number', _displayVehicle(bank['accountNumber'], 'Not available')),
    ('IFSC code', _displayVehicle(bank['ifscCode'], 'Not available')),
    ('UPI ID', _displayVehicle(bank['upiId'], 'Not provided')),
  ], requestArea: 'BANK');
}

void _showNotificationPreferences(BuildContext context, Map<String, dynamic>? driver) {
  final existing = _mapValue(driver?['notificationPreferences']);
  var push = existing['pushEnabled'] != false;
  var reminders = existing['scheduledRideReminders'] != false;
  var foreground = existing['foregroundAlerts'] != false;
  var saving = false;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setSheetState) => SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 22),
          decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Notification Preferences', style: TextStyle(color: AppColors.navy, fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            SwitchListTile.adaptive(contentPadding: EdgeInsets.zero, title: const Text('Push notifications'), subtitle: const Text('Receive driver-app notifications'), value: push, onChanged: saving ? null : (value) => setSheetState(() { push = value; if (!value) reminders = false; })),
            SwitchListTile.adaptive(contentPadding: EdgeInsets.zero, title: const Text('Scheduled ride reminders'), subtitle: const Text('Preparation, route and departure reminders'), value: reminders, onChanged: saving || !push ? null : (value) => setSheetState(() => reminders = value)),
            SwitchListTile.adaptive(contentPadding: EdgeInsets.zero, title: const Text('In-app alerts'), subtitle: const Text('Show alerts while the app is open'), value: foreground, onChanged: saving ? null : (value) => setSheetState(() => foreground = value)),
            const SizedBox(height: 10),
            SizedBox(width: double.infinity, child: FilledButton(
              onPressed: saving ? null : () async {
                setSheetState(() => saving = true);
                final values = {'pushEnabled': push, 'scheduledRideReminders': reminders, 'foregroundAlerts': foreground};
                try {
                  await DriverApiService.updateNotificationPreferences(values);
                  await DriverPushService.applyPreferences(values);
                  driver?['notificationPreferences'] = values;
                  if (sheetContext.mounted) Navigator.pop(sheetContext);
                } catch (error) {
                  if (sheetContext.mounted) ScaffoldMessenger.of(sheetContext).showSnackBar(SnackBar(content: Text(error.toString())));
                  setSheetState(() => saving = false);
                }
              },
              style: FilledButton.styleFrom(backgroundColor: AppColors.green, padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text(saving ? 'Saving...' : 'Save Preferences'),
            )),
          ]),
        ),
      ),
    ),
  );
}

void _showDetailsSheet(
  BuildContext context,
  String title,
  List<(String, String)> rows,
  {String? requestArea}
) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => SafeArea(
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(sheetContext).height * .82,
        ),
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 22),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text(title, style: const TextStyle(color: AppColors.navy, fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: rows.length,
                separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
                itemBuilder: (_, index) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 4,
                        child: Text(rows[index].$1, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 6,
                        child: Text(
                          rows[index].$2,
                          textAlign: TextAlign.right,
                          style: const TextStyle(color: AppColors.navy, fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (requestArea != null) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    _requestCorrection(context, requestArea);
                  },
                  icon: const Icon(Icons.edit_note_rounded),
                  label: const Text('Request a correction'),
                ),
              ),
            ],
          ],
        ),
      ),
    ),
  );
}

void _requestCorrection(BuildContext context, String area) {
  final controller = TextEditingController();
  var submitting = false;
  showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setDialogState) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Request a correction', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800)),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 6,
          maxLength: 2000,
          decoration: const InputDecoration(hintText: 'Explain exactly what needs to be changed and why'),
        ),
        actions: [
          TextButton(onPressed: submitting ? null : () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(
            onPressed: submitting ? null : () async {
              final details = controller.text.trim();
              if (details.length < 10) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide at least 10 characters.')));
                return;
              }
              setDialogState(() => submitting = true);
              try {
                final result = await DriverApiService.requestProfileChange(area, details);
                if (dialogContext.mounted) Navigator.pop(dialogContext);
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Request ${result['ticketNumber']} submitted for admin review.')));
              } catch (error) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
                setDialogState(() => submitting = false);
              }
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.green),
            child: Text(submitting ? 'Submitting...' : 'Submit'),
          ),
        ],
      ),
    ),
  ).whenComplete(controller.dispose);
}

Future<void> _showCorrectionRequests(BuildContext context) async {
  try {
    final requests = await DriverApiService.profileChangeRequests();
    if (!context.mounted) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => SafeArea(child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(sheetContext).height * .82),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 22),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Correction Requests', style: TextStyle(color: AppColors.navy, fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (requests.isEmpty) const Padding(padding: EdgeInsets.symmetric(vertical: 28), child: Center(child: Text('No correction requests yet.')))
          else Flexible(child: ListView.separated(shrinkWrap: true, itemCount: requests.length, separatorBuilder: (_, __) => const SizedBox(height: 9), itemBuilder: (_, index) {
            final item = requests[index];
            final decision = item['reviewDecision']?.toString();
            final status = decision ?? 'PENDING';
            final color = decision == 'APPROVED' ? AppColors.green : decision == 'REJECTED' ? AppColors.red : AppColors.orange;
            return Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withValues(alpha: .06), border: Border.all(color: color.withValues(alpha: .25)), borderRadius: BorderRadius.circular(12)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Expanded(child: Text('${item['profileChangeArea'] ?? 'PROFILE'} · ${item['ticketNumber'] ?? ''}', style: const TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800, fontSize: 11))), Text(status, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 9))]),
              if (item['reviewNote'] != null) ...[const SizedBox(height: 7), Text(item['reviewNote'].toString(), style: const TextStyle(color: AppColors.muted, fontSize: 10))],
              const SizedBox(height: 5), Text(_dateValue(item['createdAt']), style: const TextStyle(color: AppColors.muted, fontSize: 8)),
            ]));
          })),
        ]),
      )),
    );
  } catch (error) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
  }
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
  const LogoutCard({this.onTap, super.key});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: _Panel(
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
      ),
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
