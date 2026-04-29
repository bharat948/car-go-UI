import { haversineMeters, minDistanceMetersPointToPolyline } from './geoRouteDeviation';

describe('geoRouteDeviation', () => {
  test('haversine is small for nearby points', () => {
    const d = haversineMeters(13.08, 80.27, 13.09, 80.27);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(13000);
  });

  test('minDistance to polyline finds closest vertex', () => {
    const coords = [
      [80.0, 7.0],
      [80.1, 7.05],
      [80.2, 7.1],
    ];
    const d = minDistanceMetersPointToPolyline(7.052, 80.099, coords);
    expect(d).toBeLessThan(50_000);
    expect(Number.isFinite(d)).toBe(true);
  });
});
