import 'dart:math';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'wallet_screen.dart';
import '../services/wallet_service.dart';
import '../widgets/wallet_credit_celebration.dart';
import '../widgets/wallet_topup_dialog.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}
class _WalletScreenState extends State<WalletScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _wallet;
  String? _error;
  bool _loading = false, _paying = false, _showBalance = true;
  String? _topupId, _retryKey;
  int? _retryAmount;
  String? _withdrawalRetryKey, _withdrawalRetryVpa;
  int? _withdrawalRetryAmount;
  final Set<String> _claimedCelebrations = {};
  late final Razorpay _razorpay;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _success)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _failure);
    _load();
  }
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _razorpay.clear();
    super.dispose();
  }
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && !_paying) _load();
  }
  Future<void> _load() async {
    if (_loading) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await WalletService.get();
      if (mounted) {
        setState(() => _wallet = data);
        final celebration = data['celebration'];
        if (celebration is Map) _claimCelebration(Map<String, dynamic>.from(celebration));
      }
    } catch (error) {
      if (mounted) setState(() => _error = _message(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
  Future<void> _claimCelebration(Map<String, dynamic> event) async {
    final id = event['_id']?.toString();
    if (id == null || !_claimedCelebrations.add(id)) return;
    try {
      await WalletService.markEventSeen(id);
      if (!mounted) return;
      await showDialog<void>(context: context, barrierDismissible: false,
        builder: (_) => WalletCreditCelebration(event: event));
    } catch (_) {
      _claimedCelebrations.remove(id);
    }
  }
  String _message(Object error) => error.toString().replaceFirst('Exception: ', '');
  Future<void> _reloadKeepingError() async {
    final message = _error;
    await _load();
    if (mounted && message != null) setState(() => _error = message);
  }
  Future<void> _addMoney() async {
    if (_paying) return;
    final amount = await showWalletTopupDialog(context);
    if (amount == null || !mounted) return;
    if (_retryAmount != amount || _retryKey == null) {
      _retryAmount = amount;
      _retryKey = List.generate(24, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join();
    }
    await _openTopup(amount, _retryKey!);
  }
  Future<void> _withdraw() async {
    if (_paying || _wallet == null) return;
    final amountController = TextEditingController();
    final vpaController = TextEditingController();
    final withdrawable = (_wallet?['withdrawablePaise'] as num? ?? 0).toInt();
    final request = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Withdraw real-money balance'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Available to withdraw: ₹${(withdrawable / 100).toStringAsFixed(2)}'),
          const SizedBox(height: 12),
          TextField(controller: amountController, keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Amount', prefixText: '₹ ')),
          const SizedBox(height: 10),
          TextField(controller: vpaController, keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'UPI ID', hintText: 'name@bank')),
          const SizedBox(height: 8),
          const Text('Wallet credits and promotional amounts cannot be withdrawn.',
            style: TextStyle(fontSize: 11, color: Colors.black54)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(onPressed: () {
            final amountPaise = ((double.tryParse(amountController.text.trim()) ?? 0) * 100).round();
            final vpa = vpaController.text.trim().toLowerCase();
            if (amountPaise < 10000 || amountPaise > withdrawable || !RegExp(r'^[a-z0-9._-]{2,256}@[a-z0-9.-]{2,64}$').hasMatch(vpa)) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter at least ₹100, within your available balance, and a valid UPI ID.')));
              return;
            }
            Navigator.pop(dialogContext, {'amountPaise': amountPaise, 'vpa': vpa});
          }, child: const Text('Request withdrawal')),
        ],
      ),
    );
    amountController.dispose();
    vpaController.dispose();
    if (request == null || !mounted) return;
    setState(() => _paying = true);
    try {
      final amount = request['amountPaise'] as int;
      final vpa = request['vpa'] as String;
      if (_withdrawalRetryAmount != amount || _withdrawalRetryVpa != vpa || _withdrawalRetryKey == null) {
        _withdrawalRetryAmount = amount;
        _withdrawalRetryVpa = vpa;
        _withdrawalRetryKey = List.generate(24, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join();
      }
      await WalletService.withdraw(amount, vpa, _withdrawalRetryKey!);
      _withdrawalRetryAmount = null;
      _withdrawalRetryVpa = null;
      _withdrawalRetryKey = null;
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal submitted for review.')));
      await _load();
    } catch (error) {
      if (mounted) setState(() => _error = _message(error));
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }
  Future<void> _openTopup(int amount, String key) async {
    if (_paying) return;
    setState(() { _paying = true; _error = null; });
    try {
      final order = await WalletService.topup(amount, key);
      _topupId = order['topupId'].toString();
      if (!mounted) return;
      if (order['status'] == 'CREDITED') {
        setState(() => _paying = false);
        await _load();
        return;
      }
      _razorpay.open({'key': order['keyId'], 'order_id': order['orderId'], 'amount': order['amountPaise'],
        'currency': 'INR', 'name': 'RJS Wallet', 'description': 'Add money to your RJS wallet',
        'prefill': {'contact': order['customer']?['phone'], 'name': order['customer']?['name']}});
    } catch (error) {
      if (mounted) setState(() { _error = _message(error); _paying = false; });
    }
  }
  Future<void> _success(PaymentSuccessResponse response) async {
    try {
      await WalletService.verify(_topupId!, response.paymentId ?? '', response.signature ?? '');
      _retryKey = null;
    } catch (error) {
      if (mounted) setState(() => _error = '${_message(error)} Use Check payment below to recover a captured top-up.');
    } finally {
      if (mounted) {
        setState(() => _paying = false);
        final message = _error;
        await _load();
        if (mounted && message != null) setState(() => _error = message);
      }
    }
  }
  void _failure(PaymentFailureResponse response) {
    if (mounted) {
      setState(() { _paying = false; _error = response.message ?? 'Payment was not completed'; });
      _reloadKeepingError();
    }
  }
  Future<void> _check(Map topup) async {
    if (_paying) return;
    setState(() => _paying = true);
    try {
      final result = await WalletService.reconcile(topup['_id'].toString());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:
          Text(result['credited'] == true ? 'Payment verified; wallet credited'
            : result['archived'] == true ? 'Unpaid top-up archived. Any later verified payment will still be credited.'
            : 'Payment is not captured yet. This entry remains available for checking.')));
      }
    } catch (error) {
      if (mounted) setState(() => _error = _message(error));
    } finally {
      if (mounted) { setState(() => _paying = false); await _reloadKeepingError(); }
    }
  }
  @override
  Widget build(BuildContext context) => WalletDesign(
    wallet: _wallet, loading: _loading, paying: _paying, error: _error,
    showBalance: _showBalance,
    onToggle: () => setState(() => _showBalance = !_showBalance),
    onAddMoney: _addMoney, onWithdraw: _withdraw, onRefresh: _load, onCheckPayment: _check,
  );
}
