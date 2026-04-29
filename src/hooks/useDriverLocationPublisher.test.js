import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import useDriverLocationPublisher from './useDriverLocationPublisher';
import axiosInstance from '../api/axiosInstance';
import { io } from 'socket.io-client';

jest.mock('../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));
jest.mock('socket.io-client');

function HookHarness({ enabled = true, isCourier = true, onState }) {
  const state = useDriverLocationPublisher({ enabled, isCourier });
  React.useEffect(() => {
    onState(state);
  }, [onState, state]);
  return null;
}

describe('useDriverLocationPublisher', () => {
  const originalGeolocation = global.navigator.geolocation;
  let emitAck;
  let geolocationCalls;

  beforeEach(() => {
    jest.useFakeTimers();
    geolocationCalls = 0;

    window.localStorage.setItem('token', 'valid-token');

    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((success) => {
        geolocationCalls += 1;
        success({
          coords: { latitude: 7.2, longitude: 80.6 },
        });
      }),
    };

    io.mockImplementation(() => ({
      connected: true,
      emit: jest.fn((event, payload, ack) => {
        if (event === 'driver-location' && typeof ack === 'function') {
          emitAck = ack;
        }
      }),
      disconnect: jest.fn(),
    }));

    axiosInstance.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    window.localStorage.removeItem('token');
    global.navigator.geolocation = originalGeolocation;
  });

  test('halts future publishing after NO_ACTIVE_COURIER_ASSIGNMENT ack', async () => {
    const states = [];
    render(<HookHarness onState={(state) => states.push(state)} />);

    await waitFor(() => {
      expect(typeof emitAck).toBe('function');
    });

    await act(async () => {
      emitAck({ ok: false, status: 409, code: 'NO_ACTIVE_COURIER_ASSIGNMENT' });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(states[states.length - 1].publishing).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(20000);
      await Promise.resolve();
    });

    expect(geolocationCalls).toBe(1);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
