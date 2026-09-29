import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

const _title = TextStyle(
  color: AppColors.navy,
  fontSize: 13,
  fontWeight: FontWeight.w800,
);

String _money(Object? value) {
  final amount = (value as num?)?.round() ?? 0;
  final text = amount.toString().replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]},',
  );
  return '₹$text';
}

String _distance(Object? value) {
  final number = value as num? ?? 0;
  return '${number.toStringAsFixed(number % 1 == 0 ? 0 : 1)} km';
}

String _dateTime(Object? value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (date == null) return '--';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  return '${date.day} ${months[date.month - 1]}, ${hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')} ${date.hour >= 12 ? 'PM' : 'AM'}';
}

class TodayEarningsCard extends StatelessWidget {
  const TodayEarningsCard({super.key, required this.data});
  final Map<String, dynamic>? data;

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
              Text(
                _money(data?['earnings']),
                style: const TextStyle(
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
                child: Text(
                  data?['changePercent'] is num
                      ? '${(data!['changePercent'] as num) >= 0 ? '▲' : '▼'}  ${(data!['changePercent'] as num).abs().toStringAsFixed(1)}% ${(data!['changePercent'] as num) >= 0 ? 'more' : 'less'} than yesterday'
                      : 'No previous-day comparison',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(
                    Icons.account_balance_wallet_outlined,
                    color: Colors.white70,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'Total Earnings',
                    style: TextStyle(color: Colors.white70, fontSize: 10),
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      _money(data?['totalEarnings']),
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(width: 1, height: 110, color: Colors.white12),
        const SizedBox(width: 17),
        Expanded(
          child: Column(
            children: [
              _HeroStat(
                Icons.work_outline_rounded,
                '${(data?['completedTrips'] as num?)?.toInt() ?? 0}',
                'Trips Completed',
              ),
              const SizedBox(height: 16),
              _HeroStat(
                Icons.route_rounded,
                _distance(data?['distanceKm']),
                'Distance Travelled',
              ),
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
  const EarningsOverviewCard({
    super.key,
    required this.data,
    required this.selectedPeriod,
    required this.onPeriodSelected,
    required this.loading,
  });
  final Map<String, dynamic>? data;
  final String selectedPeriod;
  final ValueChanged<String> onPeriodSelected;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final bars = (data?['bars'] as List? ?? const [])
        .cast<Map<String, dynamic>>();
    final maxAmount = bars.fold<double>(0, (highest, item) {
      final amount = (item['amount'] as num? ?? 0).toDouble();
      return amount > highest ? amount : highest;
    });
    final change = data?['changePercent'] as num?;
    final changeLabel = change == null
        ? null
        : '${change >= 0 ? '▲' : '▼'} ${change.abs().toStringAsFixed(1)}%';
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Earnings Overview', style: _title),
              if (loading) ...[
                const SizedBox(width: 7),
                const SizedBox(
                  width: 11,
                  height: 11,
                  child: CircularProgressIndicator(strokeWidth: 1.5),
                ),
              ],
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F5F7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    _Period(
                      'Daily',
                      selectedPeriod == 'DAILY',
                      () => onPeriodSelected('DAILY'),
                    ),
                    _Period(
                      'Weekly',
                      selectedPeriod == 'WEEKLY',
                      () => onPeriodSelected('WEEKLY'),
                    ),
                    _Period(
                      'Monthly',
                      selectedPeriod == 'MONTHLY',
                      () => onPeriodSelected('MONTHLY'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _WeekValue(
                  data?['currentLabel']?.toString() ?? 'Current',
                  _money(data?['current']),
                  changeLabel,
                ),
              ),
              const SizedBox(height: 45, child: VerticalDivider()),
              Expanded(
                child: _WeekValue(
                  data?['previousLabel']?.toString() ?? 'Previous',
                  _money(data?['previous']),
                  null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          SizedBox(
            height: 115,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(bars.length, (i) {
                final amount = (bars[i]['amount'] as num? ?? 0).toDouble();
                final active = bars[i]['active'] == true;
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        amount == 0 ? '--' : _money(amount),
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Container(
                        width: 15,
                        height: maxAmount <= 0
                            ? 10
                            : 10 + (amount / maxAmount * 58),
                        decoration: BoxDecoration(
                          color: amount == 0
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
                      Text(
                        bars[i]['label']?.toString() ?? '',
                        style: const TextStyle(fontSize: 8.5),
                      ),
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
}

class _Period extends StatelessWidget {
  const _Period(this.label, this.active, this.onTap);
  final String label;
  final bool active;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: active,
    label: '$label earnings',
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        constraints: const BoxConstraints(minWidth: 48, minHeight: 40),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 11),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(18),
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
              style: TextStyle(
                color: change!.startsWith('▼')
                    ? AppColors.red
                    : AppColors.green,
                fontSize: 9,
              ),
            ),
          ],
        ],
      ),
    ],
  );
}

class EarningsBreakupCard extends StatelessWidget {
  const EarningsBreakupCard({super.key, required this.data});
  final Map<String, dynamic>? data;

  void _showDetails(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Today’s earnings details',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 14),
            _DetailRow(
              'Confirmed trip earnings',
              _money(data?['tripEarnings']),
            ),
            _DetailRow('Incentives', _money(data?['incentives'])),
            _DetailRow('Deductions', '-${_money(data?['deductions'])}'),
            const Divider(height: 24),
            _DetailRow('Total earnings', _money(data?['total']), strong: true),
            const SizedBox(height: 10),
            const Text(
              'Only rides with confirmed customer payment are included in trip earnings.',
              style: TextStyle(color: AppColors.muted, fontSize: 11),
            ),
          ],
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        Icons.currency_rupee_rounded,
        _money(data?['total']),
        'Total Earnings',
        AppColors.green,
      ),
      (
        Icons.payments_outlined,
        _money(data?['tripEarnings']),
        'Trip Earnings',
        AppColors.blue,
      ),
      (
        Icons.percent_rounded,
        _money(data?['incentives']),
        'Incentives',
        const Color(0xFF9148DD),
      ),
      (
        Icons.remove_circle_outline,
        _money(data?['deductions']),
        'Deductions',
        AppColors.orange,
      ),
    ];
    return _Panel(
      child: Column(
        children: [
          Row(
            children: [
              const Text('Earnings Breakup (Today)', style: _title),
              const Spacer(),
              InkWell(
                onTap: () => _showDetails(context),
                child: const Row(
                  children: [
                    Text(
                      'View Details',
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
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value, {this.strong = false});
  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              color: strong ? AppColors.navy : AppColors.muted,
              fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: AppColors.navy,
            fontWeight: strong ? FontWeight.w900 : FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}

class RecentTransactionsCard extends StatelessWidget {
  const RecentTransactionsCard({
    super.key,
    required this.transactions,
    required this.payout,
  });
  final List<Map<String, dynamic>> transactions;
  final Map<String, dynamic>? payout;

  void _showAll(
    BuildContext context,
    List<(String, String, String, Color)> rows,
  ) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    builder: (context) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .7,
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(18, 4, 18, 12),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'All recent earnings',
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: rows.length,
                itemBuilder: (_, index) => _TransactionRow(
                  data: rows[index],
                  last: index == rows.length - 1,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final rows = transactions
        .map(
          (item) => (
            item['title']?.toString() ?? 'Trip earning',
            _dateTime(item['occurredAt']),
            _money(item['amount']),
            AppColors.green,
          ),
        )
        .toList();
    final payoutText = payout == null
        ? 'No payout scheduled yet'
        : 'Next payout ${_dateTime(payout!['scheduledAt'])} · ${_money(payout!['amount'])}';
    return _Panel(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 13, 10, 8),
            child: Row(
              children: [
                const Text('Recent Transactions', style: _title),
                const Spacer(),
                InkWell(
                  onTap: rows.isEmpty ? null : () => _showAll(context, rows),
                  child: const Row(
                    children: [
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
              ],
            ),
          ),
          if (rows.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 22),
              child: Text(
                'No completed ride earnings yet.',
                style: TextStyle(color: AppColors.muted, fontSize: 10.5),
              ),
            )
          else
            ...List.generate(
              rows.take(5).length,
              (i) => _TransactionRow(data: rows[i], last: i == rows.length - 1),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF0FBF4),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(15)),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 18,
                  backgroundColor: Color(0xFFDDF5E5),
                  child: Icon(
                    Icons.verified_user_outlined,
                    color: AppColors.green,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Payout will be transferred to your bank account',
                        style: TextStyle(
                          color: AppColors.green,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        payoutText,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 9,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: AppColors.green),
              ],
            ),
          ),
        ],
      ),
    );
  }
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
          child: Icon(iIcon(data.$4), color: data.$4, size: 18),
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
