import { buildDriverLocationPayload } from './driverTelemetryPayload';

describe('buildDriverLocationPayload', () => {
  test('returns ISO timestamp and coordinates', () => {
    const position = { coords: { latitude: 1.23, longitude: 4.56 } };
    const p = buildDriverLocationPayload(position);
    expect(p.lat).toBe(1.23);
    expect(p.lng).toBe(4.56);
    expect(p.isOnline).toBe(true);
    expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
