import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './PackageCard.css';

const STATUS_COLORS = {
  pending: 'var(--muted)', accepted: 'var(--cyan)', in_transit: 'var(--orange)',
  delivered: 'var(--green)', cancelled: 'var(--red)',
};

const fmtId = (id) => id ? 'PKG-' + id.substring(0, 8).toUpperCase() : '—';
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(); } catch { return '—'; } };

const PackageCard = ({ pkg, actions = [], style }) => {
  const [copied, setCopied] = useState(false);
  const status = (pkg.status || 'pending').toLowerCase();
  const topColor = STATUS_COLORS[status] || STATUS_COLORS.pending;

  const copyId = () => {
    navigator.clipboard?.writeText(pkg.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="pc" style={{ borderTopColor: topColor, ...style }}>
      <div className="pc__head">
        <div>
          <span className="pc__id-label">PACKAGE ID</span>
          <span className="pc__id" onClick={copyId} title={pkg.id}>
            {fmtId(pkg.id)}{' '}
            <span className="pc__copy" style={{ color: copied ? 'var(--green)' : undefined }}>
              {copied ? '✓' : '⧉'}
            </span>
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="pc__body">
        <div className="pc__route">
          <span className="pc__pill">{pkg.pickupLocation || '—'}</span>
          <span className="pc__dots">{'·'.repeat(8)}</span>
          <span className="pc__arrow">→</span>
          <span className="pc__dots">{'·'.repeat(8)}</span>
          <span className="pc__pill">{pkg.destination || '—'}</span>
        </div>
        <div className="pc__grid">
          <div className="pc__item">
            <span className="pc__item-label">PRICE</span>
            <span className="pc__item-value mono amber">₹{pkg.estimatedPrice ?? '—'}</span>
          </div>
          <div className="pc__item">
            <span className="pc__item-label">DELIVER TO</span>
            <span className="pc__item-value">{pkg.deliverTo || '—'}</span>
          </div>
          <div className="pc__item">
            <span className="pc__item-label">CREATED</span>
            <span className="pc__item-value">{fmtDate(pkg.createdOn)}</span>
          </div>
          <div className="pc__item">
            <span className="pc__item-label">ETA</span>
            <span className="pc__item-value">{pkg.estimatedDeliveryTime ? fmtDate(pkg.estimatedDeliveryTime) : '—'}</span>
          </div>
        </div>
        {typeof pkg.distance === 'number' && (
          <span className="pc__distance mono">📍 {pkg.distance.toFixed(2)} km away</span>
        )}
      </div>

      <div className="pc__foot">
        <Link to={`/packages/${pkg.id}`} className="btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View ↗</Link>
        {actions.map((a, i) => (
          <button key={i} type="button" className={a.className || 'btn-amber-outline btn-sm'} onClick={a.onClick}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PackageCard;
