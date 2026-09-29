import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:driver/features/home/widgets/driver_dashboard_sections.dart';

void main() {
  testWidgets('today overview and next trip render backend values', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              TodayOverview(
                data: const {
                  'completedTrips': 3,
                  'distanceKm': 27.4,
                  'earnings': 640,
                  'rating': null,
                },
                onSeeAll: () {},
              ),
              NextTripCard(
                upcomingCount: 2,
                onTap: () {},
                trip: const {
                  'bookingNumber': 'RJS123456',
                  'pickup': {'address': 'MG Road Metro Station'},
                  'vehicleVariant': 'SEDAN',
                  'scheduledStartAt': '2026-09-29T05:30:00.000Z',
                },
              ),
            ],
          ),
        ),
      ),
    );

    expect(find.text('3'), findsOneWidget);
    expect(find.text('27.4 km'), findsOneWidget);
    expect(find.text('₹640'), findsOneWidget);
    expect(find.text('—'), findsOneWidget);
    expect(find.text('2 Upcoming'), findsOneWidget);
    expect(find.text('MG Road Metro Station'), findsOneWidget);
    expect(find.textContaining('RJS123456'), findsOneWidget);
  });

  testWidgets('next trip has a real empty state', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: NextTripCard(trip: null, upcomingCount: 0, onTap: () {}),
        ),
      ),
    );

    expect(find.text('0 Upcoming'), findsOneWidget);
    expect(find.text('No upcoming scheduled trips'), findsOneWidget);
  });
}
