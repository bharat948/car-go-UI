import React from 'react';
import './StatusBadge.css';

const LABELS = { pending: 'PENDING', accepted: 'ACCEPTED', in_transit: 'IN TRANSIT', delivered: 'DELIVERED', cancelled: 'CANCELLED' };

const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  return (
    <span className={`sb sb--${s}`}>
      {s === 'in_transit' && <span className="sb__dot" />}
      {LABELS[s] || s.toUpperCase()}
    </span>
  );
};

export default StatusBadge;
