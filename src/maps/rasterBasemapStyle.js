/**
 * Provider-agnostic MapLibre raster basemap style.
 * Tile URLs use {z}/{x}/{y} placeholders (standard XYZ).
 */

const DEFAULT_RASTER_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Parses REACT_APP_MAP_RASTER_TILES: comma-separated list of tile URL templates.
 */
export function getRasterTileUrlsFromEnv(env = typeof process !== 'undefined' ? process.env : {}) {
  const raw = env.REACT_APP_MAP_RASTER_TILES;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) {
    return [DEFAULT_RASTER_TILES];
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getRasterAttributionFromEnv(env = typeof process !== 'undefined' ? process.env : {}) {
  const a = env.REACT_APP_MAP_RASTER_ATTRIBUTION;
  if (typeof a === 'string' && a.trim()) {
    return a.trim();
  }
  return DEFAULT_ATTRIBUTION;
}

/**
 * @param {{ tiles: string[], attribution?: string }} opts
 * @returns {import('maplibre-gl').StyleSpecification | object}
 */
export function createRasterBasemapStyle({ tiles, attribution = DEFAULT_ATTRIBUTION }) {
  const safeTiles = tiles && tiles.length ? tiles : [DEFAULT_RASTER_TILES];
  return {
    version: 8,
    name: 'raster-osm-compatible',
    sources: {
      basemap: {
        type: 'raster',
        tiles: safeTiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: 'basemap-raster',
        type: 'raster',
        source: 'basemap',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

/**
 * Convenience: style from CRA env vars.
 */
export function createRasterBasemapStyleFromEnv(env = typeof process !== 'undefined' ? process.env : {}) {
  return createRasterBasemapStyle({
    tiles: getRasterTileUrlsFromEnv(env),
    attribution: getRasterAttributionFromEnv(env),
  });
}
