import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import './PackageDetail.css';

const STEPS = ['pending', 'accepted', 'in_transit', 'delivered'];
const STEP_LABELS = { pending: 'Pending', accepted: 'Accepted', in_transit: 'In Transit', delivered: 'Delivered' };

const fmtId = (id) => id ? 'PKG-' + id.substring(0, 8).toUpperCase() : '';
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(); } catch { return '—'; } };

const PackageDetail = () => {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axiosInstance.get(`/api/packages/${id}`);
        setPkg(res.data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Package not found.' : 'Failed to load package.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error || !pkg) {
    return (
      <div className="pd-page page-wrap">
        <p className="pd-error">{error}</p>
        <Link to="/home" className="btn-ghost btn-sm" style={{ textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    );
  }

  const status = (pkg.status || 'pending').toLowerCase();
  const currentStepIndex = Math.max(0, STEPS.indexOf(status));
  const isCancelled = status === 'cancelled';

  return (
    <div className="pd-page page-wrap" style={{ maxWidth: 720 }}>
      <Link to="/show-all" className="pd-back">← Back</Link>
      <span className="breadcrumb" style={{ display: 'block', marginBottom: 4 }}>TRACKING</span>
      <h2 className="pd-title">{fmtId(pkg.id)}</h2>
      <div style={{ marginBottom: 24 }}><StatusBadge status={status} /></div>

      {!isCancelled && (
        <div className="pd-tracker">
          {STEPS.map((step, i) => {
            const isPast = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const stepColor = isPast || isCurrent
              ? (isCurrent ? 'var(--amber)' : 'var(--green)')
              : 'var(--border-2)';
            return (
              <React.Fragment key={step}>
                <div className={`pd-step${isCurrent ? ' pd-step--current' : ''}${isPast ? ' pd-step--done' : ''}`}>
                  <span className="pd-step__circle" style={{ borderColor: stepColor, background: isPast || isCurrent ? stepColor : 'transparent' }}>
                    {isPast ? '✓' : i + 1}
                  </span>
                  <span className="pd-step__label">{STEP_LABELS[step]}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="pd-step__line" style={{ background: isPast ? 'var(--green)' : 'var(--border-2)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="pd-cards">
        <div className="pd-info-card">
          <h3 className="section-label">SHIPMENT INFO</h3>
          <div className="pd-info-grid">
            <div className="pd-info-item">
              <span className="pd-info-label">FROM</span>
              <span className="pd-info-value">{pkg.pickupLocation}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">TO</span>
              <span className="pd-info-value">{pkg.destination}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">SENDER</span>
              <span className="pd-info-value">{pkg.userName}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">DELIVER TO</span>
              <span className="pd-info-value">{pkg.deliverTo}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">PRICE</span>
              <span className="pd-info-value mono amber">₹{pkg.estimatedPrice}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">ETA</span>
              <span className="pd-info-value">{pkg.estimatedDeliveryTime ? fmtDate(pkg.estimatedDeliveryTime) : '—'}</span>
            </div>
            <div className="pd-info-item">
              <span className="pd-info-label">CREATED</span>
              <span className="pd-info-value">{fmtDate(pkg.createdOn)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;
