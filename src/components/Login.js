import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useUser } from '../contexts/UserContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    const u = form.username.trim();
    if (!u) e.username = 'Required';
    else if (/\s/.test(u)) e.username = 'No spaces allowed';
    else if (u.length < 3 || u.length > 50) e.username = '3-50 characters';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    return e;
  };

  const handleBlur = (e) => {
    setFocused((p) => ({ ...p, [e.target.name]: false }));
    const v = validate();
    if (v[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: v[e.target.name] }));
  };

  const handleFocus = (e) => setFocused((p) => ({ ...p, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/user/login', form);
      localStorage.setItem('token', res.data.token);
      login({ ...res.data.user, userId: res.data.user.id });
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-deco">
        <div className="auth-deco__ring" />
        <div className="auth-deco__brand">
          <span className="auth-deco__logo-icon" />
          <span className="auth-deco__logo-text">DELIVO</span>
        </div>
        <ul className="auth-deco__features">
          <li><span className="amber">→</span> End-to-end package tracking</li>
          <li><span className="amber">→</span> Real-time courier updates</li>
          <li><span className="amber">→</span> GPS-powered delivery routing</li>
        </ul>
        <div className="auth-deco__particles">
          {[...Array(6)].map((_, i) => <span key={i} className="auth-deco__particle" style={{ animationDelay: `${i * 0.8}s`, left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }} />)}
        </div>
      </div>

      <div className="auth-form-col">
        <div className="auth-form-wrap">
          <p className="breadcrumb">DELIVO / AUTH / LOGIN</p>
          <h2 className="auth-heading">Sign In</h2>
          <p className="auth-sub">Access your delivery dashboard</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> USERNAME</label>
              <div className={`t-input-wrap${focused.username ? ' focused' : ''}`}>
                <input
                  className={`t-input${errors.username ? ' has-error' : ''}`}
                  name="username"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="t-error">{errors.username}</p>}
            </div>

            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> PASSWORD</label>
              <div className={`t-input-wrap${focused.password ? ' focused' : ''}`}>
                <input
                  className={`t-input${errors.password ? ' has-error' : ''}`}
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              {errors.password && <p className="t-error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-amber auth-submit" disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
