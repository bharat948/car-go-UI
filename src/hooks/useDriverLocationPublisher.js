import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axiosInstance from '../api/axiosInstance';

const SOCKET_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const PUBLISH_INTERVAL_MS = 10000;
const SOCKET_ACK_TIMEOUT_MS = 4000;
const NO_ACTIVE_ASSIGNMENT_CODE = 'NO_ACTIVE_COURIER_ASSIGNMENT';

const getAuthToken = () => localStorage.getItem('token') || '';

const useDriverLocationPublisher = ({ enabled, isCourier }) => {
  const [publishing, setPublishing] = useState(false);
  const [lastPublishAt, setLastPublishAt] = useState(null);
  const token = getAuthToken();
  const socketRef = useRef(null);
  const haltedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isCourier || !token) {
      setPublishing(false);
      haltedRef.current = false;
      return undefined;
    }

    let isUnmounted = false;

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
    });
    socketRef.current = socket;

    const stopPublishingUntilReenabled = () => {
      haltedRef.current = true;
      if (!isUnmounted) {
        setPublishing(false);
      }
    };

    const isNoActiveAssignmentError = (errorLike) => {
      const status = errorLike?.status || errorLike?.response?.status;
      const code = errorLike?.code || errorLike?.response?.data?.code;
      return status === 409 && code === NO_ACTIVE_ASSIGNMENT_CODE;
    };

    const emitWithAck = (payload) => new Promise((resolve, reject) => {
      if (!socket.connected) {
        reject(new Error('SOCKET_NOT_CONNECTED'));
        return;
      }
      const timeout = window.setTimeout(() => {
        reject(new Error('SOCKET_ACK_TIMEOUT'));
      }, SOCKET_ACK_TIMEOUT_MS);
      socket.emit('driver-location', payload, (ack) => {
        window.clearTimeout(timeout);
        if (ack?.ok) {
          resolve(ack);
          return;
        }
        reject({
          status: ack?.status,
          code: ack?.code,
          message: ack?.message || 'Socket publish rejected',
        });
      });
    });

    const publishLocation = () => {
      if (!navigator.geolocation || haltedRef.current) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (isUnmounted || haltedRef.current) return;

          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            isOnline: true,
          };

          let didPublishSucceed = false;
          try {
            await emitWithAck(payload);
            didPublishSucceed = true;
          } catch (socketError) {
            if (isNoActiveAssignmentError(socketError)) {
              stopPublishingUntilReenabled();
              return;
            }

            try {
              await axiosInstance.post('/api/driver/location', payload);
              didPublishSucceed = true;
            } catch (httpError) {
              if (isNoActiveAssignmentError(httpError)) {
                stopPublishingUntilReenabled();
                return;
              }
            }
          }

          if (!isUnmounted) {
            if (didPublishSucceed) {
              setLastPublishAt(payload.timestamp);
              setPublishing(true);
            } else {
              setPublishing(false);
            }
          }
        },
        () => {
          if (!isUnmounted) {
            setPublishing(false);
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 }
      );
    };

    publishLocation();
    const interval = window.setInterval(publishLocation, PUBLISH_INTERVAL_MS);

    return () => {
      isUnmounted = true;
      window.clearInterval(interval);
      socket.disconnect();
      socketRef.current = null;
      setPublishing(false);
    };
  }, [enabled, isCourier, token]);

  return {
    publishing,
    lastPublishAt,
  };
};

export default useDriverLocationPublisher;
