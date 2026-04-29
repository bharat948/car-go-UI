import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import PackageCard from './PackageCard';
import LoadingSpinner from './LoadingSpinner';
import useDriverLocationPublisher from '../hooks/useDriverLocationPublisher';
import { useUser } from '../contexts/UserContext';
import './CourierDashboard.css';

const normalizeDeliveryStatus = (status) => (status || 'pending').toLowerCase();

const CourierDashboard = () => {
  const { user } = useUser();
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const myDeliveriesRef = useRef(null);
  const isCourier = user?.role === 'courier';
  const hasActiveDelivery = myDeliveries.some((pkg) => ['accepted', 'in_transit'].includes(normalizeDeliveryStatus(pkg.status)));
  const { publishing, lastPublishAt } = useDriverLocationPublisher({
    enabled: hasActiveDelivery,
    isCourier,
  });

  const fetchAvailable = async () => {
    try {
      const res = await axiosInstance.get('/api/courier/packages');
      setAvailable(res.data);
    } catch (err) {
      if (err.response?.status !== 403) toast.error('Failed to load available packages.');
      setAvailable([]);
    }
  };

  const fetchMyDeliveries = async () => {
    try {
      const res = await axiosInstance.get('/api/courier/my-deliveries');
      setMyDeliveries(res.data);
    } catch (err) {
      if (err.response?.status !== 403) toast.error('Failed to load deliveries.');
      setMyDeliveries([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAvailable(), fetchMyDeliveries()]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#my-deliveries' && myDeliveriesRef.current) {
      myDeliveriesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const handleAccept = async (pkg) => {
    try {
      await axiosInstance.patch(`/api/packages/${pkg.id}/status`, { status: 'accepted' });
      setAvailable((prev) => prev.filter((x) => x.id !== pkg.id));
      await fetchMyDeliveries();
      toast.success('Package accepted!');
      myDeliveriesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed.');
    }
  };

  const handleStatusUpdate = async (pkg, nextStatus) => {
    try {
      await axiosInstance.patch(`/api/packages/${pkg.id}/status`, { status: nextStatus });
      await fetchMyDeliveries();
      toast.success(`Marked as ${nextStatus.replace('_', ' ')}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const acceptedCount = myDeliveries.filter((d) => d.status === 'accepted').length;
  const transitCount = myDeliveries.filter((d) => d.status === 'in_transit').length;
  const deliveredCount = myDeliveries.filter((d) => d.status === 'delivered').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="cd-page page-wrap">
      <div className="cd-header">
        <div>
          <div className="cd-online">
            <span className="cd-online__dot" />
            <span className="cd-online__text">ONLINE</span>
          </div>
          <h2 className="cd-title">Courier Dashboard</h2>
          <p className="cd-summary muted mono" style={{ marginTop: 8 }}>
            Location feed: {publishing ? 'publishing' : 'idle'}
            {lastPublishAt ? ` · last ${new Date(lastPublishAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <p className="cd-summary muted mono">{myDeliveries.length} jobs accepted · {deliveredCount} delivered</p>
      </div>

      <div className="cd-stats">
        <div className="cd-stat">
          <span className="cd-stat__label">AVAILABLE</span>
          <span className="cd-stat__num">{available.length}</span>
        </div>
        <div className="cd-stat">
          <span className="cd-stat__label">ACCEPTED</span>
          <span className="cd-stat__num" style={{ color: 'var(--cyan)' }}>{acceptedCount}</span>
        </div>
        <div className="cd-stat">
          <span className="cd-stat__label">DELIVERING</span>
          <span className="cd-stat__num" style={{ color: 'var(--orange)' }}>{transitCount}</span>
        </div>
        <div className="cd-stat">
          <span className="cd-stat__label">COMPLETED</span>
          <span className="cd-stat__num" style={{ color: 'var(--green)' }}>{deliveredCount}</span>
        </div>
      </div>

      <section className="cd-section">
        <div className="cd-section__head">
          <h3 className="section-label">AVAILABLE PICKUPS</h3>
          {available.length > 0 && <span className="cd-live-dot" />}
        </div>
        {available.length === 0 ? (
          <p className="cd-empty">No pending packages available for pickup.</p>
        ) : (
          <div className="pkg-grid">
            {available.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} actions={[
                { label: 'Accept Job', className: 'btn-amber-outline btn-sm', onClick: () => handleAccept(pkg) },
              ]} />
            ))}
          </div>
        )}
      </section>

      <section className="cd-section" id="my-deliveries" ref={myDeliveriesRef}>
        <h3 className="section-label">MY DELIVERIES</h3>
        {myDeliveries.length === 0 ? (
          <p className="cd-empty">You have no accepted deliveries.</p>
        ) : (
          <div className="pkg-grid">
            {myDeliveries.map((pkg) => {
              const actions = [];
              if (pkg.status === 'accepted') actions.push({ label: 'Mark In Transit', className: 'btn-amber-outline btn-sm', onClick: () => handleStatusUpdate(pkg, 'in_transit') });
              if (pkg.status === 'in_transit') actions.push({ label: 'Mark Delivered', className: 'btn-green-outline btn-sm', onClick: () => handleStatusUpdate(pkg, 'delivered') });
              return <PackageCard key={pkg.id} pkg={pkg} actions={actions} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CourierDashboard;
