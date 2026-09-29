import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

enum RjsMapPinKind { pickup, destination }

class RjsMapMarkers {
  RjsMapMarkers._();
  static BitmapDescriptor? _pickup;
  static BitmapDescriptor? _destination;
  static List<BitmapDescriptor>? _pickupFrames;

  static Future<BitmapDescriptor> pickup() async =>
      _pickup ??= await _render(RjsMapPinKind.pickup);
  static Future<BitmapDescriptor> destination() async =>
      _destination ??= await _render(RjsMapPinKind.destination);
  static Future<List<BitmapDescriptor>> pickupPulseFrames() async =>
      _pickupFrames ??= await Future.wait(
        List.generate(
          4,
          (index) => _render(RjsMapPinKind.pickup, waveProgress: index / 4),
        ),
      );

  static Future<BitmapDescriptor> _render(
    RjsMapPinKind kind, {
    double waveProgress = .72,
  }) async {
    const logicalSize = Size(48, 60), ratio = 3.0;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder)..scale(ratio);
    _RjsPinPainter(
      kind: kind,
      waveProgress: waveProgress,
    ).paint(canvas, logicalSize);
    final image = await recorder.endRecording().toImage(
      (logicalSize.width * ratio).round(),
      (logicalSize.height * ratio).round(),
    );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      imagePixelRatio: ratio,
    );
  }
}

class RjsPickupMarkerPulse {
  RjsPickupMarkerPulse(this.onFrame);
  final void Function(BitmapDescriptor icon) onFrame;
  Timer? _timer;
  int _index = 0;

  Future<void> start() async {
    final frames = await RjsMapMarkers.pickupPulseFrames();
    if (_timer != null) return;
    onFrame(frames.first);
    _timer = Timer.periodic(const Duration(milliseconds: 450), (_) {
      _index = (_index + 1) % frames.length;
      onFrame(frames[_index]);
    });
  }

  void dispose() => _timer?.cancel();
}

class RjsMapPin extends StatefulWidget {
  const RjsMapPin({
    super.key,
    required this.kind,
    this.animated = false,
    this.width = 54,
  });
  final RjsMapPinKind kind;
  final bool animated;
  final double width;

  @override
  State<RjsMapPin> createState() => _RjsMapPinState();
}

class _RjsMapPinState extends State<RjsMapPin>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    if (widget.animated && widget.kind == RjsMapPinKind.pickup) {
      _pulse.repeat();
    }
  }

  @override
  void didUpdateWidget(covariant RjsMapPin oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animated && widget.kind == RjsMapPinKind.pickup) {
      if (!_pulse.isAnimating) _pulse.repeat();
    } else {
      _pulse.stop();
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SizedBox(
    width: widget.width,
    height: widget.width * 1.25,
    child: AnimatedBuilder(
      animation: _pulse,
      builder: (_, _) => CustomPaint(
        painter: _RjsPinPainter(
          kind: widget.kind,
          waveProgress: widget.animated ? _pulse.value : .72,
        ),
      ),
    ),
  );
}

class _RjsPinPainter extends CustomPainter {
  const _RjsPinPainter({required this.kind, required this.waveProgress});
  final RjsMapPinKind kind;
  final double waveProgress;

  @override
  void paint(Canvas canvas, Size size) {
    final color = kind == RjsMapPinKind.pickup
        ? const Color(0xFF0756F8)
        : const Color(0xFFFF5A00);
    final sx = size.width / 72, sy = size.height / 90;
    canvas.save();
    canvas.scale(sx, sy);
    final wave = Curves.easeOut.transform(waveProgress);
    final wavePaint = Paint()
      ..color = color.withValues(
        alpha: (.28 * (1 - wave)).clamp(0, 1).toDouble(),
      )
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7;
    canvas.drawOval(
      Rect.fromCenter(
        center: const Offset(36, 78),
        width: 24 + 35 * wave,
        height: 8 + 14 * wave,
      ),
      wavePaint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(36, 78), width: 31, height: 11),
      Paint()..color = color.withValues(alpha: .14),
    );
    final stemPaint = Paint()
      ..color = color
      ..strokeWidth = 4.5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(36, 73), const Offset(36, 43), stemPaint);
    canvas.drawCircle(const Offset(36, 78), 5.5, Paint()..color = Colors.white);
    canvas.drawCircle(const Offset(36, 78), 3.2, Paint()..color = color);
    canvas.drawCircle(const Offset(36, 29), 24, Paint()..color = color);
    canvas.drawCircle(
      const Offset(36, 29),
      17.5,
      Paint()..color = Colors.white,
    );
    canvas.drawCircle(const Offset(36, 29), 10.5, Paint()..color = color);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _RjsPinPainter oldDelegate) =>
      oldDelegate.kind != kind || oldDelegate.waveProgress != waveProgress;
}
