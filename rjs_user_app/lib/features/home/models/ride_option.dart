import 'package:flutter/material.dart';

class RideOption {
  const RideOption({
    required this.name,
    required this.description,
    required this.price,
    required this.arrival,
    required this.seats,
    required this.icon,
    required this.imageAsset,
  });
  final String name, description, price, arrival;
  final int seats;
  final IconData icon;
  final String imageAsset;
}

const rideOptions = [
  RideOption(
    name: 'RJS Go',
    description: 'Affordable rides for everyday travel',
    price: '\u20B9180',
    arrival: '2 min',
    seats: 4,
    icon: Icons.directions_car_filled_rounded,
    imageAsset: 'assets/images/ride-sedan.png',
  ),
  RideOption(
    name: 'RJS Prime',
    description: 'Comfortable rides with extra space',
    price: '\u20B9260',
    arrival: '3 min',
    seats: 4,
    icon: Icons.local_taxi_rounded,
    imageAsset: 'assets/images/ride-sedan.png',
  ),
  RideOption(
    name: 'RJS XL',
    description: 'Ride together in larger vehicles',
    price: '\u20B9360',
    arrival: '4 min',
    seats: 6,
    icon: Icons.airport_shuttle_rounded,
    imageAsset: 'assets/images/ride-suv.png',
  ),
];
