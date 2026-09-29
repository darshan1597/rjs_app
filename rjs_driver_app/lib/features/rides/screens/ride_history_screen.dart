import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/driver_api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/driver_bottom_bar.dart';
import '../../../shared/widgets/driver_header_actions.dart';
import '../../earnings/screens/earnings_screen.dart';
import '../../home/screens/driver_home_screen.dart';
import '../../profile/screens/driver_profile_screen.dart';
import '../../trips/screens/scheduled_rides_screen.dart';

class RideHistoryScreen extends StatefulWidget {
  const RideHistoryScreen({super.key});
  @override
  State<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends State<RideHistoryScreen> {
  static const fileChannel = MethodChannel('rjs.driver/files');
  static const statuses = ['ALL', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  int filter = 0;
  bool online = false, loading = true, changingStatus = false;
  Map<String, dynamic> summary = const {};
  List<Map<String, dynamic>> rides = const [];

  @override
  void initState() { super.initState(); unawaited(load()); }

  Future<void> load() async {
    if (mounted) setState(() => loading = true);
    try {
      final values = await Future.wait([
        DriverApiService.rideHistory(statuses[filter]),
        DriverApiService.profile(),
      ]);
      if (!mounted) return;
      final driver = values[1]['driver'] as Map<String, dynamic>?;
      setState(() {
        summary = values[0]['summary'] as Map<String, dynamic>? ?? const {};
        rides = (values[0]['rides'] as List? ?? const []).cast<Map<String, dynamic>>();
        online = driver?['operationalStatus'] != 'OFFLINE';
      });
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally { if (mounted) setState(() => loading = false); }
  }

  Future<void> changeFilter(int value) async {
    if (filter == value) return;
    setState(() => filter = value);
    await load();
  }

  Future<void> toggleOnline() async {
    if (changingStatus) return;
    setState(() => changingStatus = true);
    try {
      await DriverApiService.setOnline(!online);
      if (mounted) setState(() => online = !online);
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally { if (mounted) setState(() => changingStatus = false); }
  }

  Future<void> exportHistory() async {
    if (rides.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('There are no rides to export.')));
      return;
    }
    final lines = <String>[
      'Booking,Date,Status,Pickup,Destination,Distance km,Amount,Payment',
      ...rides.map((r) => [r['bookingNumber'], dateTime(r['occurredAt']), r['status'], csv(r['pickup']?['address']), csv(r['destination']?['address']), r['distanceKm'], r['amount'], r['paymentMethod']].join(',')),
    ];
    try {
      final saved = await fileChannel.invokeMethod<bool>('exportCsv', {
        'fileName': 'RJS-ride-history.csv',
        'content': '\uFEFF${lines.join('\n')}',
      });
      if (mounted && saved == true) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ride history file saved.')));
    } on MissingPluginException {
      await Clipboard.setData(ClipboardData(text: lines.join('\n')));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('History copied. Restart the app to enable file saving.')));
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Unable to save history: $error')));
    }
  }

  void selectTab(int index) {
    final page = switch (index) {
      0 => const DriverHomeScreen(), 1 => const ScheduledRidesScreen(),
      3 => const EarningsScreen(), 4 => const DriverProfileScreen(), _ => null,
    };
    if (page != null) Navigator.of(context).pushReplacement(MaterialPageRoute<void>(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: const SystemUiOverlayStyle(statusBarColor: Colors.white, statusBarIconBrightness: Brightness.dark, systemNavigationBarColor: Colors.white, systemNavigationBarIconBrightness: Brightness.dark),
    child: Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(bottom: false, child: RefreshIndicator(
        onRefresh: load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            SliverPadding(padding: const EdgeInsets.fromLTRB(16, 8, 17, 15), sliver: SliverToBoxAdapter(child: HistoryHeader(onBack: () => Navigator.of(context).pop()))),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(15, 0, 15, 20 + MediaQuery.paddingOf(context).bottom),
              sliver: SliverList.list(children: [
                FilterTabs(selected: filter, onSelected: changeFilter),
                const SizedBox(height: 12), SummaryCard(data: summary), const SizedBox(height: 14),
                if (loading) const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()))
                else if (rides.isEmpty) const EmptyHistory()
                else ...historyRows(rides),
                const SizedBox(height: 5), ExportCard(onPressed: exportHistory),
              ]),
            ),
          ],
        ),
      )),
      bottomNavigationBar: DriverBottomBar(selectedIndex: -1, isOnline: online, onSelected: selectTab, onStatusTap: changingStatus ? () {} : () => unawaited(toggleOnline())),
    ),
  );
}

List<Widget> historyRows(List<Map<String, dynamic>> rides) {
  final result = <Widget>[]; String? prior;
  for (final ride in rides) {
    final current = dateOnly(ride['occurredAt']);
    if (current != prior) { result.add(DateHeading(current)); result.add(const SizedBox(height: 8)); prior = current; }
    result.add(RideCard(ride)); result.add(const SizedBox(height: 9));
  }
  return result;
}

String csv(Object? value) => '"${(value?.toString() ?? '').replaceAll('"', '""')}"';
DateTime? parsedDate(Object? value) => DateTime.tryParse(value?.toString() ?? '')?.toLocal();
String dateOnly(Object? value) { final d = parsedDate(value); if (d == null) return 'Date unavailable'; const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return '${d.day} ${m[d.month - 1]} ${d.year}'; }
String dateTime(Object? value) { final d = parsedDate(value); if (d == null) return 'Not available'; final h = d.hour % 12 == 0 ? 12 : d.hour % 12; return '${dateOnly(value)} · $h:${d.minute.toString().padLeft(2, '0')} ${d.hour >= 12 ? 'PM' : 'AM'}'; }
String money(Object? value) { final n = (value as num?)?.round() ?? 0; return '₹${n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}'; }

class HistoryHeader extends StatelessWidget {
  const HistoryHeader({required this.onBack, super.key}); final VoidCallback onBack;
  @override Widget build(BuildContext context) => Row(children: [
    Material(color: Colors.white, shape: const CircleBorder(), elevation: 2, child: InkWell(onTap: onBack, customBorder: const CircleBorder(), child: const SizedBox(width: 43, height: 43, child: Icon(Icons.arrow_back_rounded, color: AppColors.navy)))),
    const SizedBox(width: 12),
    const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Ride History', style: TextStyle(color: AppColors.navy, fontSize: 21, fontWeight: FontWeight.w800)), Text('All your completed and cancelled trips', style: TextStyle(color: AppColors.muted, fontSize: 10.5))])),
    const DriverHeaderActions(),
  ]);
}

class FilterTabs extends StatelessWidget {
  const FilterTabs({required this.selected, required this.onSelected, super.key}); final int selected; final ValueChanged<int> onSelected;
  static const labels = ['All', 'Completed', 'Cancelled', 'No Show'];
  static const colors = [AppColors.green, AppColors.green, AppColors.red, AppColors.orange];
  @override Widget build(BuildContext context) => Container(height: 50, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(13), border: Border.all(color: AppColors.border)), child: Row(children: List.generate(4, (i) => Expanded(child: InkWell(onTap: () => onSelected(i), child: Container(alignment: Alignment.center, decoration: BoxDecoration(border: Border(bottom: BorderSide(color: selected == i ? colors[i] : Colors.transparent, width: 2))), child: Text(labels[i], overflow: TextOverflow.ellipsis, style: TextStyle(color: selected == i ? colors[i] : AppColors.navy, fontSize: 9.5, fontWeight: FontWeight.w700))))))));
}

class SummaryCard extends StatelessWidget {
  const SummaryCard({required this.data, super.key}); final Map<String, dynamic> data;
  @override Widget build(BuildContext context) {
    final values = [('${(data['totalRides'] as num?)?.toInt() ?? 0}', 'Total Rides', AppColors.green), ('${(data['completed'] as num?)?.toInt() ?? 0}', 'Completed', AppColors.green), ('${(data['cancelled'] as num?)?.toInt() ?? 0}', 'Cancelled', AppColors.red), (money(data['earnings']), 'Earnings', AppColors.orange)];
    return Panel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Summary (This Month)', style: TextStyle(color: AppColors.navy, fontSize: 12.5, fontWeight: FontWeight.w800)), const SizedBox(height: 13), Row(children: List.generate(4, (i) => Expanded(child: Container(decoration: BoxDecoration(border: i == 3 ? null : const Border(right: BorderSide(color: AppColors.border))), child: Column(children: [Text(values[i].$1, style: const TextStyle(color: AppColors.navy, fontSize: 14, fontWeight: FontWeight.w800)), Text(values[i].$2, textAlign: TextAlign.center, style: TextStyle(color: values[i].$3, fontSize: 8))]))))) ]));
  }
}

class DateHeading extends StatelessWidget { const DateHeading(this.text, {super.key}); final String text; @override Widget build(BuildContext context) => Text(text, style: const TextStyle(color: AppColors.navy, fontSize: 11.5, fontWeight: FontWeight.w800)); }

class RideCard extends StatelessWidget {
  const RideCard(this.ride, {super.key}); final Map<String, dynamic> ride;
  @override Widget build(BuildContext context) {
    final status = ride['status']?.toString() ?? ''; final complete = status == 'COMPLETED'; final color = complete ? AppColors.green : status == 'NO_SHOW' ? AppColors.orange : AppColors.red;
    final pickup = ride['pickup'] as Map<String, dynamic>? ?? const {}; final drop = ride['destination'] as Map<String, dynamic>? ?? const {};
    return GestureDetector(onTap: () => showRideDetails(context, ride), child: Panel(color: complete ? Colors.white : const Color(0xFFFFF8F8), child: Row(children: [
      SizedBox(width: 74, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(dateTime(ride['occurredAt']).split(' · ').last, style: const TextStyle(color: AppColors.navy, fontSize: 11, fontWeight: FontWeight.w800)), const SizedBox(height: 9), Text(status.replaceAll('_', ' '), style: TextStyle(color: color, fontSize: 7.5, fontWeight: FontWeight.w800))])),
      const SizedBox(height: 64, child: VerticalDivider()), const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(pickup['address']?.toString() ?? 'Pickup', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.navy, fontSize: 10.5, fontWeight: FontWeight.w800)), const SizedBox(height: 10), Text(drop['address']?.toString() ?? 'Destination unavailable', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.navy, fontSize: 10.5, fontWeight: FontWeight.w800))])),
      const SizedBox(width: 7), SizedBox(width: 62, child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [Text(money(ride['amount']), style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w800)), Text('${ride['distanceKm'] ?? 0} km', style: const TextStyle(color: AppColors.muted, fontSize: 8.5))])), const Icon(Icons.chevron_right_rounded, color: AppColors.navy, size: 20),
    ])));
  }
}

void showRideDetails(BuildContext context, Map<String, dynamic> ride) {
  final pickup = ride['pickup'] as Map<String, dynamic>? ?? const {}; final drop = ride['destination'] as Map<String, dynamic>? ?? const {}; final cancellation = ride['cancellation'] as Map<String, dynamic>? ?? const {};
  final rows = [('Booking', ride['bookingNumber']?.toString() ?? 'N/A'), ('Date', dateTime(ride['occurredAt'])), ('Status', (ride['status']?.toString() ?? '').replaceAll('_', ' ')), ('Pickup', pickup['address']?.toString() ?? 'N/A'), ('Destination', drop['address']?.toString() ?? 'N/A'), ('Distance', '${ride['distanceKm'] ?? 0} km'), ('Amount', money(ride['amount'])), ('Payment', ride['paymentMethod']?.toString() ?? 'N/A'), if (cancellation['reason'] != null) ('Reason', cancellation['reason'].toString())];
  showModalBottomSheet<void>(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => SafeArea(child: Container(padding: const EdgeInsets.all(20), decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Ride Details', style: TextStyle(color: AppColors.navy, fontSize: 19, fontWeight: FontWeight.w800)), const SizedBox(height: 12), ...rows.map((r) => Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: Text(r.$1, style: const TextStyle(color: AppColors.muted, fontSize: 11))), Expanded(child: Text(r.$2, textAlign: TextAlign.right, style: const TextStyle(color: AppColors.navy, fontSize: 12, fontWeight: FontWeight.w700)))])))]))));
}

class ExportCard extends StatelessWidget { const ExportCard({required this.onPressed, super.key}); final VoidCallback onPressed; @override Widget build(BuildContext context) => Panel(color: const Color(0xFFF7FCF9), child: Row(children: [const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Need a record of your rides?', style: TextStyle(color: AppColors.green, fontSize: 10.5, fontWeight: FontWeight.w800)), Text('Save in spreadsheet-compatible format', style: TextStyle(color: AppColors.muted, fontSize: 8.5))])), OutlinedButton.icon(onPressed: onPressed, icon: const Icon(Icons.download_rounded, size: 16), label: const Text('Download'))])); }
class EmptyHistory extends StatelessWidget { const EmptyHistory({super.key}); @override Widget build(BuildContext context) => const Padding(padding: EdgeInsets.all(34), child: Center(child: Text('No rides found', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800)))); }
class Panel extends StatelessWidget { const Panel({required this.child, this.color = Colors.white, super.key}); final Widget child; final Color color; @override Widget build(BuildContext context) => Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border), boxShadow: const [BoxShadow(color: Color(0x0B17345F), blurRadius: 13, offset: Offset(0, 5))]), child: child); }
