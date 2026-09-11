class MapPlace {
  const MapPlace({required this.address, required this.latitude, required this.longitude, this.name, this.placeId});

  final String address;
  final double latitude;
  final double longitude;
  final String? name;
  final String? placeId;

  factory MapPlace.fromJson(Map<String, dynamic> json) => MapPlace(
    address: json['address']?.toString() ?? '',
    latitude: (json['latitude'] as num).toDouble(),
    longitude: (json['longitude'] as num).toDouble(),
    name: json['name']?.toString(),
    placeId: json['placeId']?.toString(),
  );
}
