/**
 * Canonical courier location publish shape for socket + REST fallback.
 * Timestamps are always ISO 8601 (UTC) strings.
 */
export function buildDriverLocationPayload(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    timestamp: new Date().toISOString(),
    isOnline: true,
  };
}
