import 'package:flutter/material.dart';

class PageArtworkBanner extends StatelessWidget {
  const PageArtworkBanner({
    super.key,
    required this.asset,
    this.height = 112,
    this.alignment = Alignment.centerRight,
  });

  final String asset;
  final double height;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(19),
    child: SizedBox(
      width: double.infinity,
      height: height,
      child: Image.asset(
        asset,
        fit: BoxFit.cover,
        alignment: alignment,
        filterQuality: FilterQuality.high,
      ),
    ),
  );
}
