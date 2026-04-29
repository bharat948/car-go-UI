import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axiosInstance from '../api/axiosInstance';
import StatusBadge from './StatusBadge';
import { createRasterBasemapStyleFromEnv } from '../maps/rasterBasemapStyle';
import { minDistanceMetersPointToPolyline } from '../utils/geoRouteDeviation';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapComponent.css';

const center = { lat: 7.2905715, lng: 80.6337262 };
const DRIVER_STALE_MS = 15000;
const ROUTE_NEAR_THRESHOLD_M = 200;
const SOCKET_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

const STATUS_PIN_COLORS = {
  pending: 'var(--amber)', accepted: 'var(--cyan)', in_transit: 'var(--orange)',
  delivered: 'var(--green)', cancelled: 'var(--red)',
};

const fmtId = (id) => id ? 'PKG-' + id.substring(0, 8).toUpperCase() : '';
const getAuthToken = () => localStorage.getItem('token') || '';
const normalizePackageStatus = (status) => (status || 'pending').toLowerCase();
const formatDistance = (meters) => `${(meters / 1000).toFixed(1)} km`;
const formatDuration = (seconds) => {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins === 0 ? `${hours}h` : `${hours}h ${remMins}m`;
};
const coordPairFromCandidate = (lat, lng) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
};
const getPickupCoords = (pkg) => {
  if (!pkg) return null;
  return coordPairFromCandidate(pkg.picklat ?? pkg.pickLat ?? pkg.pickupLat ?? pkg.pickupLatitude, pkg.picklng ?? pkg.pickLng ?? pkg.pickupLng ?? pkg.pickupLongitude);
};
const getDestinationCoords = (pkg) => {
  if (!pkg) return null;
  return coordPairFromCandidate(
    pkg.destlat ?? pkg.destLat ?? pkg.destinationLat ?? pkg.destinationLatitude ?? pkg.droplat ?? pkg.dropLat ?? pkg.dropoffLat ?? pkg.dropoffLatitude,
    pkg.destlng ?? pkg.destLng ?? pkg.destinationLng ?? pkg.destinationLongitude ?? pkg.droplng ?? pkg.dropLng ?? pkg.dropoffLng ?? pkg.dropoffLongitude,
  );
};
const navProgressByStatus = (status) => {
  const normalized = normalizePackageStatus(status);
  if (normalized === 'delivered') return 100;
  if (normalized === 'in_transit') return 70;
  if (normalized === 'accepted') return 35;
  return 10;
};
const getDriverStatus = (driver, nowMs) => {
  const isStale = nowMs - (driver.seenMs || 0) > DRIVER_STALE_MS;
  if (!driver.isOnline) return 'offline';
  if (isStale) return 'stale';
  return 'online';
};

const MapComponent = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [driversById, setDriversById] = useState({});
  const [socketState, setSocketState] = useState('disconnected');
  const [nowMs, setNowMs] = useState(Date.now());
  const [authToken, setAuthToken] = useState(getAuthToken);
  const previousTokenRef = useRef(authToken);
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: 3,
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [routeState, setRouteState] = useState({
    loading: false,
    legs: [],
    totalDistance: 0,
    totalDuration: 0,
    error: '',
  });

  const mapStyle = useMemo(() => createRasterBasemapStyleFromEnv(process.env), []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axiosInstance.get('/api/packages');
        setPackages(response.data);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const syncToken = () => setAuthToken(getAuthToken());
    const tokenPoll = window.setInterval(syncToken, 1000);
    window.addEventListener('storage', syncToken);
    window.addEventListener('focus', syncToken);
    return () => {
      window.clearInterval(tokenPoll);
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('focus', syncToken);
    };
  }, []);

  useEffect(() => {
    if (previousTokenRef.current !== authToken) {
      setDriversById({});
      previousTokenRef.current = authToken;
    }

    if (!authToken) {
      setDriversById({});
      setSocketState('disconnected');
      return undefined;
    }

    setSocketState('connecting');
    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token: authToken,
        Authorization: `Bearer ${authToken}`,
      },
      reconnection: true,
    });

    socket.on('connect', () => setSocketState('connected'));
    socket.on('disconnect', () => setSocketState('disconnected'));
    socket.io.on('reconnect_attempt', () => setSocketState('reconnecting'));
    socket.io.on('reconnect_failed', () => setSocketState('disconnected'));

    socket.on('driver-update', (payload) => {
      if (!payload?.id) return;
      const normalizedCoords = coordPairFromCandidate(payload.lat, payload.lng);
      if (!normalizedCoords) return;
      const seenMs = payload.lastUpdated ? new Date(payload.lastUpdated).getTime() : Date.now();
      setDriversById((prev) => ({
        ...prev,
        [payload.id]: {
          ...payload,
          lat: normalizedCoords.lat,
          lng: normalizedCoords.lng,
          seenMs: Number.isFinite(seenMs) ? seenMs : Date.now(),
        },
      }));
    });

    return () => socket.disconnect();
  }, [authToken]);

  const zoomIn = () => setViewport((v) => ({ ...v, zoom: v.zoom + 1 }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: v.zoom - 1 }));

  const counts = useMemo(() => {
    const c = { pending: 0, in_transit: 0, delivered: 0 };
    packages.forEach((p) => { const s = p.status || 'pending'; if (c[s] !== undefined) c[s]++; });
    return c;
  }, [packages]);

  const drivers = useMemo(() => Object.values(driversById), [driversById]);
  const activePackage = useMemo(
    () => packages.find((pkg) => ['accepted', 'in_transit'].includes(normalizePackageStatus(pkg.status))) || null,
    [packages],
  );
  const activePickupCoords = useMemo(() => getPickupCoords(activePackage), [activePackage]);
  const activeDestinationCoords = useMemo(() => getDestinationCoords(activePackage), [activePackage]);
  const selectedPickupCoords = useMemo(() => getPickupCoords(selectedPackage), [selectedPackage]);
  const activeDriver = useMemo(() => {
    if (!activePackage) return null;
    const candidateDriverId = activePackage.driverId || activePackage.courierId || activePackage.assignedDriverId || activePackage.acceptedBy;
    if (candidateDriverId && driversById[candidateDriverId]) return driversById[candidateDriverId];
    return null;
  }, [activePackage, driversById]);

  useEffect(() => {
    const hasCoreCoords = activePickupCoords && activeDestinationCoords;
    if (!activePackage || !hasCoreCoords) {
      setRouteState({
        loading: false,
        legs: [],
        totalDistance: 0,
        totalDuration: 0,
        error: activePackage ? 'Route unavailable: missing pickup or destination coordinates.' : '',
      });
      return undefined;
    }

    const controller = new AbortController();

    const fetchRoute = async (from, to) => {
      const url = `${OSRM_BASE_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`OSRM status ${response.status}`);
      const payload = await response.json();
      const route = payload?.routes?.[0];
      if (!route?.geometry?.coordinates?.length) throw new Error('No route geometry');
      return route;
    };

    const load = async () => {
      setRouteState((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const nextLegs = [];
        const driverCoords = activeDriver ? coordPairFromCandidate(activeDriver.lat, activeDriver.lng) : null;
        if (driverCoords) {
          const toPickup = await fetchRoute(driverCoords, activePickupCoords);
          nextLegs.push({ id: 'driver-to-pickup', color: '#22d3ee', ...toPickup });
        }
        const pickupToDestination = await fetchRoute(activePickupCoords, activeDestinationCoords);
        nextLegs.push({ id: 'pickup-to-destination', color: '#f59e0b', ...pickupToDestination });
        const totalDistance = nextLegs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
        const totalDuration = nextLegs.reduce((sum, leg) => sum + (leg.duration || 0), 0);
        setRouteState({ loading: false, legs: nextLegs, totalDistance, totalDuration, error: '' });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setRouteState({
          loading: false,
          legs: [],
          totalDistance: 0,
          totalDuration: 0,
          error: 'Could not fetch live route. Showing package markers only.',
        });
      }
    };

    load();
    return () => controller.abort();
  }, [activePackage, activePickupCoords, activeDestinationCoords, activeDriver]);

  const routeDeviationMeta = useMemo(() => {
    if (!activeDriver || !routeState.legs?.length) return null;
    const lat = Number(activeDriver.lat);
    const lng = Number(activeDriver.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    let minM = Infinity;
    for (const leg of routeState.legs) {
      const coords = leg?.geometry?.coordinates;
      const d = minDistanceMetersPointToPolyline(lat, lng, coords);
      if (d < minM) minM = d;
    }
    if (!Number.isFinite(minM)) return null;
    return {
      meters: minM,
      nearRoute: minM <= ROUTE_NEAR_THRESHOLD_M,
    };
  }, [activeDriver, routeState.legs]);

  const driverMeta = useMemo(() => {
    const totals = { online: 0, stale: 0, offline: 0 };
    drivers.forEach((driver) => {
      const status = getDriverStatus(driver, nowMs);
      totals[status] += 1;
    });
    return totals;
  }, [drivers, nowMs]);

  return (
    <div className="map-wrap">
      <div className="map-panel">
        <p className="map-panel__title mono">DELIVO LIVE</p>
        <p className="map-panel__sub">{packages.length} active packages</p>
        <div className="map-panel__sep" />
        <div className="map-panel__stats">
          <span style={{ color: 'var(--text-dim)' }}>⏳ {counts.pending}</span>
          <span style={{ color: 'var(--orange)' }}>🚚 {counts.in_transit}</span>
          <span style={{ color: 'var(--green)' }}>✓ {counts.delivered}</span>
        </div>
        <div className="map-panel__sep" />
        <div className="map-panel__socket">
          <span className={`map-conn-dot map-conn-dot--${socketState}`} />
          <span className="mono map-panel__socket-text">Driver feed: {socketState}</span>
        </div>
        <div className="map-panel__stats" style={{ marginTop: 8 }}>
          <span style={{ color: 'var(--cyan)' }}>🛵 {driverMeta.online} live</span>
          <span style={{ color: 'var(--red)' }}>⏱ {driverMeta.stale} stale</span>
          <span style={{ color: 'var(--red)' }}>⛔ {driverMeta.offline} offline</span>
        </div>
        <div className="map-panel__sep" />
        <button className="btn-amber" style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem' }} onClick={() => navigate('/create-package')}>+ Create Package</button>
      </div>

      {activePackage && (
        <div className="map-nav-panel" role="status" aria-live="polite">
          <p className="map-nav-panel__title mono">ACTIVE ROUTE · {fmtId(activePackage.id)}</p>
          <p className="map-nav-panel__sub">
            {activePackage.pickupLocation} → {activePackage.destination}
          </p>
          {routeState.loading && <p className="map-nav-panel__hint">Fetching route...</p>}
          {!routeState.loading && routeState.error && (
            <p className="map-nav-panel__error">{routeState.error}</p>
          )}
          {!routeState.loading && !routeState.error && routeState.legs.length > 0 && (
            <>
              <div className="map-nav-panel__stats">
                <span>{formatDistance(routeState.totalDistance)} remaining</span>
                <span>ETA {formatDuration(routeState.totalDuration)}</span>
              </div>
              <div className="map-nav-progress" aria-label="Delivery progress">
                <div
                  className="map-nav-progress__bar"
                  style={{ width: `${navProgressByStatus(activePackage.status)}%` }}
                />
              </div>
              {routeDeviationMeta && (
                <p
                  className={`map-nav-route-deviation map-nav-route-deviation--${routeDeviationMeta.nearRoute ? 'near' : 'far'}`}
                >
                  Driver vs route: ~{Math.round(routeDeviationMeta.meters)} m (
                  {routeDeviationMeta.nearRoute ? 'near plotted route' : 'possibly off route'})
                </p>
              )}
              <p className="map-nav-panel__hint">
                Progress reflects package status only (MVP).
              </p>
            </>
          )}
        </div>
      )}

      <div className="map-zoom">
        <button className="map-zoom__btn map-zoom__top" onClick={zoomIn}>+</button>
        <button className="map-zoom__btn map-zoom__bot" onClick={zoomOut}>−</button>
      </div>

      <Map
        mapLib={maplibregl}
        {...viewport}
        style={{ width: '100%', height: 'calc(100dvh - 56px)' }}
        mapStyle={mapStyle}
        onMove={(evt) => setViewport(evt.viewState)}
      >
        {packages.map((pkg) => {
          const pickupCoords = getPickupCoords(pkg);
          if (!pickupCoords) return null;
          const s = (pkg.status || 'pending').toLowerCase();
          const pinColor = STATUS_PIN_COLORS[s] || STATUS_PIN_COLORS.pending;
          return (
            <Marker key={pkg.id} latitude={pickupCoords.lat} longitude={pickupCoords.lng} anchor="bottom">
              <div className="map-pin" style={{ '--pin-color': pinColor }} onClick={() => setSelectedPackage(pkg)}>
                <div className="map-pin__head">📦</div>
                <div className="map-pin__tip" />
              </div>
            </Marker>
          );
        })}

        {activeDestinationCoords && (
          <Marker latitude={activeDestinationCoords.lat} longitude={activeDestinationCoords.lng} anchor="bottom">
            <div className="map-pin" style={{ '--pin-color': 'var(--green)' }}>
              <div className="map-pin__head">🏁</div>
              <div className="map-pin__tip" />
            </div>
          </Marker>
        )}

        {routeState.legs.map((leg) => (
          <Source
            key={leg.id}
            id={`route-${leg.id}`}
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: leg.geometry.coordinates,
              },
              properties: {},
            }}
          >
            <Layer
              id={`route-layer-${leg.id}`}
              type="line"
              paint={{
                'line-color': leg.color,
                'line-width': 4,
                'line-opacity': 0.88,
              }}
            />
          </Source>
        ))}

        {drivers.map((driver) => {
          const driverStatus = getDriverStatus(driver, nowMs);
          const cls = [
            'map-driver-pin',
            driverStatus === 'stale' ? 'map-driver-pin--stale' : '',
            driverStatus === 'offline' ? 'map-driver-pin--offline' : '',
          ].filter(Boolean).join(' ');
          const title = `${driver.userId || driver.id} • ${driverStatus}`;

          return (
            <Marker key={`driver-${driver.id}`} latitude={driver.lat} longitude={driver.lng} anchor="center">
              <div className={cls} title={title}>
                🛵
              </div>
            </Marker>
          );
        })}

        {selectedPackage && selectedPickupCoords && (
          <Popup
            latitude={selectedPickupCoords.lat}
            longitude={selectedPickupCoords.lng}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedPackage(null)}
            anchor="top"
            offset={16}
          >
            <div className="map-popup">
              <div className="map-popup__stripe" data-status={normalizePackageStatus(selectedPackage.status)} />
              <div className="map-popup__body">
                <span className="map-popup__id-label mono">PACKAGE</span>
                <span className="map-popup__id mono">{fmtId(selectedPackage.id)}</span>
                <p className="map-popup__route">{selectedPackage.pickupLocation} → {selectedPackage.destination}</p>
                <span className="map-popup__price mono amber">₹{selectedPackage.estimatedPrice}</span>
                <div style={{ margin: '6px 0' }}><StatusBadge status={selectedPackage.status} /></div>
                <Link to={`/packages/${selectedPackage.id}`} className="map-popup__link">View Details →</Link>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;
