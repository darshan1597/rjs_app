import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../core/theme/app_colors.dart';
import '../../rides/services/customer_booking_service.dart';

class PaymentReceiptScreen extends StatefulWidget {
  const PaymentReceiptScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<PaymentReceiptScreen> createState() => _PaymentReceiptScreenState();
}

class _PaymentReceiptScreenState extends State<PaymentReceiptScreen> {
  Map<String, dynamic>? _receipt;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = '');
    try {
      final receipt = await CustomerBookingService.getReceipt(widget.bookingId);
      if (mounted) setState(() => _receipt = receipt);
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  String _money(dynamic value) => '₹${(value as num? ?? 0).toStringAsFixed(2)}';

  String _date(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return '--';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}  ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  Future<Uint8List> _buildPdf(Map<String, dynamic> receipt) async {
    final payment = receipt['payment'] as Map? ?? const {};
    final ride = receipt['ride'] as Map? ?? const {};
    final customer = receipt['customer'] as Map? ?? const {};
    final fare = receipt['fare'] as Map? ?? const {};
    final document = pw.Document();
    final rows = _fareRows(fare);

    document.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (_) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('RJS TOURS AND TRAVELS', style: pw.TextStyle(fontSize: 19, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 4),
            pw.Text('PAYMENT RECEIPT', style: const pw.TextStyle(fontSize: 11, color: PdfColors.grey700)),
            pw.Divider(height: 28),
            _pdfPair('Receipt number', receipt['receiptNumber']),
            _pdfPair('Booking number', receipt['bookingNumber']),
            _pdfPair('Paid on', _date(receipt['issuedAt'])),
            _pdfPair('Customer', customer['name']),
            _pdfPair('Phone', customer['phone']),
            pw.SizedBox(height: 18),
            pw.Text('Ride details', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            _pdfPair('Pickup', (ride['pickup'] as Map?)?['address']),
            _pdfPair('Drop', (ride['destination'] as Map?)?['address']),
            if (ride['driverName'] != null) _pdfPair('Driver', ride['driverName']),
            if (ride['vehicleRegistrationNumber'] != null) _pdfPair('Vehicle', ride['vehicleRegistrationNumber']),
            pw.SizedBox(height: 18),
            pw.Text('Fare breakdown', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            ...rows.map((row) => _pdfPair(row.$1, 'Rs ${row.$2.toStringAsFixed(2)}')),
            pw.Divider(height: 22),
            _pdfPair('Total paid', 'Rs ${(fare['total'] as num? ?? 0).toStringAsFixed(2)}', bold: true),
            pw.SizedBox(height: 18),
            pw.Text('Payment details', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            _pdfPair('Method', payment['methodDisplay'] ?? payment['method']),
            _pdfPair('Payment ID', payment['razorpayPaymentId'] ?? payment['transactionId']),
            _pdfPair('Status', payment['status']),
            pw.Spacer(),
            pw.Divider(),
            pw.Text('This is a computer-generated payment receipt.', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
          ],
        ),
      ),
    );
    return document.save();
  }

  pw.Widget _pdfPair(String label, dynamic value, {bool bold = false}) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 6),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(width: 125, child: pw.Text(label, style: const pw.TextStyle(color: PdfColors.grey700))),
        pw.Expanded(child: pw.Text(value?.toString() ?? '--', style: bold ? pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13) : null)),
      ],
    ),
  );

  List<(String, double)> _fareRows(Map fare) {
    double amount(String key) => (fare[key] as num? ?? 0).toDouble();
    return <(String, double)>[
      ('Ride fare', amount('distanceFare')),
      if (amount('waitingCharge') > 0) ('Waiting charge', amount('waitingCharge')),
      if (amount('nightSurcharge') > 0) ('Night surcharge', amount('nightSurcharge')),
      if (amount('tollCharge') > 0) ('Toll', amount('tollCharge')),
      if (amount('parkingCharge') > 0) ('Parking', amount('parkingCharge')),
      if (amount('gstAmount') > 0) ('GST (${fare['gstPercent'] ?? 0}%)', amount('gstAmount')),
      if (amount('walletDiscount') > 0) ('Wallet discount (5%)', -amount('walletDiscount')),
    ];
  }

  Future<void> _share() async {
    final receipt = _receipt;
    if (receipt == null) return;
    await Printing.sharePdf(
      bytes: await _buildPdf(receipt),
      filename: '${receipt['receiptNumber'] ?? 'RJS-receipt'}.pdf',
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF7F9FC),
    appBar: AppBar(
      backgroundColor: Colors.white,
      foregroundColor: AppColors.navy,
      elevation: 0,
      title: const Text('Payment Receipt', style: TextStyle(fontWeight: FontWeight.w800)),
      actions: [
        if (_receipt != null) IconButton(onPressed: _share, icon: const Icon(Icons.ios_share_rounded), tooltip: 'Share PDF'),
      ],
    ),
    body: _receipt == null
        ? Center(
            child: _error.isEmpty
                ? const CircularProgressIndicator(color: AppColors.blue)
                : Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.muted),
                      const SizedBox(height: 12),
                      Text(_error, textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('Try again')),
                    ]),
                  ),
          )
        : _ReceiptBody(receipt: _receipt!, money: _money, date: _date, fareRows: _fareRows, onShare: _share),
  );
}

class _ReceiptBody extends StatelessWidget {
  const _ReceiptBody({required this.receipt, required this.money, required this.date, required this.fareRows, required this.onShare});

  final Map<String, dynamic> receipt;
  final String Function(dynamic) money;
  final String Function(dynamic) date;
  final List<(String, double)> Function(Map) fareRows;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    final payment = receipt['payment'] as Map? ?? const {};
    final ride = receipt['ride'] as Map? ?? const {};
    final customer = receipt['customer'] as Map? ?? const {};
    final fare = receipt['fare'] as Map? ?? const {};
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), boxShadow: const [BoxShadow(color: Color(0x100A244A), blurRadius: 18, offset: Offset(0, 5))]),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              CircleAvatar(backgroundColor: Color(0xFFE8F8EE), child: Icon(Icons.check_rounded, color: Color(0xFF168C35))),
              SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Payment successful', style: TextStyle(color: Color(0xFF168C35), fontSize: 17, fontWeight: FontWeight.w800)), Text('RJS Tours and Travels', style: TextStyle(color: AppColors.muted, fontSize: 12))])),
            ]),
            const SizedBox(height: 20),
            Center(child: Text(money(fare['total']), style: const TextStyle(color: AppColors.navy, fontSize: 32, fontWeight: FontWeight.w900))),
            const SizedBox(height: 5),
            Center(child: Text(date(receipt['issuedAt']), style: const TextStyle(color: AppColors.muted, fontSize: 12))),
            const Divider(height: 32),
            _line('Receipt number', receipt['receiptNumber']),
            _line('Booking number', receipt['bookingNumber']),
            _line('Customer', customer['name']),
            _line('Payment method', payment['methodDisplay'] ?? payment['method']),
            _line('Payment ID', payment['razorpayPaymentId'] ?? payment['transactionId']),
          ]),
        ),
        const SizedBox(height: 14),
        _section('Ride details', [
          _line('Pickup', (ride['pickup'] as Map?)?['address']),
          _line('Drop', (ride['destination'] as Map?)?['address']),
          if (ride['driverName'] != null) _line('Driver', ride['driverName']),
          if (ride['vehicleRegistrationNumber'] != null) _line('Vehicle', ride['vehicleRegistrationNumber']),
        ]),
        const SizedBox(height: 14),
        _section('Fare breakdown', [
          ...fareRows(fare).map((row) => _line(row.$1, money(row.$2))),
          const Divider(height: 22),
          _line('Total paid', money(fare['total']), strong: true),
          if ((fare['waitingCharge'] as num? ?? 0) > 0)
            Padding(padding: const EdgeInsets.only(top: 7), child: Text('${fare['waitingMinutes']} min total waiting · ${fare['freeWaitingMinutes']} min free', style: const TextStyle(color: AppColors.muted, fontSize: 11))),
        ]),
        const SizedBox(height: 18),
        SizedBox(height: 52, child: FilledButton.icon(onPressed: onShare, icon: const Icon(Icons.picture_as_pdf_outlined), label: const Text('Share or save PDF'), style: FilledButton.styleFrom(backgroundColor: AppColors.blue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))))),
        const SizedBox(height: 12),
        const Text('This is a computer-generated payment receipt.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 10.5)),
      ],
    );
  }

  static Widget _section(String title, List<Widget> children) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE6EAF0))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: AppColors.navy, fontSize: 15, fontWeight: FontWeight.w800)), const SizedBox(height: 14), ...children]),
  );

  static Widget _line(String label, dynamic value, {bool strong = false}) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5))),
      Expanded(child: Text(value?.toString() ?? '--', textAlign: TextAlign.right, style: TextStyle(color: AppColors.navy, fontSize: strong ? 14 : 11.5, fontWeight: strong ? FontWeight.w900 : FontWeight.w700))),
    ]),
  );
}
