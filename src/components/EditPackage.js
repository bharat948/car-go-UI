import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import LoadingSpinner from './LoadingSpinner';
import './EditPackage.css';

const EditPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ pickupLocation: '', destination: '', estimatedPrice: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState({});

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axiosInstance.get(`/api/packages/${id}`);
        setForm({
          pickupLocation: res.data.pickupLocation ?? '',
          destination: res.data.destination ?? '',
          estimatedPrice: res.data.estimatedPrice ?? '',
        });
      } catch {
        toast.error('Failed to load package.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (form.pickupLocation && form.pickupLocation.length < 3) e.pickupLocation = 'Min 3 characters';
    if (form.destination && form.destination.length < 3) e.destination = 'Min 3 characters';
    if (form.destination && form.pickupLocation && form.destination.trim().toLowerCase() === form.pickupLocation.trim().toLowerCase()) {
      e.destination = 'Must differ from pickup location';
    }
    if (form.estimatedPrice !== '' && (isNaN(form.estimatedPrice) || Number(form.estimatedPrice) <= 0)) {
      e.estimatedPrice = 'Must be a positive number';
    }
    if (!form.pickupLocation && !form.destination && !form.estimatedPrice) {
      e.pickupLocation = 'At least one field must be filled';
    }
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
      await axiosInstance.put(`/api/packages/${id}`, {
        pickupLocation: form.pickupLocation || undefined,
        destination: form.destination || undefined,
        estimatedPrice: form.estimatedPrice || undefined,
      });
      toast.success('Package updated!');
      navigate('/my-packages');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="ep-page">
      <p className="breadcrumb">DELIVO / PACKAGES / EDIT</p>
      <h2 className="ep-title">Edit Shipment</h2>
      <p className="ep-sub">Update route or pricing details.</p>
      <div className="ep-sep" />

      <div className="ep-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> PICKUP LOCATION</label>
            <div className={`t-input-wrap${focused.pickupLocation ? ' focused' : ''}`}>
              <input className={`t-input${errors.pickupLocation ? ' has-error' : ''}`} name="pickupLocation" value={form.pickupLocation} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.pickupLocation && <p className="t-error">{errors.pickupLocation}</p>}
          </div>

          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> DESTINATION</label>
            <div className={`t-input-wrap${focused.destination ? ' focused' : ''}`}>
              <input className={`t-input${errors.destination ? ' has-error' : ''}`} name="destination" value={form.destination} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.destination && <p className="t-error">{errors.destination}</p>}
          </div>

          <div className="t-group">
            <label className="t-label"><span className="arrow">→</span> ESTIMATED PRICE</label>
            <div className={`t-input-wrap cp-price-wrap${focused.estimatedPrice ? ' focused' : ''}`}>
              <span className="cp-price-prefix">₹</span>
              <input className={`t-input cp-price-input${errors.estimatedPrice ? ' has-error' : ''}`} name="estimatedPrice" type="number" value={form.estimatedPrice} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
            {errors.estimatedPrice && <p className="t-error">{errors.estimatedPrice}</p>}
          </div>

          <button type="submit" className="btn-amber auth-submit" disabled={submitting}>
            {submitting ? <span className="btn-spinner" /> : 'Update Shipment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPackage;
