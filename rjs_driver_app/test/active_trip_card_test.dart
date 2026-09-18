import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:driver/features/home/widgets/active_trip_card.dart';

void main() {
  testWidgets('en-route card offers location and arrival as separate actions', (tester) async {
    var locationClicks = 0;
    var arrivalClicks = 0;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ActiveTripCard(
      trip: {'status': 'DRIVER_EN_ROUTE'}, busy: false,
      onAction: () => locationClicks++, onArrived: () => arrivalClicks++,
    ))));
    await tester.tap(find.text('See location'));
    expect(locationClicks, 1);
    expect(arrivalClicks, 0);
    await tester.tap(find.text("I've Arrived"));
    expect(arrivalClicks, 1);
  });

  testWidgets('arrival is not offered before starting pickup', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ActiveTripCard(
      trip: {'status': 'DRIVER_ACCEPTED'}, busy: false,
      onAction: () {}, onArrived: () {},
    ))));
    expect(find.text('See location'), findsOneWidget);
    expect(find.text("I've Arrived"), findsNothing);
  });

  testWidgets('arrival button is disabled while updating', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ActiveTripCard(
      trip: {'status': 'DRIVER_EN_ROUTE'}, busy: true,
      onAction: () {}, onArrived: () {},
    ))));
    expect(tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed, isNull);
  });
}
