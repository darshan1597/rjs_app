import 'package:driver/features/profile/screens/driver_profile_screen.dart';
import 'package:driver/features/profile/widgets/profile_sections.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('profile cards render live driver and performance data', (
    tester,
  ) async {
    const driver = <String, dynamic>{
      'driverCode': 'RJD00042',
      'name': 'Ramesh Kumar',
      'phone': '9876543210',
      'email': 'ramesh@example.com',
      'serviceAssignment': 'LOCAL',
      'personal': <String, dynamic>{
        'fullName': 'Ramesh Kumar',
        'phone': '9876543210',
        'email': 'ramesh@example.com',
        'gender': 'MALE',
        'residentialAddress': 'MG Road',
        'emergencyContact': '9999999999',
      },
      'bank': <String, dynamic>{
        'accountHolderName': 'Ramesh Kumar',
        'accountNumber': '••••1234',
        'ifscCode': 'TEST0000123',
      },
    };
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: const [
              DriverIdentityCard(driver: driver, totalTrips: 128),
              PerformanceCard(
                data: <String, dynamic>{
                  'completedTrips': 28,
                  'distanceKm': 312.5,
                  'acceptanceRate': 98,
                },
              ),
              ProfileMenuCard(driver: driver),
            ],
          ),
        ),
      ),
    );

    expect(find.text('Ramesh Kumar'), findsOneWidget);
    expect(find.textContaining('128 Trips'), findsOneWidget);
    expect(find.text('28'), findsOneWidget);
    expect(find.text('312.5 km'), findsOneWidget);
    expect(find.text('98.0%'), findsOneWidget);

    await tester.ensureVisible(find.text('Personal Information'));
    await tester.tap(find.text('Personal Information'));
    await tester.pumpAndSettle();
    expect(find.text('RJD00042'), findsOneWidget);
    expect(find.text('MG Road'), findsOneWidget);
  });

  test('profile screen remains constructible', () {
    expect(const DriverProfileScreen(), isA<DriverProfileScreen>());
  });
}
