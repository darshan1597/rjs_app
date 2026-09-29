import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/notification_popup.dart';

String _walletMoney(num paise) {
  final parts = (paise / 100).toStringAsFixed(2).split('.');
  final whole = parts.first.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]},',
  );
  return '₹$whole.${parts.last}';
}

String _walletDate(dynamic value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (date == null) return '--';
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}

class WalletDesign extends StatelessWidget {
  const WalletDesign({
    super.key,
    required this.wallet,
    required this.showBalance,
    required this.loading,
    required this.paying,
    required this.error,
    required this.onToggle,
    required this.onAddMoney,
    required this.onRefresh,
    required this.onWithdraw,
    required this.onCheckPayment,
  });
  final Map<String, dynamic>? wallet;
  final bool showBalance, loading, paying;
  final String? error;
  final VoidCallback onToggle, onAddMoney;
  final VoidCallback onWithdraw;
  final Future<void> Function() onRefresh;
  final void Function(Map) onCheckPayment;
  int get discount => (wallet?['discountPercent'] as num? ?? 5).toInt();
  List<Map<String, dynamic>> get transactions =>
      (wallet?['transactions'] as List? ?? []).cast<Map<String, dynamic>>();
  List<Map<String, dynamic>> get withdrawals =>
      (wallet?['withdrawals'] as List? ?? []).cast<Map<String, dynamic>>();
  void _history(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .7,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _RecentTransactions(transactions: transactions),
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => BookRideScaffold(
    selectedIndex: 3,
    backgroundColor: const Color(0xFFFBFCFF),
    onSelected: (index) {
      if (index == 0 && Navigator.canPop(context)) Navigator.pop(context);
    },
    body: SafeArea(
      top: false,
      bottom: false,
      child: RefreshIndicator(
        onRefresh: onRefresh,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                16,
                MediaQuery.paddingOf(context).top + 8,
                16,
                118 + MediaQuery.paddingOf(context).bottom,
              ),
              sliver: SliverList.list(
                children: [
                  _WalletHeader(onMenu: () => showRjsDrawer(context)),
                  if (loading) const LinearProgressIndicator(),
                  if (error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              error!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                          TextButton(
                            onPressed: loading ? null : onRefresh,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 14),
                  _BalanceCard(
                    showBalance: showBalance,
                    balancePaise: wallet?['balancePaise'] as num?,
                    mainPaise: wallet?['withdrawablePaise'] as num?,
                    bonusPaise: wallet?['restrictedPaise'] as num?,
                    lockedPaise: wallet?['lockedPaise'] as num?,
                    onToggle: onToggle,
                    onAddMoney: paying || wallet == null ? null : onAddMoney,
                    onWithdraw:
                        paying ||
                            wallet == null ||
                            wallet?['withdrawalEnabled'] != true ||
                            (wallet?['withdrawablePaise'] as num? ?? 0) < 10000
                        ? null
                        : onWithdraw,
                    paying: paying,
                  ),
                  const SizedBox(height: 10),
                  _WalletPromo(discount: discount),
                  if (withdrawals.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    _WithdrawalStatus(item: withdrawals.first),
                  ],
                  for (final topup
                      in (wallet?['pendingTopups'] as List? ?? [])) ...[
                    const SizedBox(height: 10),
                    _Panel(
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Pending top-up: ${_walletMoney(topup['amountPaise'] as num)}\nAlready paid? Check without paying again.',
                              style: const TextStyle(
                                color: AppColors.navy,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: paying
                                ? null
                                : () => onCheckPayment(topup as Map),
                            child: const Text('Check payment'),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  _RecentTransactions(
                    transactions: transactions.take(5).toList(),
                    loading: wallet == null,
                    onViewAll: () => _history(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _WalletHeader extends StatelessWidget {
  const _WalletHeader({required this.onMenu});
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _WalletHeaderButton(icon: Icons.menu_rounded, onTap: onMenu),
      const SizedBox(width: 13),
      const Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'My Wallet',
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 25,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'Manage your balance and transactions',
              style: TextStyle(color: AppColors.muted, fontSize: 12.5),
            ),
          ],
        ),
      ),
      const SizedBox(width: 8),
      _WalletHeaderButton(
        icon: Icons.notifications_none_rounded,
        notification: true,
        onTap: () => showRjsNotifications(context),
      ),
    ],
  );
}

class _WalletHeaderButton extends StatelessWidget {
  const _WalletHeaderButton({
    required this.icon,
    this.onTap,
    this.notification = false,
  });
  final IconData icon;
  final VoidCallback? onTap;
  final bool notification;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 3,
    shadowColor: const Color(0x180A244A),
    child: InkWell(
      onTap: onTap ?? () {},
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 48,
        height: 48,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, color: AppColors.navy, size: 29),
            if (notification)
              const Positioned(right: 2, top: 2, child: RjsNotificationDot()),
          ],
        ),
      ),
    ),
  );
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({
    required this.showBalance,
    required this.onToggle,
    required this.balancePaise,
    required this.mainPaise,
    required this.bonusPaise,
    required this.lockedPaise,
    required this.onAddMoney,
    required this.onWithdraw,
    required this.paying,
  });
  final bool showBalance;
  final VoidCallback onToggle;
  final num? balancePaise, mainPaise, bonusPaise, lockedPaise;
  final VoidCallback? onAddMoney;
  final VoidCallback? onWithdraw;
  final bool paying;

  String _displayAmount(num? amount) => amount == null
      ? '—'
      : showBalance
      ? _walletMoney(amount)
      : '₹ ••••';

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(15, 15, 15, 14),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(14),
      gradient: const LinearGradient(
        colors: [Color(0xFF2B72F5), Color(0xFF0755E8)],
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x330D5CE8),
          blurRadius: 16,
          offset: Offset(0, 7),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Wallet Balance',
          style: TextStyle(
            color: Colors.white,
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    balancePaise == null
                        ? '—'
                        : showBalance
                        ? _walletMoney(balancePaise!)
                        : '₹ ••••••',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 29,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: onToggle,
                    child: FittedBox(
                      alignment: Alignment.centerLeft,
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Total Balance',
                            style: TextStyle(color: Colors.white, fontSize: 11),
                          ),
                          const SizedBox(width: 7),
                          Icon(
                            showBalance
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: Colors.white,
                            size: 17,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .16),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.security_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'Secure & Safe',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 7),
                ElevatedButton.icon(
                  onPressed: onAddMoney,
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: Text(paying ? 'Processing…' : 'Add Money'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.blue,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 12,
                    ),
                    textStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                const SizedBox(height: 5),
                OutlinedButton.icon(
                  onPressed: onWithdraw,
                  icon: const Icon(Icons.account_balance_rounded, size: 16),
                  label: const Text('Withdraw'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    disabledForegroundColor: Colors.white38,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 9,
                    ),
                    textStyle: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 15),
        Divider(color: Colors.white.withValues(alpha: .26), height: 1),
        const SizedBox(height: 13),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _BalancePart(
                amount: _displayAmount(mainPaise),
                label: 'Main Balance',
                icon: Icons.account_balance_wallet_outlined,
                description: 'Money you added to your wallet, plus eligible ride refunds.',
                usage: 'Use it for RJS rides or request a withdrawal to your UPI ID.',
              ),
            ),
            _balanceDivider(),
            Expanded(
              child: _BalancePart(
                amount: _displayAmount(bonusPaise),
                label: 'Bonus Balance',
                icon: Icons.card_giftcard_outlined,
                description: 'Credits added to your wallet by RJS, including goodwill or promotional credits.',
                usage:
                    'Use it for RJS rides. Bonus Balance cannot be withdrawn.',
              ),
            ),
            _balanceDivider(),
            Expanded(
              child: _BalancePart(
                amount: _displayAmount(lockedPaise),
                label: 'Locked Balance',
                icon: Icons.lock_clock_outlined,
                description: 'Money reserved while a withdrawal request is pending or processing.',
                usage: 'It is not included in Total Balance. If the withdrawal fails or is rejected, it returns to Main Balance.',
              ),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _balanceDivider() => Container(
    width: 1,
    height: 52,
    margin: const EdgeInsets.symmetric(horizontal: 8),
    color: Colors.white.withValues(alpha: .25),
  );
}

class _BalancePart extends StatelessWidget {
  const _BalancePart({
    required this.amount,
    required this.label,
    required this.icon,
    required this.description,
    required this.usage,
  });
  final String amount, label, description, usage;
  final IconData icon;

  void _showDetails(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) => SafeArea(
      top: false,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF2FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: AppColors.blue, size: 23),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.pop(sheetContext),
                    icon: const Icon(
                      Icons.close_rounded,
                      color: AppColors.muted,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F7FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Current balance',
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      amount,
                      style: const TextStyle(
                        color: AppColors.navy,
                        fontSize: 25,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Text(
                description,
                style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                usage,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Text(
          amount,
          maxLines: 1,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      const SizedBox(height: 5),
      Row(
        children: [
          Flexible(
            child: Text(
              label,
              maxLines: 2,
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
          ),
          const SizedBox(width: 2),
          IconButton(
            onPressed: () => _showDetails(context),
            tooltip: 'About $label',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints.tightFor(width: 30, height: 30),
            icon: const Icon(
              Icons.info_outline_rounded,
              color: Colors.white70,
              size: 17,
            ),
          ),
        ],
      ),
    ],
  );
}

class _WithdrawalStatus extends StatelessWidget {
  const _WithdrawalStatus({required this.item});
  final Map<String, dynamic> item;
  @override
  Widget build(BuildContext context) {
    final status = item['status']?.toString() ?? 'PENDING';
    final completed = status == 'PAID';
    final returned = ['REJECTED', 'FAILED', 'REVERSED'].contains(status);
    return _Panel(
      child: Row(
        children: [
          Icon(
            completed
                ? Icons.check_circle_rounded
                : returned
                ? Icons.replay_circle_filled_rounded
                : Icons.schedule_send_rounded,
            color: completed
                ? Colors.green
                : returned
                ? Colors.orange
                : AppColors.blue,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Withdrawal ${status.toLowerCase()}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.navy,
                  ),
                ),
                Text(
                  '${_walletMoney(item['amountPaise'] as num? ?? 0)} · ${item['vpa'] ?? ''}',
                  style: const TextStyle(fontSize: 9, color: AppColors.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletPromo extends StatelessWidget {
  const _WalletPromo({required this.discount});
  final int discount;
  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minHeight: 88),
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: const Color(0xFFF2F7FF),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Image.asset(
          'assets/images/wallet-promo-transparent.png',
          width: 72,
          height: 66,
          fit: BoxFit.contain,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Wallet ride discount',
                      style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDDEBFF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '$discount% OFF',
                      style: const TextStyle(
                        color: AppColors.blue,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Automatically applied to your final ride bill when you pay with your wallet.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _RecentTransactions extends StatelessWidget {
  const _RecentTransactions({
    required this.transactions,
    this.loading = false,
    this.onViewAll,
  });
  final List<Map<String, dynamic>> transactions;
  final bool loading;
  final VoidCallback? onViewAll;
  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(10, 11, 10, 5),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(child: _Title('Recent Transactions')),
            if (onViewAll != null)
              TextButton(
                onPressed: onViewAll,
                child: const Row(
                  children: [
                    Text('View All', style: TextStyle(fontSize: 10)),
                    Icon(Icons.chevron_right_rounded, size: 16),
                  ],
                ),
              ),
          ],
        ),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE1E6EE)),
            borderRadius: BorderRadius.circular(9),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              if (transactions.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    loading ? 'Loading transactions…' : 'No transactions yet.',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                    ),
                  ),
                ),
              ...List.generate(transactions.length, (i) {
                final entry = transactions[i];
                final credit =
                    entry['type'] == 'TOPUP' ||
                    entry['type'] == 'ADMIN_CREDIT' ||
                    entry['type'] == 'REFUND_CREDIT' ||
                    entry['type'] == 'WITHDRAWAL_RELEASE';
                final saved = entry['discountPaise'] as num? ?? 0;
                final item = (
                  entry['type'] == 'ADMIN_CREDIT'
                      ? entry['description']?.toString() ?? 'Wallet credit'
                      : entry['type'] == 'REFUND_CREDIT'
                      ? entry['description']?.toString() ?? 'Ride refund'
                      : entry['type'] == 'WITHDRAWAL_HOLD'
                      ? 'Withdrawal requested'
                      : entry['type'] == 'WITHDRAWAL_RELEASE'
                      ? 'Withdrawal returned'
                      : credit
                      ? 'Added to Wallet'
                      : entry['description']?.toString() ?? 'Ride payment',
                  entry['type'] == 'ADMIN_CREDIT'
                      ? 'RJS wallet adjustment'
                      : entry['type'] == 'REFUND_CREDIT'
                      ? 'Refund credited by RJS'
                      : entry['type'].toString().startsWith('WITHDRAWAL_')
                      ? entry['description']?.toString() ?? 'Wallet withdrawal'
                      : credit
                      ? 'Via Razorpay'
                      : entry['type'] == 'ADMIN_DEBIT'
                      ? 'RJS wallet adjustment'
                      : saved > 0
                      ? 'Saved ${_walletMoney(saved)} · Wallet discount'
                      : 'Paid with RJS Wallet',
                  '${credit ? '+' : '-'} ${_walletMoney(entry['amountPaise'] as num? ?? 0)}',
                  _walletDate(entry['createdAt']),
                  credit,
                );
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 9,
                  ),
                  decoration: BoxDecoration(
                    border: i == transactions.length - 1
                        ? null
                        : const Border(
                            bottom: BorderSide(color: Color(0xFFE8EBF0)),
                          ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: item.$5
                              ? const Color(0xFFEDF8EF)
                              : const Color(0xFFFFF2E8),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          item.$5
                              ? Icons.south_rounded
                              : Icons.north_east_rounded,
                          color: item.$5
                              ? const Color(0xFF17943A)
                              : AppColors.orange,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 9),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.$1,
                              style: const TextStyle(
                                color: AppColors.navy,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              item.$2,
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontSize: 8.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            item.$3,
                            style: TextStyle(
                              color: item.$5
                                  ? const Color(0xFF168B34)
                                  : AppColors.navy,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            item.$4,
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 8,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(12)});
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B102040),
          blurRadius: 12,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: child,
  );
}

class _Title extends StatelessWidget {
  const _Title(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: AppColors.navy,
      fontSize: 12,
      fontWeight: FontWeight.w800,
    ),
  );
}
