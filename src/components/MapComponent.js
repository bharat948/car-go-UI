import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import StatusBadge from './StatusBadge';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

const center = { lat: 7.2905715, lng: 80.6337262 };

const STATUS_PIN_COLORS = {
  pending: 'var(--amber)', accepted: 'var(--cyan)', in_transit: 'var(--orange)',
  delivered: 'var(--green)', cancelled: 'var(--red)',
};

const fmtId = (id) => id ? 'PKG-' + id.substring(0, 8).toUpperCase() : '';

const MapComponent = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: 3,
  });
  const [selectedPackage, setSelectedPackage] = useState(null);

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

  const zoomIn = () => setViewport((v) => ({ ...v, zoom: v.zoom + 1 }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: v.zoom - 1 }));

  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

  const counts = useMemo(() => {
    const c = { pending: 0, in_transit: 0, delivered: 0 };
    packages.forEach((p) => { const s = p.status || 'pending'; if (c[s] !== undefined) c[s]++; });
    return c;
  }, [packages]);

  if (!mapboxToken) {
    return (
      <div className="map-missing">
        <div className="map-missing__card">
          <p className="map-missing__title">Map Unavailable</p>
          <p className="map-missing__text">REACT_APP_MAPBOX_TOKEN not loaded. If you added it in <code>.env</code>, restart the dev server.</p>
          <button className="btn-amber btn-sm" onClick={() => navigate('/create-package')}>Create Package</button>
        </div>
      </div>
    );
  }

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
        <button className="btn-amber" style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem' }} onClick={() => navigate('/create-package')}>+ Create Package</button>
      </div>

      <div className="map-zoom">
        <button className="map-zoom__btn map-zoom__top" onClick={zoomIn}>+</button>
        <button className="map-zoom__btn map-zoom__bot" onClick={zoomOut}>−</button>
      </div>

      <Map
        {...viewport}
        style={{ width: '100%', height: 'calc(100dvh - 56px)' }}
        mapboxAccessToken={mapboxToken}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {packages.map((pkg) => {
          const s = (pkg.status || 'pending').toLowerCase();
          const pinColor = STATUS_PIN_COLORS[s] || STATUS_PIN_COLORS.pending;
          return (
            <Marker key={pkg.id} latitude={pkg.picklat} longitude={pkg.picklng} anchor="bottom">
              <div className="map-pin" style={{ '--pin-color': pinColor }} onClick={() => setSelectedPackage(pkg)}>
                <div className="map-pin__head">📦</div>
                <div className="map-pin__tip" />
              </div>
            </Marker>
          );
        })}

        {selectedPackage && (
          <Popup
            latitude={selectedPackage.picklat}
            longitude={selectedPackage.picklng}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedPackage(null)}
            anchor="top"
            offset={16}
          >
            <div className="map-popup">
              <div className="map-popup__stripe" data-status={selectedPackage.status || 'pending'} />
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
