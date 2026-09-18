import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({ env: { GOOGLE_MAPS_SERVER_API_KEY: 'test-key' } }));
import { computeRoute } from './maps.service.js';

const points = { origin: { latitude: 12, longitude: 77 }, destination: { latitude: 13, longitude: 78 } };
function respond(route) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [route] }) }));
}

afterEach(() => vi.unstubAllGlobals());

describe('route response validation', () => {
  it('returns a valid driving route', async () => {
    respond({ distanceMeters: 1234, duration: '120.5s', polyline: { encodedPolyline: 'route' } });
    await expect(computeRoute(points)).resolves.toEqual({ distanceMeters: 1234, distanceKm: 1.23, durationSeconds: 121, durationMinutes: 3, encodedPolyline: 'route' });
  });

  it.each([0, undefined])('handles a zero-duration route with distance %s', async (distanceMeters) => {
    respond({ distanceMeters, duration: '0s' });
    await expect(computeRoute(points)).resolves.toMatchObject({ distanceMeters: 0, distanceKm: 0, durationSeconds: 0 });
  });

  it.each([
    { duration: '60s' },
    { distanceMeters: 100 },
    { distanceMeters: NaN, duration: '60s' },
    { distanceMeters: -1, duration: '60s' },
    { distanceMeters: '100', duration: '60s' },
    { distanceMeters: 100, duration: 'invalid' },
    { distanceMeters: 100, duration: '-60s' },
    { distanceMeters: 100, duration: '60sjunk' },
    { distanceMeters: null, duration: '0s' },
  ])('rejects incomplete or malformed route details: %j', async (route) => {
    respond(route);
    await expect(computeRoute(points)).rejects.toMatchObject({ code: 'INVALID_ROUTE_RESPONSE' });
  });
});
