/** Haversine distance in meters between two WGS84 points */

const R_EARTH_M = 6_378_137;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_M * c;
}

/**
 * Minimum straight-line distance (meters) from a point to any vertex along a GeoJSON coordinates array.
 * Good enough when the polyline is dense (OSRM overview=full).
 * @param {number} lat
 * @param {number} lng
 * @param {Array<[number, number]>} coordinates GeoJSON coordinates [lng, lat][]
 */
export function minDistanceMetersPointToPolyline(lat, lng, coordinates) {
  if (!coordinates || !coordinates.length) return Infinity;

  let min = Infinity;
  for (const pt of coordinates) {
    const [plng, plat] = pt;
    if (!Number.isFinite(plat) || !Number.isFinite(plng)) continue;
    const d = haversineMeters(lat, lng, plat, plng);
    if (d < min) min = d;
  }
  return min;
}
