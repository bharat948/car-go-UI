import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useUser } from '../contexts/UserContext';
import axiosInstance from '../api/axiosInstance';

const Navbar = ({ isLoggedIn, user }) => {
  const { logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [barActive, setBarActive] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    setBarActive(true);
    const t = setTimeout(() => setBarActive(false), 700);
    setMobileOpen(false);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/user/logout');
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const isCourier = (user?.role || 'sender') === 'courier';
  const initials = (user?.username || '?').substring(0, 2).toUpperCase();

  return (
    <>
      <div ref={barRef} className={`nav-progress${barActive ? ' active' : ''}`} />
      <nav className="nb">
        <div className="nb__inner">
          <Link to="/home" className="nb__logo">
            <span className="nb__logo-icon" />
            <span className="nb__logo-text">DELIVO</span>
          </Link>

          <div className="nb__links-desktop">
            <NavLink to="/home" current={location.pathname}>Home</NavLink>
            <NavLink to="/show-all" current={location.pathname}>Map</NavLink>
            {isLoggedIn && (
              isCourier ? (
                <>
                  <NavLink to="/courier-dashboard" current={location.pathname}>Available</NavLink>
                  <NavLink to="/courier-dashboard#my-deliveries" current={location.pathname}>Deliveries</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/create-package" current={location.pathname}>Create</NavLink>
                  <NavLink to="/my-packages" current={location.pathname}>My Packages</NavLink>
                  <NavLink to="/nearby-packages" current={location.pathname}>Nearby</NavLink>
                </>
              )
            )}
          </div>

          <div className="nb__right">
            {isLoggedIn ? (
              <div className="nb__user">
                <span className="nb__avatar">{initials}</span>
                <span className="nb__username">{user?.username}</span>
                <button className="nb__logout" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <div className="nb__auth-links">
                <Link to="/login" className="nb__auth-link">Login</Link>
                <Link to="/register" className="btn-amber btn-sm" style={{ textDecoration: 'none' }}>Register</Link>
              </div>
            )}

            <button
              className={`nb__hamburger${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        <div className={`nb__mobile${mobileOpen ? ' show' : ''}`}>
          <Link to="/home" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/show-all" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Map</Link>
          {isLoggedIn && (
            isCourier ? (
              <>
                <Link to="/courier-dashboard" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Available</Link>
                <Link to="/courier-dashboard#my-deliveries" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Deliveries</Link>
              </>
            ) : (
              <>
                <Link to="/create-package" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Create</Link>
                <Link to="/my-packages" className="nb__mob-link" onClick={() => setMobileOpen(false)}>My Packages</Link>
                <Link to="/nearby-packages" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Nearby</Link>
              </>
            )
          )}
          {isLoggedIn ? (
            <button className="nb__mob-link nb__mob-logout" onClick={() => { setMobileOpen(false); handleLogout(); }}>Logout</button>
          ) : (
            <>
              <Link to="/login" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="nb__mob-link" onClick={() => setMobileOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

const NavLink = ({ to, current, children }) => {
  const active = current === to || (to !== '/' && current.startsWith(to.split('#')[0]) && to.split('#')[0] !== '/');
  return (
    <Link to={to} className={`nb__link${active ? ' nb__link--active' : ''}`}>
      {children}
    </Link>
  );
};

export default Navbar;
