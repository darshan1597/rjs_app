import 'dart:math';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'wallet_screen.dart';
import '../services/wallet_service.dart';
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
      if (mounted) setState(() => _wallet = data);
    } catch (error) {
      if (mounted) setState(() => _error = _message(error));
    } finally {
      if (mounted) setState(() => _loading = false);
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
    onAddMoney: _addMoney, onRefresh: _load, onCheckPayment: _check,
  );
}
