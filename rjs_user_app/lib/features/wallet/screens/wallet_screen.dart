import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/book_ride_scaffold.dart';
import '../../../shared/widgets/notification_popup.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _showBalance = true;

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
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
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
                const SizedBox(height: 14),
                _BalanceCard(
                  showBalance: _showBalance,
                  onToggle: () => setState(() => _showBalance = !_showBalance),
                ),
                const SizedBox(height: 10),
                const _QuickActions(),
                const SizedBox(height: 10),
                const _WalletPromo(),
                const SizedBox(height: 10),
                const _RecentTransactions(),
                const SizedBox(height: 10),
                const _OffersPanel(),
              ],
            ),
          ),
        ],
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
  const _BalanceCard({required this.showBalance, required this.onToggle});
  final bool showBalance;
  final VoidCallback onToggle;

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
                    showBalance ? '₹2,450.00' : '₹ ••••••',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 29,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: onToggle,
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
                  onPressed: () {},
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('Add Money'),
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
        const SizedBox(height: 15),
        Container(height: 1, color: Colors.white24),
        const SizedBox(height: 13),
        const Row(
          children: [
            Expanded(child: _BalancePart('₹2,000.00', 'Main Balance')),
            _WhiteDivider(),
            Expanded(
              child: _BalancePart('₹450.00', 'Bonus Balance', info: true),
            ),
            _WhiteDivider(),
            Expanded(
              child: _BalancePart('₹0.00', 'Locked Balance', info: true),
            ),
          ],
        ),
      ],
    ),
  );
}

class _BalancePart extends StatelessWidget {
  const _BalancePart(this.amount, this.label, {this.info = false});
  final String amount;
  final String label;
  final bool info;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 7),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          amount,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                style: const TextStyle(color: Colors.white, fontSize: 9.5),
              ),
            ),
            if (info) ...[
              const SizedBox(width: 4),
              const Icon(
                Icons.info_outline_rounded,
                color: Colors.white,
                size: 11,
              ),
            ],
          ],
        ),
      ],
    ),
  );
}

class _WhiteDivider extends StatelessWidget {
  const _WhiteDivider();
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 32, color: Colors.white24);
}

class _QuickActions extends StatelessWidget {
  const _QuickActions();
  static const actions = [
    (
      Icons.currency_rupee_rounded,
      'Add Money',
      'Top up wallet',
      AppColors.blue,
    ),
    (
      Icons.swap_horiz_rounded,
      'Send Money',
      'Transfer to others',
      Color(0xFF8B3DE0),
    ),
    (
      Icons.receipt_long_outlined,
      'Transaction',
      'View history',
      Color(0xFFFF9A00),
    ),
    (Icons.local_offer_outlined, 'Offers', 'View all offers', AppColors.orange),
  ];
  @override
  Widget build(BuildContext context) => Row(
    children: List.generate(
      actions.length,
      (i) => Expanded(
        child: Padding(
          padding: EdgeInsets.only(right: i == actions.length - 1 ? 0 : 6),
          child: Container(
            height: 94,
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C102040),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: actions[i].$4.withValues(alpha: .09),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(actions[i].$1, color: actions[i].$4, size: 22),
                ),
                const SizedBox(height: 6),
                FittedBox(
                  child: Text(
                    actions[i].$2,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                FittedBox(
                  child: Text(
                    actions[i].$3,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 8.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _WalletPromo extends StatelessWidget {
  const _WalletPromo();
  @override
  Widget build(BuildContext context) => Container(
    height: 94,
    padding: const EdgeInsets.symmetric(horizontal: 12),
    decoration: BoxDecoration(
      color: const Color(0xFFF2F7FF),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Image.asset(
          'assets/images/wallet-promo-transparent.png',
          width: 88,
          height: 76,
          fit: BoxFit.contain,
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Use Wallet for faster bookings',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 5),
              Text(
                'Get exclusive offers and cashback\non every booking',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 10,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.sell_outlined, size: 15),
          label: const Text('View Offers'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.blue,
            side: const BorderSide(color: AppColors.blue),
            padding: const EdgeInsets.symmetric(horizontal: 9),
            textStyle: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _RecentTransactions extends StatelessWidget {
  const _RecentTransactions();
  static const transactions = [
    (
      'Added to Wallet',
      'Via UPI',
      '+ ₹2,000.00',
      '24 May 2026, 10:30 AM',
      true,
    ),
    (
      'Bangalore City Tour',
      'Booking ID: #RJS12345',
      '- ₹2,499.00',
      '24 May 2026, 09:15 AM',
      false,
    ),
    (
      'Cashback Received',
      'Bangalore City Tour',
      '+ ₹249.90',
      '24 May 2026, 09:20 AM',
      true,
    ),
    (
      'Mysore One Day Trip',
      'Booking ID: #RJS12340',
      '- ₹4,499.00',
      '20 May 2026, 11:45 AM',
      false,
    ),
    (
      'Added to Wallet',
      'Via Debit Card',
      '+ ₹3,000.00',
      '18 May 2026, 08:10 PM',
      true,
    ),
  ];
  @override
  Widget build(BuildContext context) => _Panel(
    padding: const EdgeInsets.fromLTRB(10, 11, 10, 5),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(child: _Title('Recent Transactions')),
            TextButton(
              onPressed: () {},
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
            children: List.generate(transactions.length, (i) {
              final item = transactions[i];
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
          ),
        ),
      ],
    ),
  );
}

class _OffersPanel extends StatelessWidget {
  const _OffersPanel();
  @override
  Widget build(BuildContext context) => _Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Title('Offers & Benefits'),
        const SizedBox(height: 9),
        Container(
          height: 78,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFFF4DA), Color(0xFFFFFAEC)],
            ),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Row(
            children: [
              Image.asset(
                'assets/images/wallet-offer-gift-transparent.png',
                width: 90,
                height: 72,
                fit: BoxFit.contain,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Get up to ₹250 Cashback',
                      style: TextStyle(
                        color: Color(0xFF3A210C),
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Add money to wallet and get instant\ncashback on your next booking',
                      style: TextStyle(
                        color: Color(0xFF5E402A),
                        fontSize: 9,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF8A00),
                  side: const BorderSide(color: Color(0xFFFF9A00)),
                  padding: const EdgeInsets.symmetric(horizontal: 9),
                  textStyle: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: const Text('Add Money Now'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _Dot(true),
            SizedBox(width: 6),
            _Dot(false),
            SizedBox(width: 6),
            _Dot(false),
            SizedBox(width: 6),
            _Dot(false),
          ],
        ),
      ],
    ),
  );
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
