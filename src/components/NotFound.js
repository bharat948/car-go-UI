import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <div className="nf">
    <div className="nf__grid-bg" />
    <h1 className="nf__code">404</h1>
    <div className="nf__card">
      <p className="nf__label">PAGE NOT FOUND</p>
      <p className="nf__text">The route you're looking for doesn't exist.</p>
      <Link to="/home" className="btn-amber btn-sm" style={{ textDecoration: 'none' }}>← Back to Home</Link>
    </div>
  </div>
);

export default NotFound;
