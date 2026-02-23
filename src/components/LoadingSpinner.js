import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullPage, label }) => {
  const inner = (
    <div className="ls">
      <div className="ls__ring" />
      {label && <p className="ls__label">{label}</p>}
    </div>
  );
  if (fullPage) return <div className="ls-overlay">{inner}</div>;
  return inner;
};

export default LoadingSpinner;
