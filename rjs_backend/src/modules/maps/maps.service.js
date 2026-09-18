import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';

function apiKey() {
  if (!env.GOOGLE_MAPS_SERVER_API_KEY) {
    throw new AppError(503, 'MAPS_NOT_CONFIGURED', 'Google Maps is not configured on the server');
  }
  return env.GOOGLE_MAPS_SERVER_API_KEY;
}

async function googleJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  } catch (_) {
    throw new AppError(502, 'MAPS_UNAVAILABLE', 'Google Maps could not be reached');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(502, 'MAPS_REQUEST_FAILED', data.error?.message || 'Google Maps rejected the request');
  }
  return data;
}

async function autocompletePlaces({ input, sessionToken, latitude, longitude }) {
  const body = {
    input,
    sessionToken,
    includedRegionCodes: ['in'],
    languageCode: 'en',
    regionCode: 'IN',
  };
  if (latitude != null && longitude != null) {
    body.locationBias = {
      circle: { center: { latitude, longitude }, radius: 50000 },
    };
  }
  const data = await googleJson('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify(body),
  });
  return (data.suggestions || []).flatMap((item) => {
    const place = item.placePrediction;
    if (!place) return [];
    return [{
      placeId: place.placeId,
      description: place.text?.text || '',
      primaryText: place.structuredFormat?.mainText?.text || place.text?.text || '',
      secondaryText: place.structuredFormat?.secondaryText?.text || '',
    }];
  });
}

async function getPlace(placeId, sessionToken) {
  const params = new URLSearchParams({
    languageCode: 'en',
    regionCode: 'IN',
    ...(sessionToken ? { sessionToken } : {}),
  });
  const data = await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${params}`, {
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });
  return {
    placeId: data.id,
    name: data.displayName?.text || '',
    address: data.formattedAddress || data.displayName?.text || '',
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
  };
}

async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({ latlng: `${latitude},${longitude}`, key: apiKey() });
  const data = await googleJson(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  if (data.status !== 'OK' || !data.results?.length) {
    throw new AppError(422, 'ADDRESS_NOT_FOUND', 'No address was found for this location');
  }
  return {
    placeId: data.results[0].place_id,
    address: data.results[0].formatted_address,
    latitude,
    longitude,
  };
}

async function computeRoute({ origin, destination }) {
  const data = await googleJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
      destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-IN',
      units: 'METRIC',
    }),
  });
  const route = data.routes?.[0];
  if (!route) throw new AppError(422, 'ROUTE_NOT_FOUND', 'No driving route was found');
  const duration = typeof route.duration === 'string' && /^\d+(?:\.\d+)?s$/.test(route.duration)
    ? Number(route.duration.slice(0, -1))
    : NaN;
  // Only accept an omitted distance for an explicitly zero-duration route.
  const distanceMeters = route.distanceMeters === undefined && duration === 0
    ? 0
    : route.distanceMeters;
  if (!Number.isFinite(duration) || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new AppError(502, 'INVALID_ROUTE_RESPONSE', 'Google Maps returned incomplete route details. Please refresh your pickup route.');
  }
  const seconds = duration;
  return {
    distanceMeters,
    distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
    durationSeconds: Math.round(seconds),
    durationMinutes: Math.max(1, Math.ceil(seconds / 60)),
    encodedPolyline: route.polyline?.encodedPolyline || '',
  };
}

export { autocompletePlaces, computeRoute, getPlace, reverseGeocode };
