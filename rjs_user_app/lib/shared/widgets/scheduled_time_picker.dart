import 'package:flutter/material.dart';

/// Only offers pickup times that satisfy the 30-minute scheduling minimum.
Future<TimeOfDay?> showScheduledTimePicker({
  required BuildContext context,
  required DateTime date,
  required TimeOfDay initialTime,
}) {
  return showModalBottomSheet<TimeOfDay>(
    context: context,
    showDragHandle: true,
    builder: (sheetContext) {
      final minimum = DateTime.now().add(const Duration(minutes: 30));
      final times = <TimeOfDay>[];
      for (var minute = 0; minute < 24 * 60; minute += 5) {
        final candidate = DateTime(date.year, date.month, date.day, minute ~/ 60, minute % 60);
        if (!candidate.isBefore(minimum)) {
          times.add(TimeOfDay(hour: minute ~/ 60, minute: minute % 60));
        }
      }
      return SafeArea(
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * .55,
          child: Column(
            children: [
              const Text('Select pickup time', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const Padding(
                padding: EdgeInsets.all(12),
                child: Text('Pickup must be at least 30 minutes from now.'),
              ),
              Expanded(
                child: times.isEmpty
                    ? const Center(child: Text('No available times today. Please choose a later date.'))
                    : ListView.builder(
                        itemExtent: 56,
                        itemCount: times.length,
                        itemBuilder: (_, index) => ListTile(
                          title: Text(times[index].format(sheetContext)),
                          selected: times[index] == initialTime,
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            final time = times[index];
                            final candidate = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                            if (candidate.isBefore(DateTime.now().add(const Duration(minutes: 30)))) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('This time is no longer available. Select a later time.')));
                              return;
                            }
                            Navigator.pop(sheetContext, time);
                          },
                        ),
                      ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
