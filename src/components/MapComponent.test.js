import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import MapComponent from './MapComponent';
import axiosInstance from '../api/axiosInstance';

const mockNavigate = jest.fn();
let mockSocketHandlers = {};
let mockMarkerProps = [];

jest.mock('../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));
jest.mock('maplibre-gl', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('react-map-gl', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="map">{children}</div>,
  Marker: ({ children, latitude, longitude }) => {
    mockMarkerProps.push({ latitude, longitude, children });
    return <div>{children}</div>;
  },
  Popup: ({ children }) => <div>{children}</div>,
  Source: ({ children }) => <div data-testid="route-source">{children}</div>,
  Layer: () => <div data-testid="route-layer" />,
}));
jest.mock('socket.io-client', () => ({
  io: () => {
    mockSocketHandlers = {};
    return {
      on: (event, handler) => {
        mockSocketHandlers[event] = handler;
      },
      io: {
        on: jest.fn(),
      },
      disconnect: jest.fn(),
    };
  },
}));

describe('MapComponent auth token handling', () => {
  const originalRasterTiles = process.env.REACT_APP_MAP_RASTER_TILES;
  const mockRoutePayload = {
    routes: [{
      distance: 12500,
      duration: 1800,
      geometry: {
        coordinates: [[80.63, 7.29], [80.7, 7.4]],
      },
    }],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockMarkerProps = [];
    delete process.env.REACT_APP_MAP_RASTER_TILES;
    axiosInstance.get.mockResolvedValue({
      data: [{
        id: 'pkg-1',
        status: 'in_transit',
        pickupLocation: 'Pickup',
        destination: 'Drop',
        picklat: 7.29,
        picklng: 80.63,
        destlat: 7.4,
        destlng: 80.7,
      }],
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRoutePayload,
    });
    window.localStorage.setItem('token', 'initial-token');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    if (originalRasterTiles === undefined) {
      delete process.env.REACT_APP_MAP_RASTER_TILES;
    } else {
      process.env.REACT_APP_MAP_RASTER_TILES = originalRasterTiles;
    }
    window.localStorage.removeItem('token');
    delete global.fetch;
  });

  test('clears driver markers when token is removed', async () => {
    render(<MapComponent />);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/packages');
    });

    await act(async () => {
      mockSocketHandlers['driver-update']({
        id: 'driver-1',
        userId: 'courier-1',
        lat: 7.29,
        lng: 80.63,
        isOnline: true,
        lastUpdated: new Date().toISOString(),
      });
    });

    expect(screen.getByTitle(/courier-1/i)).toBeInTheDocument();

    await act(async () => {
      window.localStorage.removeItem('token');
      window.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.queryByTitle(/courier-1/i)).not.toBeInTheDocument();
    });
  });

  test('shows nav panel data when route fetch succeeds', async () => {
    render(<MapComponent />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText(/12\.5 km remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/ETA 30 min/i)).toBeInTheDocument();
    expect(screen.getByTestId('route-layer')).toBeInTheDocument();
  });

  test('shows fallback when route fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<MapComponent />);

    await waitFor(() => {
      expect(screen.getByText(/Could not fetch live route/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('route-layer')).not.toBeInTheDocument();
  });

  test('accepts numeric-string driver coordinates from socket updates', async () => {
    render(<MapComponent />);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/packages');
    });

    await act(async () => {
      mockSocketHandlers['driver-update']({
        id: 'driver-2',
        userId: 'courier-2',
        lat: '7.291',
        lng: '80.634',
        isOnline: true,
        lastUpdated: new Date().toISOString(),
      });
    });

    expect(screen.getByTitle(/courier-2/i)).toBeInTheDocument();
    const driverMarker = mockMarkerProps.find((entry) => {
      const markerChild = entry.children;
      return markerChild?.props?.title?.includes('courier-2');
    });
    expect(driverMarker).toBeDefined();
    expect(typeof driverMarker.latitude).toBe('number');
    expect(typeof driverMarker.longitude).toBe('number');
    expect(driverMarker.latitude).toBeCloseTo(7.291);
    expect(driverMarker.longitude).toBeCloseTo(80.634);
  });

  test('skips rendering package markers with invalid pickup coordinates', async () => {
    axiosInstance.get.mockResolvedValue({
      data: [
        {
          id: 'pkg-valid',
          status: 'pending',
          pickupLocation: 'Pickup A',
          destination: 'Drop A',
          picklat: 7.29,
          picklng: 80.63,
        },
        {
          id: 'pkg-invalid',
          status: 'pending',
          pickupLocation: 'Pickup B',
          destination: 'Drop B',
          picklat: 'not-a-number',
          picklng: 80.7,
        },
      ],
    });

    render(<MapComponent />);

    await waitFor(() => {
      expect(screen.getByText(/2 active packages/i)).toBeInTheDocument();
    });

    const packageMarkerCount = mockMarkerProps.filter((entry) => {
      const markerHead = entry.children?.props?.children?.[0]?.props?.children;
      return markerHead === '📦';
    }).length;
    expect(packageMarkerCount).toBe(1);
  });
});
