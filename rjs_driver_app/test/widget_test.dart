import 'package:driver/features/auth/screens/driver_login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('driver login renders', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: DriverLoginScreen()));
    expect(find.text('Welcome Back!'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);
  });
}
