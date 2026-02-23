import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import PackageCard from './PackageCard';
import './NearbyPackages.css';

const NearbyPackages = ({ userId }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearbyPackages = () => {
      if (!navigator.geolocation) {
        toast.error('Geolocation not supported.');
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await axiosInstance.post('/api/packages/near-me', {
              userId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setPackages(res.data);
          } catch {
            toast.error('Failed to fetch nearby packages.');
          } finally {
            setLoading(false);
          }
        },
        () => {
          toast.error('Could not get your location.');
          setLoading(false);
        }
      );
    };
    fetchNearbyPackages();
  }, [userId]);

  if (loading) {
    return (
      <div className="np-page page-wrap">
        <p className="breadcrumb">DELIVO / PACKAGES / NEARBY</p>
        <h2 className="np-title">Nearby Packages</h2>
        <div className="np-radar">
          <span className="np-radar__ring" />
          <span className="np-radar__ring" style={{ animationDelay: '0.5s' }} />
          <span className="np-radar__ring" style={{ animationDelay: '1s' }} />
          <span className="np-radar__dot" />
        </div>
        <p className="np-locating mono">Acquiring your location...</p>
      </div>
    );
  }

  return (
    <div className="np-page page-wrap">
      <p className="breadcrumb">DELIVO / PACKAGES / NEARBY</p>
      <h2 className="np-title">Nearby Packages</h2>
      <p className="np-sub">{packages.length} packages near your location</p>

      {packages.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty__icon">📍</span>
          <p className="mp-empty__title">No packages found nearby</p>
          <p className="mp-empty__sub">Try again later or check a different location.</p>
        </div>
      ) : (
        <div className="pkg-grid" style={{ marginTop: 24 }}>
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPackages;
