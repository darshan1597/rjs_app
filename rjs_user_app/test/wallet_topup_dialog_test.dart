import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rjs_user_app/features/wallet/widgets/wallet_topup_dialog.dart';

void main() {
  Future<void> open(WidgetTester tester, void Function(int?) result) async {
    await tester.pumpWidget(MaterialApp(home: Builder(builder: (context) => Scaffold(
      body: TextButton(onPressed: () async => result(await showWalletTopupDialog(context)),
        child: const Text('Open')),
    ))));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
  }
  testWidgets('Continue completes only after the focused form safely closes', (tester) async {
    int? result;
    await open(tester, (amount) => result = amount);
    await tester.enterText(find.byType(TextFormField), '100');
    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(result, isNull);
    await tester.pumpAndSettle();
    expect(result, 10000);
    expect(find.byType(WalletTopupDialog), findsNothing);
    expect(tester.takeException(), isNull);
  });
  testWidgets('validation remains safe when corrected and submitted', (tester) async {
    int? result;
    await open(tester, (amount) => result = amount);
    await tester.enterText(find.byType(TextFormField), '50');
    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Enter a whole-rupee amount from ₹100 to ₹10,000'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField), '250');
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(result, 25000);
    expect(tester.takeException(), isNull);
  });
  testWidgets('cancel disposes the focused form without starting payment', (tester) async {
    var completed = false;
    await open(tester, (amount) { completed = true; expect(amount, isNull); });
    await tester.enterText(find.byType(TextFormField), '100');
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(completed, isTrue);
    expect(tester.takeException(), isNull);
  });
}
