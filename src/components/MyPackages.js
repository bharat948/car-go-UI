import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import PackageCard from './PackageCard';
import LoadingSpinner from './LoadingSpinner';
import './MyPackages.css';

const FILTERS = ['all', 'pending', 'accepted', 'in_transit', 'delivered', 'cancelled'];
const LABELS = { all: 'All', pending: 'Pending', accepted: 'Accepted', in_transit: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled' };

const MyPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/api/my-packages');
        setPackages(res.data);
      } catch {
        toast.error('Failed to load packages.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (pkg) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await axiosInstance.delete(`/api/packages/${pkg.id}`);
      setPackages((prev) => prev.filter((x) => x.id !== pkg.id));
      toast.success('Package deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleCancel = async (pkg) => {
    if (!window.confirm('Cancel this package?')) return;
    try {
      await axiosInstance.patch(`/api/packages/${pkg.id}/status`, { status: 'cancelled' });
      setPackages((prev) => prev.map((x) => (x.id === pkg.id ? { ...x, status: 'cancelled' } : x)));
      toast.success('Package cancelled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    }
  };

  const filtered = filter === 'all' ? packages : packages.filter((p) => (p.status || 'pending') === filter);
  const countFor = (f) => f === 'all' ? packages.length : packages.filter((p) => (p.status || 'pending') === f).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mp-page page-wrap">
      <div className="mp-header">
        <div>
          <h2 className="mp-title">My Shipments</h2>
          <p className="mp-count">{packages.length} total packages</p>
        </div>
        <Link to="/create-package" className="btn-amber btn-sm" style={{ textDecoration: 'none' }}>+ New Package</Link>
      </div>

      <div className="mp-filters">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`mp-pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {LABELS[f]} <span className="mp-pill__count">{countFor(f)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty__icon">📦</span>
          <p className="mp-empty__title">No shipments found</p>
          <p className="mp-empty__sub">Create your first package to get started.</p>
          <Link to="/create-package" className="btn-amber btn-sm" style={{ textDecoration: 'none', marginTop: 12 }}>+ Create Package</Link>
        </div>
      ) : (
        <div className="pkg-grid">
          {filtered.map((pkg, i) => {
            const status = pkg.status || 'pending';
            const isPending = status === 'pending';
            const actions = [];
            if (isPending) actions.push({ label: 'Edit', className: 'btn-ghost btn-sm', onClick: () => window.location.assign(`/edit-package/${pkg.id}`) });
            if (isPending) actions.push({ label: 'Cancel', className: 'btn-danger-outline btn-sm', onClick: () => handleCancel(pkg) });
            actions.push({ label: 'Delete', className: 'btn-danger-outline btn-sm', onClick: () => handleDelete(pkg) });
            return <PackageCard key={pkg.id} pkg={pkg} actions={actions} style={{ animationDelay: `${i * 50}ms` }} />;
          })}
        </div>
      )}
    </div>
  );
};

export default MyPackages;
