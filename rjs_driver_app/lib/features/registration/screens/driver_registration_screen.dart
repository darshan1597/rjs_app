import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';

class DriverRegistrationScreen extends StatefulWidget {
  const DriverRegistrationScreen({super.key});

  @override
  State<DriverRegistrationScreen> createState() =>
      _DriverRegistrationScreenState();
}

class _DriverRegistrationScreenState extends State<DriverRegistrationScreen> {
  int _step = 0;
  String _vehicle = 'Auto';
  bool _submitted = false;

  static const _titles = [
    ('Personal Details', 'Tell us a little about yourself'),
    ('Driver Details', 'Add your driving licence information'),
    ('Vehicle Category', 'Select the vehicle you will drive'),
    ('Vehicle Details', 'Enter your vehicle information'),
    ('Documents', 'Upload clear and valid documents'),
    ('Bank Details', 'Choose where you want to receive payouts'),
    ('Review & Submit', 'Check all details before submitting'),
  ];

  void _next() {
    if (_step == _titles.length - 1) {
      setState(() => _submitted = true);
    } else {
      setState(() => _step++);
    }
  }

  void _back() {
    if (_step == 0) {
      Navigator.of(context).pop();
    } else {
      setState(() => _step--);
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
        child: _submitted
            ? _SubmittedView(onDone: () => Navigator.of(context).pop())
            : Column(
                children: [
                  _RegistrationHeader(step: _step, onBack: _back),
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(17, 18, 17, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _titles[_step].$1,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _titles[_step].$2,
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 18),
                          _stepBody(),
                        ],
                      ),
                    ),
                  ),
                  _BottomActions(
                    finalStep: _step == _titles.length - 1,
                    onBack: _back,
                    onContinue: _next,
                  ),
                ],
              ),
      ),
    ),
  );

  Widget _stepBody() => switch (_step) {
    0 => const _PersonalStep(),
    1 => const _DriverStep(),
    2 => _VehicleCategoryStep(
      selected: _vehicle,
      onSelected: (value) => setState(() => _vehicle = value),
    ),
    3 => _VehicleDetailsStep(vehicle: _vehicle),
    4 => _DocumentsStep(vehicle: _vehicle),
    5 => const _BankStep(),
    _ => _ReviewStep(
      vehicle: _vehicle,
      onEdit: (step) => setState(() => _step = step),
    ),
  };
}

class _RegistrationHeader extends StatelessWidget {
  const _RegistrationHeader({required this.step, required this.onBack});
  final int step;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(17, 8, 17, 15),
    child: Column(
      children: [
        Row(
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
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Driver Registration',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    'Complete your profile to start driving',
                    style: TextStyle(color: AppColors.muted, fontSize: 9.5),
                  ),
                ],
              ),
            ),
            Text(
              'Step ${step + 1} of 7',
              style: const TextStyle(
                color: AppColors.green,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: List.generate(
            7,
            (index) => Expanded(
              child: Container(
                height: 5,
                margin: EdgeInsets.only(right: index == 6 ? 0 : 5),
                decoration: BoxDecoration(
                  color: index <= step
                      ? AppColors.green
                      : const Color(0xFFE5E9EF),
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 7),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            '${(((step + 1) / 7) * 100).round()}% completed',
            style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
          ),
        ),
      ],
    ),
  );
}

class _PersonalStep extends StatelessWidget {
  const _PersonalStep();
  @override
  Widget build(BuildContext context) => const _FormCard(
    children: [
      _PhotoPicker(label: 'Add profile photo', icon: Icons.person_rounded),
      SizedBox(height: 18),
      _Field(
        label: 'Full Name',
        hint: 'Enter your name',
        icon: Icons.person_outline_rounded,
      ),
      SizedBox(height: 13),
      Row(
        children: [
          Expanded(
            child: _Field(
              label: 'Date of Birth',
              hint: 'DD/MM/YYYY',
              icon: Icons.cake_outlined,
            ),
          ),
          SizedBox(width: 11),
          Expanded(
            child: _Field(
              label: 'Gender',
              hint: 'Select',
              icon: Icons.keyboard_arrow_down_rounded,
            ),
          ),
        ],
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Email Address',
        hint: 'Enter your email',
        icon: Icons.mail_outline_rounded,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Residential Address',
        hint: 'Enter your complete address',
        icon: Icons.location_on_outlined,
        lines: 2,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Emergency Contact',
        hint: 'Enter mobile number',
        icon: Icons.phone_outlined,
      ),
    ],
  );
}

class _DriverStep extends StatelessWidget {
  const _DriverStep();
  @override
  Widget build(BuildContext context) => const _FormCard(
    children: [
      _InfoStrip(text: 'Keep your original driving licence nearby.'),
      SizedBox(height: 16),
      _Field(
        label: 'Driving Licence Number',
        hint: 'Example: KA0120230000000',
        icon: Icons.badge_outlined,
      ),
      SizedBox(height: 13),
      Row(
        children: [
          Expanded(
            child: _Field(
              label: 'Issue Date',
              hint: 'DD/MM/YYYY',
              icon: Icons.calendar_month_outlined,
            ),
          ),
          SizedBox(width: 11),
          Expanded(
            child: _Field(
              label: 'Expiry Date',
              hint: 'DD/MM/YYYY',
              icon: Icons.event_outlined,
            ),
          ),
        ],
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Issuing State',
        hint: 'Select state',
        icon: Icons.keyboard_arrow_down_rounded,
      ),
      SizedBox(height: 16),
      _UploadTile(
        title: 'Front of Driving Licence',
        subtitle: 'JPG, PNG or PDF · Max 5 MB',
      ),
      SizedBox(height: 10),
      _UploadTile(
        title: 'Back of Driving Licence',
        subtitle: 'JPG, PNG or PDF · Max 5 MB',
      ),
    ],
  );
}

class _VehicleCategoryStep extends StatelessWidget {
  const _VehicleCategoryStep({
    required this.selected,
    required this.onSelected,
  });
  final String selected;
  final ValueChanged<String> onSelected;
  static const items = [
    ('Auto', Icons.electric_rickshaw_rounded, '3 passengers'),
    ('Car', Icons.directions_car_rounded, '4–7 passengers'),
    ('Tempo Traveller', Icons.airport_shuttle_rounded, '8–20 passengers'),
    ('Bus', Icons.directions_bus_rounded, '20+ passengers'),
  ];

  @override
  Widget build(BuildContext context) => Column(
    children: [
      const _InfoStrip(text: 'You can add another approved vehicle later.'),
      const SizedBox(height: 14),
      ...items.map((item) {
        final active = selected == item.$1;
        return Padding(
          padding: const EdgeInsets.only(bottom: 11),
          child: Material(
            color: active ? const Color(0xFFF1FAF4) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              onTap: () => onSelected(item.$1),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: active ? AppColors.green : AppColors.border,
                    width: active ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.green.withValues(alpha: .09),
                      child: Icon(item.$2, color: AppColors.green, size: 27),
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.$1,
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            item.$3,
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 9.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      active
                          ? Icons.check_circle_rounded
                          : Icons.radio_button_off_rounded,
                      color: active ? AppColors.green : AppColors.muted,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }),
    ],
  );
}

class _VehicleDetailsStep extends StatelessWidget {
  const _VehicleDetailsStep({required this.vehicle});
  final String vehicle;
  @override
  Widget build(BuildContext context) => _FormCard(
    children: [
      _SelectedVehicle(vehicle),
      const SizedBox(height: 16),
      const _Field(
        label: 'Registration Number',
        hint: 'Example: KA 05 AB 1234',
        icon: Icons.pin_outlined,
      ),
      const SizedBox(height: 13),
      const Row(
        children: [
          Expanded(
            child: _Field(
              label: 'Manufacturer',
              hint: 'Select',
              icon: Icons.keyboard_arrow_down_rounded,
            ),
          ),
          SizedBox(width: 11),
          Expanded(
            child: _Field(
              label: 'Model',
              hint: 'Select model',
              icon: Icons.keyboard_arrow_down_rounded,
            ),
          ),
        ],
      ),
      const SizedBox(height: 13),
      const Row(
        children: [
          Expanded(
            child: _Field(
              label: 'Fuel Type',
              hint: 'Select',
              icon: Icons.water_drop_outlined,
            ),
          ),
          SizedBox(width: 11),
          Expanded(
            child: _Field(
              label: 'Seating Capacity',
              hint: 'Enter seats',
              icon: Icons.event_seat_outlined,
            ),
          ),
        ],
      ),
      const SizedBox(height: 13),
      const _Field(
        label: 'Manufacturing Year',
        hint: 'Select year',
        icon: Icons.calendar_month_outlined,
      ),
      const SizedBox(height: 16),
      const _UploadTile(
        title: 'Vehicle front photo',
        subtitle: 'Keep number plate clearly visible',
      ),
      const SizedBox(height: 10),
      const _UploadTile(
        title: 'Vehicle rear photo',
        subtitle: 'Keep number plate clearly visible',
      ),
    ],
  );
}

class _DocumentsStep extends StatelessWidget {
  const _DocumentsStep({required this.vehicle});
  final String vehicle;
  @override
  Widget build(BuildContext context) {
    final documents = [
      'Registration Certificate (RC)',
      'Vehicle Insurance',
      'Pollution Certificate (PUC)',
      'Vehicle Permit',
      if (vehicle == 'Bus' || vehicle == 'Tempo Traveller')
        'Fitness Certificate',
      'Aadhaar Card',
      'PAN Card',
    ];
    return Column(
      children: [
        const _InfoStrip(
          text: 'Upload documents where all details are readable.',
        ),
        const SizedBox(height: 14),
        ...documents.map(
          (document) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _UploadTile(
              title: document,
              subtitle: 'Tap to upload · Max 5 MB',
            ),
          ),
        ),
      ],
    );
  }
}

class _BankStep extends StatelessWidget {
  const _BankStep();
  @override
  Widget build(BuildContext context) => const _FormCard(
    children: [
      _InfoStrip(text: 'Your bank details are encrypted and kept secure.'),
      SizedBox(height: 16),
      _Field(
        label: 'Account Holder Name',
        hint: 'As shown in bank account',
        icon: Icons.person_outline_rounded,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Bank Account Number',
        hint: 'Enter account number',
        icon: Icons.account_balance_outlined,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'Confirm Account Number',
        hint: 'Re-enter account number',
        icon: Icons.verified_outlined,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'IFSC Code',
        hint: 'Example: SBIN0001234',
        icon: Icons.tag_rounded,
      ),
      SizedBox(height: 13),
      _Field(
        label: 'UPI ID (Optional)',
        hint: 'example@upi',
        icon: Icons.currency_rupee_rounded,
      ),
      SizedBox(height: 16),
      _UploadTile(
        title: 'Cancelled cheque or passbook',
        subtitle: 'Account name and number must be visible',
      ),
    ],
  );
}

class _ReviewStep extends StatelessWidget {
  const _ReviewStep({required this.vehicle, required this.onEdit});
  final String vehicle;
  final ValueChanged<int> onEdit;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      const _InfoStrip(
        text: 'Review carefully. You can edit any section before submitting.',
      ),
      const SizedBox(height: 14),
      _ReviewTile(
        icon: Icons.person_outline_rounded,
        title: 'Personal Details',
        value: 'Ramesh · +91 98765 43210',
        onEdit: () => onEdit(0),
      ),
      _ReviewTile(
        icon: Icons.badge_outlined,
        title: 'Driver Details',
        value: 'Licence details and 2 files added',
        onEdit: () => onEdit(1),
      ),
      _ReviewTile(
        icon: Icons.directions_car_outlined,
        title: 'Vehicle',
        value: '$vehicle · KA 05 AB 1234',
        onEdit: () => onEdit(2),
      ),
      _ReviewTile(
        icon: Icons.description_outlined,
        title: 'Documents',
        value: 'Required documents added',
        onEdit: () => onEdit(4),
      ),
      _ReviewTile(
        icon: Icons.account_balance_outlined,
        title: 'Bank Details',
        value: 'Account ending in 4321',
        onEdit: () => onEdit(5),
      ),
      const SizedBox(height: 4),
      const _ConsentCard(),
    ],
  );
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.onEdit,
  });
  final IconData icon;
  final String title;
  final String value;
  final VoidCallback onEdit;
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: AppColors.green.withValues(alpha: .09),
          child: Icon(icon, color: AppColors.green, size: 20),
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
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                value,
                style: const TextStyle(color: AppColors.muted, fontSize: 9),
              ),
            ],
          ),
        ),
        TextButton(
          onPressed: onEdit,
          child: const Text(
            'Edit',
            style: TextStyle(
              color: AppColors.green,
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    ),
  );
}

class _ConsentCard extends StatelessWidget {
  const _ConsentCard();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: const Color(0xFFF4FAF6),
      borderRadius: BorderRadius.circular(12),
    ),
    child: const Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.check_box_rounded, color: AppColors.green, size: 21),
        SizedBox(width: 9),
        Expanded(
          child: Text(
            'I confirm that the information provided is correct and I accept the Terms & Conditions and Privacy Policy.',
            style: TextStyle(
              color: AppColors.muted,
              fontSize: 9.5,
              height: 1.4,
            ),
          ),
        ),
      ],
    ),
  );
}

class _BottomActions extends StatelessWidget {
  const _BottomActions({
    required this.finalStep,
    required this.onBack,
    required this.onContinue,
  });
  final bool finalStep;
  final VoidCallback onBack;
  final VoidCallback onContinue;
  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      17,
      11,
      17,
      11 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      boxShadow: [
        BoxShadow(
          color: Color(0x16172B42),
          blurRadius: 18,
          offset: Offset(0, -5),
        ),
      ],
    ),
    child: Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: onBack,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.navy,
              side: const BorderSide(color: AppColors.border),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Back'),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          flex: 2,
          child: FilledButton(
            onPressed: onContinue,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.green,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(
              finalStep ? 'Submit for Verification' : 'Save & Continue',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    ),
  );
}

class _SubmittedView extends StatelessWidget {
  const _SubmittedView({required this.onDone});
  final VoidCallback onDone;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircleAvatar(
          radius: 48,
          backgroundColor: Color(0xFFE8F7ED),
          child: Icon(
            Icons.hourglass_top_rounded,
            color: AppColors.green,
            size: 49,
          ),
        ),
        const SizedBox(height: 23),
        const Text(
          'Registration Submitted!',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 24,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 9),
        const Text(
          'Your details are under review. We will notify you when verification is complete.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.muted, fontSize: 11.5, height: 1.5),
        ),
        const SizedBox(height: 24),
        const _StatusTimeline(),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: onDone,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.green,
              padding: const EdgeInsets.symmetric(vertical: 15),
            ),
            child: const Text(
              'Back to Home',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    ),
  );
}

class _StatusTimeline extends StatelessWidget {
  const _StatusTimeline();
  @override
  Widget build(BuildContext context) => const _FormCard(
    children: [
      _StatusRow(
        'Submitted',
        'Completed',
        AppColors.green,
        Icons.check_circle_rounded,
      ),
      Divider(height: 24),
      _StatusRow(
        'Document Review',
        'In progress',
        AppColors.orange,
        Icons.pending_rounded,
      ),
      Divider(height: 24),
      _StatusRow(
        'Account Approval',
        'Pending',
        AppColors.muted,
        Icons.radio_button_unchecked_rounded,
      ),
    ],
  );
}

class _StatusRow extends StatelessWidget {
  const _StatusRow(this.title, this.status, this.color, this.icon);
  final String title;
  final String status;
  final Color color;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: color, size: 22),
      const SizedBox(width: 11),
      Expanded(
        child: Text(
          title,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 9.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    ],
  );
}

class _FormCard extends StatelessWidget {
  const _FormCard({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 14,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: Column(children: children),
  );
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.hint,
    required this.icon,
    this.lines = 1,
  });
  final String label;
  final String hint;
  final IconData icon;
  final int lines;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
      const SizedBox(height: 6),
      TextField(
        maxLines: lines,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF9AA2B3), fontSize: 9.5),
          suffixIcon: Icon(icon, color: AppColors.muted, size: 18),
          filled: true,
          fillColor: const Color(0xFFFBFCFE),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.green),
          ),
        ),
        style: const TextStyle(color: AppColors.navy, fontSize: 10.5),
      ),
    ],
  );
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({required this.title, required this.subtitle});
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFFBFCFE),
      borderRadius: BorderRadius.circular(11),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 19,
          backgroundColor: Color(0xFFE8F7ED),
          child: Icon(
            Icons.cloud_upload_outlined,
            color: AppColors.green,
            size: 21,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        const Text(
          'Upload',
          style: TextStyle(
            color: AppColors.green,
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    ),
  );
}

class _PhotoPicker extends StatelessWidget {
  const _PhotoPicker({required this.label, required this.icon});
  final String label;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      CircleAvatar(
        radius: 42,
        backgroundColor: const Color(0xFFEAF7EF),
        child: Icon(icon, color: AppColors.green, size: 46),
      ),
      const SizedBox(height: 8),
      Text(
        label,
        style: const TextStyle(
          color: AppColors.green,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    ],
  );
}

class _InfoStrip extends StatelessWidget {
  const _InfoStrip({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(11),
    decoration: BoxDecoration(
      color: const Color(0xFFF1FAF4),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        const Icon(
          Icons.info_outline_rounded,
          color: AppColors.green,
          size: 18,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: AppColors.muted, fontSize: 9.5),
          ),
        ),
      ],
    ),
  );
}

class _SelectedVehicle extends StatelessWidget {
  const _SelectedVehicle(this.vehicle);
  final String vehicle;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(11),
    decoration: BoxDecoration(
      color: const Color(0xFFF1FAF4),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        const Icon(Icons.directions_car_rounded, color: AppColors.green),
        const SizedBox(width: 9),
        const Text(
          'Selected category',
          style: TextStyle(color: AppColors.muted, fontSize: 9.5),
        ),
        const Spacer(),
        Text(
          vehicle,
          style: const TextStyle(
            color: AppColors.green,
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    ),
  );
}
