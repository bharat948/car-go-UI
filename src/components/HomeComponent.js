import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomeComponent.css';

const HomeComponent = () => {
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);
  const [c3, setC3] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const targets = [{ set: setC1, to: 1 }, { set: setC2, to: 3 }, { set: setC3, to: 2 }];
    targets.forEach(({ set, to }) => {
      let cur = 0;
      const step = Math.max(1, Math.floor(to / 15));
      const id = setInterval(() => {
        cur += step;
        if (cur >= to) { set(to); clearInterval(id); } else { set(cur); }
      }, 100);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home">
      <div className="home__grid-bg" />
      <div className="home__glow" />

      <div className="home__hero" ref={heroRef}>
        <span className="home__eyebrow">
          <span className="home__dot">·</span> PACKAGE DELIVERY PLATFORM <span className="home__dot">·</span>
        </span>
        <h1 className="home__title">
          Track Every <span className="home__title-accent">Mile.</span>
        </h1>
        <p className="home__sub">
          Create shipments, dispatch couriers, and follow your package in real time — from pickup to doorstep.
        </p>
        <div className="home__ctas">
          <Link to="/create-package" className="btn-amber">Send a Package</Link>
          <Link to="/show-all" className="btn-ghost">View Map</Link>
        </div>
        <div className="home__stats">
          <div className="home__stat">
            <span className="home__stat-num">{c1}</span>
            <span className="home__stat-label">City</span>
          </div>
          <span className="home__stat-sep" />
          <div className="home__stat">
            <span className="home__stat-num">{c2}</span>
            <span className="home__stat-label">Packages</span>
          </div>
          <span className="home__stat-sep" />
          <div className="home__stat">
            <span className="home__stat-num">{c3}</span>
            <span className="home__stat-label">Couriers</span>
          </div>
        </div>
      </div>

      <div className={`home__scroll${scrolled ? ' hide' : ''}`}>
        ↓ SCROLL
      </div>
    </div>
  );
};

export default HomeComponent;
