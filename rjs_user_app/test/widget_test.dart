import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rjs_user_app/features/home/screens/home_screen.dart';

void main() {
  testWidgets('RJS home screen renders primary booking content', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -260));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Where can we take you?'), findsOneWidget);
    expect(find.text('Enter your destination'), findsOneWidget);
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -300));
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('Plan your journey'), findsOneWidget);
    expect(find.text('Schedule Ride'), findsOneWidget);
    expect(find.text('City Round Trip'), findsOneWidget);
    expect(find.text('Outstation Trip'), findsOneWidget);
    expect(find.text('Rental Package'), findsOneWidget);
    expect(find.text('Choose a ride'), findsNothing);
    expect(find.text('Book Ride'), findsOneWidget);

    await tester.tap(find.text('Book Ride'));
    await tester.pump(const Duration(milliseconds: 650));
    expect(find.text('Choose your vehicle'), findsOneWidget);
    expect(find.text('Bus'), findsOneWidget);
    expect(find.text('Tempo Traveller'), findsOneWidget);
    expect(find.text('Car'), findsOneWidget);
  });
}
