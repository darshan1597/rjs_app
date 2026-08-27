import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class BookRidePopup extends StatelessWidget {
  const BookRidePopup({super.key, required this.onVehicleSelected});

  final ValueChanged<String> onVehicleSelected;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        padding: const EdgeInsets.fromLTRB(14, 18, 14, 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE7EAF0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x260A244A),
              blurRadius: 28,
              offset: Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(left: 2, bottom: 15),
              child: Text(
                'Choose your vehicle',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            _VehicleCard(
              title: 'Bus',
              subtitle: 'Perfect for large groups',
              imageAsset: 'assets/images/popup-bus.png',
              height: 112,
              onTap: () => onVehicleSelected('Bus'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _VehicleCard(
                    title: 'Tempo Traveller',
                    subtitle: 'For family & groups',
                    imageAsset: 'assets/images/popup-tempo-traveller.png',
                    height: 144,
                    compact: true,
                    onTap: () => onVehicleSelected('Tempo Traveller'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _VehicleCard(
                    title: 'Car',
                    subtitle: 'For everyday rides',
                    imageAsset: 'assets/images/popup-car.png',
                    height: 144,
                    compact: true,
                    onTap: () => onVehicleSelected('Car'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      Transform.translate(
        offset: const Offset(0, -2),
        child: CustomPaint(
          size: const Size(30, 16),
          painter: _PopupArrowPainter(),
        ),
      ),
    ],
  );
}

class _VehicleCard extends StatelessWidget {
  const _VehicleCard({
    required this.title,
    required this.subtitle,
    required this.imageAsset,
    required this.height,
    required this.onTap,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final String imageAsset;
  final double height;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xFFF9FAFC),
    borderRadius: BorderRadius.circular(15),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(15),
      child: Container(
        height: height,
        padding: EdgeInsets.symmetric(horizontal: compact ? 10 : 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE6E9EF)),
        ),
        child: compact
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 82,
                    child: Image.asset(
                      imageAsset,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.high,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 9.5,
                    ),
                  ),
                ],
              )
            : Row(
                children: [
                  SizedBox(
                    width: 132,
                    height: 100,
                    child: Image.asset(
                      imageAsset,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.high,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: AppColors.muted,
                    size: 15,
                  ),
                ],
              ),
      ),
    ),
  );
}

class _PopupArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(_PopupArrowPainter oldDelegate) => false;
}
