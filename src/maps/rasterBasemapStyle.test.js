import { createRasterBasemapStyle, getRasterTileUrlsFromEnv } from './rasterBasemapStyle';

describe('rasterBasemapStyle', () => {
  test('defaults to OSM tile template when env empty', () => {
    const tiles = getRasterTileUrlsFromEnv({});
    expect(tiles).toEqual(['https://tile.openstreetmap.org/{z}/{x}/{y}.png']);
  });

  test('parses comma-separated tile URLs', () => {
    const tiles = getRasterTileUrlsFromEnv({
      REACT_APP_MAP_RASTER_TILES: 'https://a/{z}/{x}/{y}.png, https://b/{z}/{x}/{y}.png',
    });
    expect(tiles).toHaveLength(2);
    expect(tiles[0]).toContain('a');
  });

  test('creates raster style object', () => {
    const style = createRasterBasemapStyle({
      tiles: ['https://tile.example.org/{z}/{x}/{y}.png'],
      attribution: '&copy; Example',
    });
    expect(style.version).toBe(8);
    expect(style.sources.basemap.type).toBe('raster');
    expect(style.sources.basemap.tiles).toHaveLength(1);
    expect(style.layers[0].type).toBe('raster');
  });
});
