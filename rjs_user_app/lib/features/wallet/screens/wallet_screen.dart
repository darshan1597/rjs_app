import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/notification_popup.dart';

String _walletMoney(num paise) {
  final parts = (paise / 100).toStringAsFixed(2).split('.');
  final whole = parts.first.replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (match) => '${match[1]},');
  return '₹$whole.${parts.last}';
}
String _walletDate(dynamic value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (date == null) return '--';
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}

class WalletDesign extends StatelessWidget {
  const WalletDesign({super.key, required this.wallet, required this.showBalance,
    required this.loading, required this.paying, required this.error,
    required this.onToggle, required this.onAddMoney, required this.onRefresh,
    required this.onCheckPayment});
  final Map<String, dynamic>? wallet;
  final bool showBalance, loading, paying;
  final String? error;
  final VoidCallback onToggle, onAddMoney;
  final Future<void> Function() onRefresh;
  final void Function(Map) onCheckPayment;
  int get discount => (wallet?['discountPercent'] as num? ?? 5).toInt();
  List<Map<String, dynamic>> get transactions =>
    (wallet?['transactions'] as List? ?? []).cast<Map<String, dynamic>>();
  void _offers(BuildContext context) => showModalBottomSheet<void>(
    context: context, isScrollControlled: true, showDragHandle: true,
    builder: (sheetContext) => SafeArea(child: Padding(padding: const EdgeInsets.all(16),
      child: _OffersPanel(discount: discount, onAddMoney: paying || wallet == null ? null : () {
        Navigator.pop(sheetContext);
        onAddMoney();
      }))),
  );
  void _history(BuildContext context) => showModalBottomSheet<void>(
    context: context, isScrollControlled: true, showDragHandle: true,
    builder: (_) => SafeArea(child: SizedBox(height: MediaQuery.sizeOf(context).height * .7,
      child: SingleChildScrollView(padding: const EdgeInsets.all(16),
        child: _RecentTransactions(transactions: transactions)))),
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
      child: RefreshIndicator(onRefresh: onRefresh, child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
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
                if (error != null) Padding(padding: const EdgeInsets.only(top: 10),
                  child: Row(children: [Expanded(child: Text(error!, style: const TextStyle(color: Colors.red))),
                    TextButton(onPressed: loading ? null : onRefresh, child: const Text('Retry'))])),
                const SizedBox(height: 14),
                _BalanceCard(
                  showBalance: showBalance,
                  balancePaise: wallet?['balancePaise'] as num?,
                  onToggle: onToggle,
                  onAddMoney: paying || wallet == null ? null : onAddMoney,
                  paying: paying,
                ),
                const SizedBox(height: 10),
                _WalletPromo(discount: discount, onOffers: () => _offers(context)),
                for (final topup in (wallet?['pendingTopups'] as List? ?? [])) ...[
                  const SizedBox(height: 10),
                  _Panel(child: Row(children: [Expanded(child: Text('Pending top-up: ${_walletMoney(topup['amountPaise'] as num)}\nAlready paid? Check without paying again.',
                    style: const TextStyle(color: AppColors.navy, fontSize: 11))),
                    TextButton(onPressed: paying ? null : () => onCheckPayment(topup as Map), child: const Text('Check payment'))])),
                ],
                const SizedBox(height: 10),
                _RecentTransactions(transactions: transactions.take(5).toList(),
                  loading: wallet == null, onViewAll: () => _history(context)),
                const SizedBox(height: 10),
                _OffersPanel(discount: discount, onAddMoney: paying || wallet == null ? null : onAddMoney),
                const SizedBox(height: 10),
                const Text('For RJS ride payments only. No withdrawals or transfers.',
                  style: TextStyle(color: AppColors.muted, fontSize: 10)),
              ],
            ),
          ),
        ],
      )),
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
              Positioned(
                right: 7,
                top: 7,
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.showBalance, required this.onToggle,
    required this.balancePaise, required this.onAddMoney, required this.paying});
  final bool showBalance;
  final VoidCallback onToggle;
  final num? balancePaise;
  final VoidCallback? onAddMoney;
  final bool paying;

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
                    balancePaise == null ? '—' : showBalance ? _walletMoney(balancePaise!) : '₹ ••••••',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 29,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: onToggle,
                    child: FittedBox(alignment: Alignment.centerLeft, fit: BoxFit.scaleDown, child: Row(
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
                    )),
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
              ],
            ),
          ],
        ),
      ],
    ),
  );
}


class _WalletPromo extends StatelessWidget {
  const _WalletPromo({required this.discount, required this.onOffers});
  final int discount;
  final VoidCallback onOffers;
  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 430;
    final button = OutlinedButton.icon(
      onPressed: onOffers,
      icon: const Icon(Icons.sell_outlined, size: 15),
      label: const Text('View Offers'),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.blue,
        side: const BorderSide(color: AppColors.blue),
        padding: const EdgeInsets.symmetric(horizontal: 9),
        textStyle: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700),
      ),
    );
    return Container(
      constraints: const BoxConstraints(minHeight: 94),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: compact ? 8 : 0),
      decoration: BoxDecoration(color: const Color(0xFFF2F7FF), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Image.asset('assets/images/wallet-promo-transparent.png', width: 88, height: 76, fit: BoxFit.contain),
        const SizedBox(width: 10),
        Expanded(child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Use Wallet for faster payments',
              style: TextStyle(color: AppColors.navy, fontSize: 12, fontWeight: FontWeight.w800)),
            const SizedBox(height: 5),
            Text('Save $discount% when you pay\nfor a ride with your wallet',
              style: const TextStyle(color: AppColors.muted, fontSize: 10, height: 1.45)),
            if (compact) button,
          ],
        )),
        if (!compact) button,
      ]),
    );
  }
}

class _RecentTransactions extends StatelessWidget {
  const _RecentTransactions({required this.transactions, this.loading = false, this.onViewAll});
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
            if (onViewAll != null) TextButton(
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
              if (transactions.isEmpty) Padding(padding: const EdgeInsets.all(20),
                child: Text(loading ? 'Loading transactions…' : 'No transactions yet.',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11))),
              ...List.generate(transactions.length, (i) {
              final entry = transactions[i];
              final credit = entry['type'] == 'TOPUP';
              final saved = entry['discountPaise'] as num? ?? 0;
              final item = (
                credit ? 'Added to Wallet' : entry['description']?.toString() ?? 'Ride payment',
                credit ? 'Via Razorpay' : saved > 0 ? 'Saved ${_walletMoney(saved)} · Wallet discount' : 'Paid with RJS Wallet',
                '${credit ? '+' : '-'} ${_walletMoney(entry['amountPaise'] as num? ?? 0)}',
                _walletDate(entry['createdAt']), credit,
              );
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 9),
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

class _OffersPanel extends StatelessWidget {
  const _OffersPanel({required this.discount, required this.onAddMoney});
  final int discount;
  final VoidCallback? onAddMoney;
  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 430;
    final button = OutlinedButton(
      onPressed: onAddMoney,
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFFFF8A00),
        side: const BorderSide(color: Color(0xFFFF9A00)),
        padding: const EdgeInsets.symmetric(horizontal: 9),
        textStyle: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700),
      ),
      child: const Text('Add Money Now'),
    );
    return _Panel(child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Offers & Benefits'),
        const SizedBox(height: 9),
        Container(
          constraints: const BoxConstraints(minHeight: 78),
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: compact ? 8 : 0),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFFFFF4DA), Color(0xFFFFFAEC)]),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Row(children: [
            Image.asset('assets/images/wallet-offer-gift-transparent.png', width: 90, height: 72, fit: BoxFit.contain),
            const SizedBox(width: 8),
            Expanded(child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Save $discount% with Wallet',
                  style: const TextStyle(color: Color(0xFF3A210C), fontSize: 12, fontWeight: FontWeight.w800)),
                const SizedBox(height: 3),
                Text('Pay for your completed ride with\nwallet and get $discount% off the final bill',
                  style: const TextStyle(color: Color(0xFF5E402A), fontSize: 9, height: 1.35)),
                if (compact) button,
              ],
            )),
            if (!compact) button,
          ]),
        ),
        const SizedBox(height: 8),
        const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _Dot(true), SizedBox(width: 6), _Dot(false), SizedBox(width: 6),
          _Dot(false), SizedBox(width: 6), _Dot(false),
        ]),
      ],
    ));
  }
}

class _Dot extends StatelessWidget {
  const _Dot(this.active);
  final bool active;
  @override
  Widget build(BuildContext context) => Container(
    width: active ? 11 : 7,
    height: 5,
    decoration: BoxDecoration(
      color: active ? const Color(0xFFFFA000) : const Color(0xFFE1E5EB),
      borderRadius: BorderRadius.circular(4),
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
