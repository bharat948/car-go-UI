import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useUser } from '../contexts/UserContext';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'sender' });
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
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
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
      await axiosInstance.post('/user/register', { username: form.username, password: form.password, role: form.role });
      const loginRes = await axiosInstance.post('/user/login', { username: form.username, password: form.password });
      localStorage.setItem('token', loginRes.data.token);
      login({ ...loginRes.data.user, userId: loginRes.data.user.id });
      toast.success('Account created!');
      navigate('/home');
    } catch (err) {
      const msg = err.response?.data?.errors?.map((x) => x.msg).join(', ') || err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
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
          <p className="breadcrumb">DELIVO / AUTH / REGISTER</p>
          <h2 className="auth-heading">Create Account</h2>
          <p className="auth-sub">Start tracking deliveries today</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> USERNAME</label>
              <div className={`t-input-wrap${focused.username ? ' focused' : ''}`}>
                <input className={`t-input${errors.username ? ' has-error' : ''}`} name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} autoComplete="username" />
              </div>
              {errors.username && <p className="t-error">{errors.username}</p>}
            </div>

            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> PASSWORD</label>
              <div className={`t-input-wrap${focused.password ? ' focused' : ''}`}>
                <input className={`t-input${errors.password ? ' has-error' : ''}`} name="password" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} autoComplete="new-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? 'HIDE' : 'SHOW'}</button>
              </div>
              {errors.password && <p className="t-error">{errors.password}</p>}
            </div>

            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> CONFIRM PASSWORD</label>
              <div className={`t-input-wrap${focused.confirmPassword ? ' focused' : ''}`}>
                <input className={`t-input${errors.confirmPassword ? ' has-error' : ''}`} name="confirmPassword" type={showPw ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} autoComplete="new-password" />
              </div>
              {errors.confirmPassword && <p className="t-error">{errors.confirmPassword}</p>}
            </div>

            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> I AM A</label>
              <div className="role-cards">
                <button type="button" className={`role-card${form.role === 'sender' ? ' selected' : ''}`} onClick={() => { setForm({ ...form, role: 'sender' }); }}>
                  {form.role === 'sender' && <span className="role-card__check">✓</span>}
                  <span className="role-card__icon">📦</span>
                  <span className="role-card__title">Sender</span>
                  <span className="role-card__desc">Create and track your shipments</span>
                </button>
                <button type="button" className={`role-card${form.role === 'courier' ? ' selected' : ''}`} onClick={() => { setForm({ ...form, role: 'courier' }); }}>
                  {form.role === 'courier' && <span className="role-card__check">✓</span>}
                  <span className="role-card__icon">🚴</span>
                  <span className="role-card__title">Courier</span>
                  <span className="role-card__desc">Pick up and deliver packages</span>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-amber auth-submit" disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
