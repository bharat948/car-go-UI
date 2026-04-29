import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useUser } from '../contexts/UserContext';
import LocationAutocomplete from './LocationAutocomplete';
import './CreatePackage.css';

const CreatePackage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [form, setForm] = useState({
    pickupLocation: '',
    destination: '',
    estimatedDeliveryTime: '',
    estimatedPrice: '',
    deliverTo: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.pickupLocation || form.pickupLocation.length < 3) e.pickupLocation = 'Min 3 characters';
    if (!form.destination || form.destination.length < 3) e.destination = 'Min 3 characters';
    if (form.destination && form.pickupLocation && form.destination.trim().toLowerCase() === form.pickupLocation.trim().toLowerCase()) {
      e.destination = 'Must differ from pickup location';
    }
    if (!form.estimatedDeliveryTime) e.estimatedDeliveryTime = 'Required';
    else if (new Date(form.estimatedDeliveryTime) <= new Date()) e.estimatedDeliveryTime = 'Must be a future date';
    if (!form.estimatedPrice) e.estimatedPrice = 'Required';
    else if (isNaN(form.estimatedPrice) || Number(form.estimatedPrice) <= 0) e.estimatedPrice = 'Must be a positive number';
    if (!form.deliverTo || form.deliverTo.length < 2) e.deliverTo = 'Min 2 characters';
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
    const tid = toast.loading('Creating package...');
    try {
      await axiosInstance.post('/api/packages', { ...form, userName: user?.username ?? '' });
      toast.success('Package created!', { id: tid });
      navigate('/show-all');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create package.', { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const showPreview = form.pickupLocation.length >= 3 && form.destination.length >= 3;

  return (
    <div className="cp-page">
      <p className="breadcrumb">DELIVO / PACKAGES / NEW</p>
      <h2 className="cp-title">New Shipment</h2>
      <p className="cp-sub">Fill in the route and delivery details below.</p>
      <div className="cp-sep" />

      <div className="cp-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="cp-route-grid">
            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> PICKUP LOCATION</label>
              <div className={`t-input-wrap${focused.pickupLocation ? ' focused' : ''}`}>
                <LocationAutocomplete
                  name="pickupLocation"
                  value={form.pickupLocation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Type and pick a place, or enter your own text"
                  error={errors.pickupLocation}
                  inputClassName={`t-input${errors.pickupLocation ? ' has-error' : ''}`}
                />
              </div>
              {errors.pickupLocation && <p className="t-error">{errors.pickupLocation}</p>}
            </div>
            <span className="cp-route-arrow">→</span>
            <div className="t-group">
              <label className="t-label"><span className="arrow">→</span> DESTINATION</label>
              <div className={`t-input-wrap${focused.destination ? ' focused' : ''}`}>
                <LocationAutocomplete
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Type and pick a place, or enter your own text"
                  error={errors.destination}
                  inputClassName={`t-input${errors.destination ? ' has-error' : ''}`}
                />
              </div>
              {errors.destination && <p className="t-error">{errors.destination}</p>}
            </div>
          </div>

          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> DELIVERY BY</label>
            <div className={`t-input-wrap${focused.estimatedDeliveryTime ? ' focused' : ''}`}>
              <input className={`t-input${errors.estimatedDeliveryTime ? ' has-error' : ''}`} name="estimatedDeliveryTime" type="datetime-local" value={form.estimatedDeliveryTime} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.estimatedDeliveryTime && <p className="t-error">{errors.estimatedDeliveryTime}</p>}
          </div>

          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> ESTIMATED PRICE</label>
            <div className={`t-input-wrap cp-price-wrap${focused.estimatedPrice ? ' focused' : ''}`}>
              <span className="cp-price-prefix">₹</span>
              <input className={`t-input cp-price-input${errors.estimatedPrice ? ' has-error' : ''}`} name="estimatedPrice" type="number" min="0" step="0.01" placeholder="0.00" value={form.estimatedPrice} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.estimatedPrice && <p className="t-error">{errors.estimatedPrice}</p>}
          </div>

          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> RECIPIENT NAME</label>
            <div className={`t-input-wrap${focused.deliverTo ? ' focused' : ''}`}>
              <input className={`t-input${errors.deliverTo ? ' has-error' : ''}`} name="deliverTo" placeholder="Recipient name" value={form.deliverTo} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.deliverTo && <p className="t-error">{errors.deliverTo}</p>}
          </div>

          <button type="submit" className="btn-amber auth-submit" disabled={submitting}>
            {submitting ? <span className="btn-spinner" /> : 'Create Shipment'}
          </button>
        </form>
      </div>

      <div className={`cp-preview${showPreview ? ' show' : ''}`}>
        <p className="cp-preview__route mono">
          📍 {form.pickupLocation} → {form.destination}
        </p>
        {form.estimatedPrice && <p className="cp-preview__price mono amber">₹{form.estimatedPrice}</p>}
        {form.deliverTo && <p className="cp-preview__detail muted">Delivering to: {form.deliverTo}</p>}
        {form.estimatedDeliveryTime && <p className="cp-preview__detail muted">Scheduled: {form.estimatedDeliveryTime}</p>}
      </div>
    </div>
  );
};

export default CreatePackage;
