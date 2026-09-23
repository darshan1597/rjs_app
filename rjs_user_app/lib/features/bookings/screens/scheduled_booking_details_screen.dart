import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../rides/services/customer_booking_service.dart';
import '../models/scheduled_booking_status.dart';
import '../widgets/late_pickup_cancel_dialog.dart';

class ScheduledBookingDetailsScreen extends StatefulWidget {
  const ScheduledBookingDetailsScreen({
    super.key,
    required this.booking,
    required this.onTrack,
  });

  final Map<String, dynamic> booking;
  final ValueChanged<Map<String, dynamic>> onTrack;

  @override
  State<ScheduledBookingDetailsScreen> createState() =>
      _ScheduledBookingDetailsScreenState();
}

class _ScheduledBookingDetailsScreenState
    extends State<ScheduledBookingDetailsScreen> {
  late Map<String, dynamic> _booking;
  Timer? _timer;
  bool _refreshing = false;
  bool _cancelling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _booking = widget.booking;
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    if (_refreshing) return;
    _refreshing = true;
    try {
      final booking = await CustomerBookingService.getById(
        _booking['id'].toString(),
      );
      if (mounted)
        setState(() {
          _booking = booking;
          _error = null;
        });
    } catch (_) {
      if (mounted)
        setState(
          () => _error = 'Could not refresh booking. Pull down to retry.',
        );
    } finally {
      _refreshing = false;
    }
  }

  Future<void> _cancelLatePickup() async {
    final reason = await chooseLatePickupCancelReason(context);
    if (reason == null || !mounted) return;
    setState(() => _cancelling = true);
    try {
      final booking = await CustomerBookingService.cancel(_booking['id'].toString(), reason: reason);
      if (mounted) setState(() => _booking = booking);
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
      await _refresh();
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  Widget _detail(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
        const SizedBox(height: 5),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.navy,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final status = _booking['status']?.toString() ?? 'NEW';
    final overdue = isScheduledPickupOverdue(_booking);
    final driver = _booking['driver'] as Map?;
    final date = DateTime.tryParse(
      _booking['scheduledStartAt']?.toString() ?? '',
    )?.toLocal();
    final dateLabel = date == null
        ? '--'
        : '${MaterialLocalizations.of(context).formatMediumDate(date)} · ${TimeOfDay.fromDateTime(date).format(context)}';
    final canTrack =
        !overdue &&
        {
          'DRIVER_ACCEPTED',
          'DRIVER_EN_ROUTE',
          'ARRIVED',
          'IN_PROGRESS',
          'PAYMENT_PENDING',
        }.contains(status);
    final statusLabel = overdue
        ? 'Pickup overdue'
        : switch (status) {
            'NEW' || 'ASSIGNMENT_PENDING' => 'Awaiting driver assignment',
            'ASSIGNED' => 'Driver assigned',
            'DRIVER_EN_ROUTE' => 'Driver is on the way',
            'ARRIVED' => 'Driver has arrived',
            'IN_PROGRESS' => 'Trip in progress',
            'PAYMENT_PENDING' => 'Final payment due',
            _ => status.replaceAll('_', ' '),
          };
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(title: const Text('Scheduled Ride')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    statusLabel,
                    style: TextStyle(
                      color: overdue ? AppColors.orange : AppColors.blue,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (overdue) ...[
                    const SizedBox(height: 10),
                    const Text(
                      'The booked pickup time has passed. You can cancel if the assigned driver has not arrived, or contact RJS support.',
                      style: TextStyle(color: AppColors.muted, fontSize: 13),
                    ),
                  ],
                  _detail(
                    'Booking number',
                    _booking['bookingNumber']?.toString() ?? '--',
                  ),
                  _detail('Pickup date & time', dateLabel),
                  const Divider(),
                  _detail(
                    'Pickup',
                    (_booking['pickup'] as Map?)?['address']?.toString() ??
                        '--',
                  ),
                  _detail(
                    'Drop',
                    (_booking['destination'] as Map?)?['address']?.toString() ??
                        '--',
                  ),
                  _detail(
                    'Vehicle',
                    _booking['vehicleVariant']?.toString().replaceAll(
                          '_',
                          ' ',
                        ) ??
                        '--',
                  ),
                  _detail('Passengers', '${_booking['passengerCount'] ?? 1}'),
                  _detail(
                    'Estimated fare',
                    '₹${(_booking['amount'] as num? ?? 0).toStringAsFixed(2)}',
                  ),
                  const Text(
                    'Payment is collected after the ride. Waiting, toll and parking may affect the final bill.',
                    style: TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                  const Divider(height: 28),
                  if (driver == null)
                    const Text(
                      'Your driver details will appear here after assignment.',
                      style: TextStyle(color: AppColors.muted),
                    )
                  else ...[
                    _detail('Driver', driver['name']?.toString() ?? '--'),
                    _detail(
                      'Driver phone',
                      driver['phone']?.toString() ?? '--',
                    ),
                    _detail(
                      'Vehicle number',
                      (driver['vehicle'] as Map?)?['registrationNumber']
                              ?.toString() ??
                          '--',
                    ),
                  ],
                ],
              ),
            ),
            if (canTrack) ...[
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => widget.onTrack(_booking),
                child: Text(
                  status == 'PAYMENT_PENDING'
                      ? 'View final bill & pay'
                      : 'Track ride',
                ),
              ),
            ],
            if (overdue) ...[
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () =>
                    Navigator.of(context).pushNamed('/help-support'),
                icon: const Icon(Icons.support_agent),
                label: const Text('Contact RJS support'),
              ),
            ],
            if (_booking['canCancelLatePickup'] == true) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _cancelling ? null : _cancelLatePickup,
                icon: const Icon(Icons.cancel_outlined),
                label: Text(_cancelling ? 'Cancelling...' : 'Cancel late pickup'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
