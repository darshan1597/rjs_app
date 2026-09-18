Uri pickupNavigationUrl({required Map origin, required Map destination}) {
  String coordinates(Map point) {
    final latitude = point['latitude'];
    final longitude = point['longitude'];
    if (latitude is! num || longitude is! num ||
        !latitude.isFinite || !longitude.isFinite ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw const FormatException('Invalid navigation coordinates');
    }
    return '$latitude,$longitude';
  }

  return Uri.https('www.google.com', '/maps/dir/', {
    'api': '1',
    'origin': coordinates(origin),
    'destination': coordinates(destination),
    'travelmode': 'driving',
    'dir_action': 'navigate',
  });
}
