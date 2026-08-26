import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rjs_user_app/features/home/screens/home_screen.dart';

void main() {
  testWidgets('RJS home screen renders primary booking content', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -260));
    await tester.pumpAndSettle();

    expect(find.text('Where can we take you?'), findsOneWidget);
    expect(find.text('Enter your destination'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Choose a ride'), 300);
    await tester.pumpAndSettle();
    expect(find.text('Choose a ride'), findsOneWidget);
    expect(find.text('RJS Go'), findsOneWidget);
    expect(find.text('Book Ride'), findsOneWidget);
  });
}
