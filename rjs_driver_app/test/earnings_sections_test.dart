import 'package:driver/features/earnings/widgets/earnings_sections.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> transaction(int index) => {
  'title': 'Pickup $index → Destination $index',
  'occurredAt': '2026-09-28T10:30:00.000Z',
  'amount': 100 + index,
};

void main() {
  testWidgets('earnings cards render live values without changing the layout', (
    tester,
  ) async {
    String? selected;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              TodayEarningsCard(
                data: const {
                  'earnings': 640,
                  'totalEarnings': 12450,
                  'completedTrips': 2,
                  'distanceKm': 18.3,
                  'changePercent': 60,
                },
              ),
              EarningsOverviewCard(
                data: {
                  'currentLabel': 'Today',
                  'previousLabel': 'Yesterday',
                  'current': 600,
                  'previous': 400,
                  'changePercent': 50,
                  'bars': List.generate(
                    7,
                    (index) => {
                      'label': 'D$index',
                      'amount': index * 100,
                      'active': index == 6,
                    },
                  ),
                },
                selectedPeriod: 'DAILY',
                loading: false,
                onPeriodSelected: (value) => selected = value,
              ),
              EarningsBreakupCard(
                data: const {
                  'total': 640,
                  'tripEarnings': 600,
                  'incentives': 50,
                  'deductions': 10,
                },
              ),
              RecentTransactionsCard(
                transactions: List.generate(6, transaction),
                payout: const {
                  'amount': 640,
                  'scheduledAt': '2026-09-30T00:00:00.000Z',
                },
              ),
            ],
          ),
        ),
      ),
    );

    expect(find.text('₹640'), findsWidgets);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('18.3 km'), findsOneWidget);
    expect(find.text('Total Earnings'), findsNWidgets(2));
    expect(find.textContaining('12,450'), findsOneWidget);
    expect(find.textContaining('60.0% more than yesterday'), findsOneWidget);

    await tester.tap(find.text('Weekly'));
    expect(selected, 'WEEKLY');
    expect(tester.takeException(), isNull);
  });

  testWidgets('details and view all controls open their sheets', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              EarningsBreakupCard(
                data: const {
                  'total': 640,
                  'tripEarnings': 600,
                  'incentives': 50,
                  'deductions': 10,
                },
              ),
              RecentTransactionsCard(
                transactions: List.generate(6, transaction),
                payout: null,
              ),
            ],
          ),
        ),
      ),
    );

    await tester.tap(find.text('View Details'));
    await tester.pumpAndSettle();
    expect(find.text('Today’s earnings details'), findsOneWidget);
    Navigator.of(tester.element(find.text('Today’s earnings details'))).pop();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('View All'));
    await tester.tap(find.text('View All'));
    await tester.pumpAndSettle();
    expect(find.text('All recent earnings'), findsOneWidget);
    expect(find.textContaining('Pickup 5'), findsOneWidget);
  });
}
