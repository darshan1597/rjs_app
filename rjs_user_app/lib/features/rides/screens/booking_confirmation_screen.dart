import 'package:flutter/material.dart';

import '../../../core/network/customer_auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../services/customer_booking_service.dart';

class BookingConfirmationScreen extends StatefulWidget {
  const BookingConfirmationScreen({
    super.key,
    required this.pickup,
    required this.destination,
    required this.vehicleName,
    required this.vehicleVariant,
    required this.categoryId,
    required this.variantId,
    required this.vehicleImage,
    required this.seats,
    required this.amount,
    required this.pickupLatitude,
    required this.pickupLongitude,
    required this.destinationLatitude,
    required this.destinationLongitude,
  });

  final String pickup;
  final String destination;
  final String vehicleName;
  final String vehicleVariant;
  final String categoryId;
  final String variantId;
  final String vehicleImage;
  final String seats;
  final int amount;
  final double pickupLatitude;
  final double pickupLongitude;
  final double destinationLatitude;
  final double destinationLongitude;

  @override
  State<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState extends State<BookingConfirmationScreen> {
  String _paymentMethod = 'UPI';
  bool _submitting = false;
  Map<String, dynamic>? _customer;

  @override
  void initState() {
    super.initState();
    CustomerAuthService.getCachedCustomer().then((value) {
      if (mounted) setState(() => _customer = value);
    });
  }

  Future<void> _confirm() async {
    setState(() => _submitting = true);
    try {
      final booking = await CustomerBookingService.create(
        pickupAddress: widget.pickup,
        destinationAddress: widget.destination,
        pickupLatitude: widget.pickupLatitude,
        pickupLongitude: widget.pickupLongitude,
        destinationLatitude: widget.destinationLatitude,
        destinationLongitude: widget.destinationLongitude,
        categoryId: widget.categoryId,
        variantId: widget.variantId,
        paymentMethod: _paymentMethod,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(
                radius: 31,
                backgroundColor: Color(0xFFE8F8EE),
                child: Icon(
                  Icons.check_rounded,
                  color: Color(0xFF079447),
                  size: 39,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Booking Created',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 7),
              Text(
                booking['bookingNumber'] as String? ?? '',
                style: const TextStyle(
                  color: AppColors.blue,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your booking is saved. Payment is pending until the online payment gateway is connected.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted, height: 1.4),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(dialogContext);
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/bookings',
                      (route) => route.settings.name == '/home',
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.orange,
                  ),
                  child: const Text('View My Bookings'),
                ),
              ),
            ],
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
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFBFCFF),
    body: SafeArea(
      bottom: false,
      child: Column(
        children: [
          _Header(onBack: () => Navigator.pop(context)),
          Expanded(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
              children: [
                _TripCard(
                  pickup: widget.pickup,
                  destination: widget.destination,
                ),
                const SizedBox(height: 13),
                _VehicleCard(widget: widget),
                const SizedBox(height: 13),
                _ContactCard(customer: _customer),
                const SizedBox(height: 13),
                _PaymentCard(
                  selected: _paymentMethod,
                  onSelected: (value) => setState(() => _paymentMethod = value),
                ),
                const SizedBox(height: 13),
                _FareCard(amount: widget.amount),
                const SizedBox(height: 13),
                const _CancellationNote(),
              ],
            ),
          ),
          _ConfirmBar(
            amount: widget.amount,
            loading: _submitting,
            onConfirm: _confirm,
          ),
        ],
      ),
    ),
  );
}

class _Header extends StatelessWidget {
  const _Header({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 9, 16, 13),
    child: Row(
      children: [
        InkWell(
          onTap: onBack,
          customBorder: const CircleBorder(),
          child: Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0x160A244A),
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
                'Confirm Your Ride',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Review details before booking',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(width: 48),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(17),
      border: Border.all(color: const Color(0xFFE5E9F0)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B0A244A),
          blurRadius: 13,
          offset: Offset(0, 4),
        ),
      ],
    ),
    child: child,
  );
}

class _TripCard extends StatelessWidget {
  const _TripCard({required this.pickup, required this.destination});
  final String pickup;
  final String destination;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title(icon: Icons.route_rounded, text: 'Trip Details'),
        const SizedBox(height: 15),
        _AddressRow(color: AppColors.orange, label: 'Pickup', address: pickup),
        const Padding(
          padding: EdgeInsets.only(left: 7),
          child: SizedBox(
            height: 24,
            child: VerticalDivider(color: Color(0xFFB8C1CF), width: 1),
          ),
        ),
        _AddressRow(
          color: AppColors.blue,
          label: 'Destination',
          address: destination,
        ),
        const Divider(height: 26),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _Metric(icon: Icons.route_rounded, value: '8.4 km'),
            _Metric(icon: Icons.schedule_rounded, value: '28 min'),
            _Metric(icon: Icons.bolt_rounded, value: 'Immediate'),
          ],
        ),
      ],
    ),
  );
}

class _AddressRow extends StatelessWidget {
  const _AddressRow({
    required this.color,
    required this.label,
    required this.address,
  });
  final Color color;
  final String label;
  final String address;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(top: 3),
        child: Icon(Icons.circle, color: color, size: 14),
      ),
      const SizedBox(width: 11),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(color: AppColors.muted, fontSize: 11),
            ),
            const SizedBox(height: 2),
            Text(
              address,
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _VehicleCard extends StatelessWidget {
  const _VehicleCard({required this.widget});
  final BookingConfirmationScreen widget;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      children: [
        const _Title(icon: Icons.directions_car_rounded, text: 'Selected Ride'),
        const SizedBox(height: 12),
        Row(
          children: [
            SizedBox(
              width: 105,
              height: 72,
              child: Image.asset(widget.vehicleImage, fit: BoxFit.contain),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.vehicleName,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '${widget.seats} seats • Driver included',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11.5,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Estimated arrival: 3–12 min',
                    style: TextStyle(
                      color: Color(0xFF079447),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.customer});
  final Map<String, dynamic>? customer;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      children: [
        const _Title(
          icon: Icons.person_outline_rounded,
          text: 'Contact Details',
        ),
        const SizedBox(height: 13),
        Row(
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFEEF4FF),
              child: Icon(Icons.person_rounded, color: AppColors.blue),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customer?['name'] as String? ?? 'Customer',
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    customer?['phone'] as String? ?? '',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.selected, required this.onSelected});
  final String selected;
  final ValueChanged<String> onSelected;

  static const _methods = [
    ('UPI', Icons.qr_code_rounded, 'UPI'),
    ('CARD', Icons.credit_card_rounded, 'Card'),
    ('NET_BANKING', Icons.account_balance_outlined, 'Net Banking'),
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title(
          icon: Icons.account_balance_wallet_outlined,
          text: 'Online Payment',
        ),
        const SizedBox(height: 13),
        Row(
          children: [
            for (var index = 0; index < _methods.length; index++) ...[
              Expanded(
                child: InkWell(
                  onTap: () => onSelected(_methods[index].$1),
                  borderRadius: BorderRadius.circular(13),
                  child: Container(
                    height: 72,
                    decoration: BoxDecoration(
                      color: selected == _methods[index].$1
                          ? const Color(0xFFFFF5EE)
                          : const Color(0xFFFAFBFD),
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(
                        color: selected == _methods[index].$1
                            ? AppColors.orange
                            : const Color(0xFFE1E6ED),
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _methods[index].$2,
                          color: selected == _methods[index].$1
                              ? AppColors.orange
                              : AppColors.navy,
                          size: 22,
                        ),
                        const SizedBox(height: 5),
                        Text(
                          _methods[index].$3,
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (index < _methods.length - 1) const SizedBox(width: 8),
            ],
          ],
        ),
      ],
    ),
  );
}

class _FareCard extends StatelessWidget {
  const _FareCard({required this.amount});
  final int amount;

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title(icon: Icons.receipt_long_outlined, text: 'Fare Details'),
        const SizedBox(height: 14),
        _FareRow(label: 'Estimated ride fare', value: '₹$amount'),
        const SizedBox(height: 9),
        const _FareRow(label: 'GST', value: 'Included'),
        const SizedBox(height: 9),
        const _FareRow(label: 'Platform/convenience fee', value: '₹0'),
        const Divider(height: 25),
        _FareRow(
          label: 'Total estimated fare',
          value: '₹$amount',
          strong: true,
        ),
      ],
    ),
  );
}

class _FareRow extends StatelessWidget {
  const _FareRow({
    required this.label,
    required this.value,
    this.strong = false,
  });
  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: Text(
          label,
          style: TextStyle(
            color: strong ? AppColors.navy : AppColors.muted,
            fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
            fontSize: strong ? 14 : 12,
          ),
        ),
      ),
      Text(
        value,
        style: TextStyle(
          color: strong ? AppColors.navy : AppColors.muted,
          fontWeight: strong ? FontWeight.w900 : FontWeight.w700,
          fontSize: strong ? 17 : 12,
        ),
      ),
    ],
  );
}

class _CancellationNote extends StatelessWidget {
  const _CancellationNote();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FAF4),
      borderRadius: BorderRadius.circular(15),
    ),
    child: const Row(
      children: [
        Icon(Icons.verified_user_outlined, color: Color(0xFF079447)),
        SizedBox(width: 11),
        Expanded(
          child: Text(
            'No cash payment is required. Cancellation charges may apply after driver assignment.',
            style: TextStyle(color: Color(0xFF087A3A), fontSize: 11.5),
          ),
        ),
      ],
    ),
  );
}

class _Title extends StatelessWidget {
  const _Title({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: AppColors.blue, size: 21),
      const SizedBox(width: 8),
      Text(
        text,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 14.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    ],
  );
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.value});
  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: AppColors.blue, size: 17),
      const SizedBox(width: 4),
      Text(
        value,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    ],
  );
}

class _ConfirmBar extends StatelessWidget {
  const _ConfirmBar({
    required this.amount,
    required this.loading,
    required this.onConfirm,
  });
  final int amount;
  final bool loading;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      17,
      12,
      17,
      12 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      boxShadow: [
        BoxShadow(
          color: Color(0x180A244A),
          blurRadius: 14,
          offset: Offset(0, -3),
        ),
      ],
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹$amount',
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Text(
                'Estimated total',
                style: TextStyle(color: AppColors.muted, fontSize: 10.5),
              ),
            ],
          ),
        ),
        SizedBox(
          width: 205,
          height: 54,
          child: FilledButton(
            onPressed: loading ? null : onConfirm,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.orange,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              loading ? 'Creating...' : 'Confirm & Pay',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
            ),
          ),
        ),
      ],
    ),
  );
}
