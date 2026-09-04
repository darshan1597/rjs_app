import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

const _title = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

class TodayEarningsCard extends StatelessWidget {
  const TodayEarningsCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF07863C), Color(0xFF079447)],
      ),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Today's Earnings",
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
              const SizedBox(height: 7),
              const Text(
                '₹842',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  '⌃  12% more than yesterday',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(width: 1, height: 88, color: Colors.white12),
        const SizedBox(width: 17),
        const Expanded(
          child: Column(
            children: [
              _HeroStat(Icons.work_outline_rounded, '5', 'Trips Completed'),
              SizedBox(height: 16),
              _HeroStat(Icons.route_rounded, '38 km', 'Distance Travelled'),
            ],
          ),
        ),
      ],
    ),
  );
}

class _HeroStat extends StatelessWidget {
  const _HeroStat(this.icon, this.value, this.label);
  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      CircleAvatar(
        radius: 18,
        backgroundColor: Colors.white12,
        child: Icon(icon, color: Colors.white, size: 20),
      ),
      const SizedBox(width: 10),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 9)),
        ],
      ),
    ],
  );
}

class EarningsOverviewCard extends StatelessWidget {
  const EarningsOverviewCard({super.key});
  static const values = [620.0, 540.0, 780.0, 890.0, 650.0, 840.0, 120.0];
  static const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Earnings Overview', style: _title),
            const Spacer(),
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: const Color(0xFFF4F5F7),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Row(
                children: [
                  _Period('Daily', true),
                  _Period('Weekly', false),
                  _Period('Monthly', false),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Row(
          children: [
            Expanded(child: _WeekValue('This Week', '₹4,320', '▲ 15%')),
            SizedBox(height: 45, child: VerticalDivider()),
            Expanded(child: _WeekValue('Last Week', '₹3,750', null)),
          ],
        ),
        const SizedBox(height: 15),
        SizedBox(
          height: 115,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(values.length, (i) {
              final active = i == 5;
              return Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      i == 6 ? '--' : '₹${values[i].toInt()}',
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Container(
                      width: 15,
                      height: 10 + values[i] / 16,
                      decoration: BoxDecoration(
                        color: i == 6
                            ? const Color(0xFFE5E7EC)
                            : active
                            ? AppColors.green
                            : const Color(0xFF78CD94),
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(days[i], style: const TextStyle(fontSize: 8.5)),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    ),
  );
}

class _Period extends StatelessWidget {
  const _Period(this.label, this.active);
  final String label;
  final bool active;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
    decoration: BoxDecoration(
      color: active ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(15),
      border: active ? Border.all(color: const Color(0xFFDDEBE2)) : null,
    ),
    child: Text(
      label,
      style: TextStyle(
        color: active ? AppColors.green : AppColors.muted,
        fontSize: 9,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}

class _WeekValue extends StatelessWidget {
  const _WeekValue(this.label, this.value, this.change);
  final String label;
  final String value;
  final String? change;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 10)),
      const SizedBox(height: 3),
      Row(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (change != null) ...[
            const SizedBox(width: 8),
            Text(
              change!,
              style: const TextStyle(color: AppColors.green, fontSize: 9),
            ),
          ],
        ],
      ),
    ],
  );
}

class EarningsBreakupCard extends StatelessWidget {
  const EarningsBreakupCard({super.key});
  static const items = [
    (Icons.currency_rupee_rounded, '₹842', 'Total Earnings', AppColors.green),
    (Icons.payments_outlined, '₹782', 'Trip Earnings', AppColors.blue),
    (Icons.percent_rounded, '₹40', 'Incentives', Color(0xFF9148DD)),
    (Icons.remove_circle_outline, '₹20', 'Deductions', AppColors.orange),
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      children: [
        const Row(
          children: [
            Text('Earnings Breakup (Today)', style: _title),
            Spacer(),
            Text(
              'View Details',
              style: TextStyle(color: AppColors.green, fontSize: 9),
            ),
            Icon(Icons.chevron_right_rounded, size: 17, color: AppColors.muted),
          ],
        ),
        const SizedBox(height: 13),
        Row(
          children: List.generate(
            items.length,
            (i) => Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: i == 3
                      ? null
                      : const Border(
                          right: BorderSide(color: AppColors.border),
                        ),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 17,
                      backgroundColor: items[i].$4.withValues(alpha: .09),
                      child: Icon(items[i].$1, color: items[i].$4, size: 19),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      items[i].$2,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      items[i].$3,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 8.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class RecentTransactionsCard extends StatelessWidget {
  const RecentTransactionsCard({super.key});
  static const rows = [
    (
      'Koramangala 4th Block → HSR Layout',
      '24 May, 10:35 AM',
      '₹142',
      AppColors.green,
    ),
    (
      'Indiranagar 100 Feet Road → Destination',
      '24 May, 01:50 PM',
      '₹168',
      AppColors.green,
    ),
    (
      'BTM Layout 2nd Stage → Destination',
      '24 May, 05:20 PM',
      '₹156',
      AppColors.green,
    ),
    (
      'Incentive - Complete 5 Trips',
      '24 May, 11:59 PM',
      '₹40',
      AppColors.orange,
    ),
    ('Platform Fee', '24 May, 11:59 PM', '-₹20', AppColors.red),
  ];

  @override
  Widget build(BuildContext context) => _Panel(
    padding: EdgeInsets.zero,
    child: Column(
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(12, 13, 10, 8),
          child: Row(
            children: [
              Text('Recent Transactions', style: _title),
              Spacer(),
              Text(
                'View All',
                style: TextStyle(color: AppColors.green, fontSize: 9),
              ),
              Icon(
                Icons.chevron_right_rounded,
                size: 17,
                color: AppColors.muted,
              ),
            ],
          ),
        ),
        ...List.generate(
          rows.length,
          (i) => _TransactionRow(data: rows[i], last: i == rows.length - 1),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(
            color: Color(0xFFF0FBF4),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(15)),
          ),
          child: const Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Color(0xFFDDF5E5),
                child: Icon(
                  Icons.verified_user_outlined,
                  color: AppColors.green,
                  size: 20,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Payout will be transferred to your bank account',
                      style: TextStyle(
                        color: AppColors.green,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Next payout on 27 May, 2025',
                      style: TextStyle(color: AppColors.navy, fontSize: 9),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: AppColors.green),
            ],
          ),
        ),
      ],
    ),
  );
}

class _TransactionRow extends StatelessWidget {
  const _TransactionRow({required this.data, required this.last});
  final (String, String, String, Color) data;
  final bool last;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
    decoration: BoxDecoration(
      border: last
          ? null
          : const Border(bottom: BorderSide(color: AppColors.border)),
    ),
    child: Row(
      children: [
        CircleAvatar(
          radius: 17,
          backgroundColor: data.$4.withValues(alpha: .09),
          child: Icon(
            last ? Icons.remove_rounded : iIcon(data.$4),
            color: data.$4,
            size: 18,
          ),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data.$1,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                data.$2,
                style: const TextStyle(color: AppColors.muted, fontSize: 8.5),
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Text(
          data.$3,
          style: TextStyle(
            color: data.$4 == AppColors.red ? AppColors.red : AppColors.green,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.muted,
          size: 18,
        ),
      ],
    ),
  );

  IconData iIcon(Color color) => color == AppColors.orange
      ? Icons.star_rounded
      : Icons.calendar_month_rounded;
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(12)});
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B17345F),
          blurRadius: 13,
          offset: Offset(0, 5),
        ),
      ],
    ),
    child: child,
  );
}
