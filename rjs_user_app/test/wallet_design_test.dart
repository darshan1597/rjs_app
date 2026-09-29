import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rjs_user_app/features/wallet/screens/wallet_screen.dart';

Map<String, dynamic> data({
  List<Map<String, dynamic>> transactions = const [],
}) => {
  'balancePaise': 123456,
  'withdrawablePaise': 100000,
  'restrictedPaise': 23456,
  'lockedPaise': 5000,
  'withdrawalEnabled': true,
  'discountPercent': 5,
  'transactions': transactions,
  'withdrawals': <Map<String, dynamic>>[],
  'pendingTopups': <Map<String, dynamic>>[],
};
Widget screen({
  Map<String, dynamic>? wallet,
  bool paying = false,
  VoidCallback? add,
  VoidCallback? withdraw,
  bool visible = true,
}) => MaterialApp(
  home: WalletDesign(
    wallet: wallet,
    showBalance: visible,
    loading: false,
    paying: paying,
    error: null,
    onToggle: () {},
    onAddMoney: add ?? () {},
    onWithdraw: withdraw ?? () {},
    onRefresh: () async {},
    onCheckPayment: (_) {},
  ),
);
void main() {
  testWidgets(
    'shows live total and balance breakdown without old action tiles',
    (tester) async {
      await tester.pumpWidget(screen(wallet: data()));
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('Wallet Balance'), findsOneWidget);
      expect(find.text('₹1,234.56'), findsOneWidget);
      expect(find.text('Main Balance'), findsOneWidget);
      expect(find.text('Bonus Balance'), findsOneWidget);
      expect(find.text('Locked Balance'), findsOneWidget);
      expect(find.text('Send Money'), findsNothing);
      expect(find.text('Transaction'), findsNothing);
      expect(find.text('Offers'), findsNothing);
      expect(find.text('₹2,450.00'), findsNothing);
      expect(find.text('Cashback Received'), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('original Add Money button calls the live top-up action', (
    tester,
  ) async {
    var calls = 0;
    await tester.pumpWidget(screen(wallet: data(), add: () => calls++));
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Add Money'));
    expect(calls, 1);
  });
  testWidgets('balance visibility hides the remaining wallet balance', (
    tester,
  ) async {
    await tester.pumpWidget(screen(wallet: data(), visible: false));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('₹1,234.56'), findsNothing);
  });
  testWidgets('does not show a fabricated balance while data is unavailable', (
    tester,
  ) async {
    await tester.pumpWidget(screen());
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('₹0.00'), findsNothing);
    expect(
      tester
          .widget<ElevatedButton>(
            find.widgetWithText(ElevatedButton, 'Add Money'),
          )
          .onPressed,
      isNull,
    );
  });
  testWidgets('promo panel shows the live discount without an offer button', (
    tester,
  ) async {
    await tester.pumpWidget(screen(wallet: data()));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Wallet ride discount'), findsOneWidget);
    expect(find.text('5% OFF'), findsOneWidget);
    expect(find.text('View Offers'), findsNothing);
    expect(find.text('Get up to ₹250 Cashback'), findsNothing);
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'history action opens actual ledger entries, including older entries',
    (tester) async {
      final entries = List.generate(
        6,
        (index) => <String, dynamic>{
          'type': 'RIDE_PAYMENT',
          'description': 'Ride ${index + 1}',
          'amountPaise': 9500,
          'discountPaise': 500,
          'createdAt': '2026-09-18T10:00:00Z',
        },
      );
      await tester.pumpWidget(screen(wallet: data(transactions: entries)));
      await tester.pump(const Duration(seconds: 1));
      await tester.ensureVisible(find.text('View All'));
      await tester.pump(const Duration(seconds: 1));
      await tester.tap(find.text('View All'));
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('Ride 6'), findsOneWidget);
      expect(find.text('- ₹95.00'), findsWidgets);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('360px phone retains the layout without overflow', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(screen(wallet: data()));
    await tester.pump(const Duration(seconds: 1));
    expect(tester.takeException(), isNull);
  });
}
