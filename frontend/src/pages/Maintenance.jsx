import { useState, useEffect } from 'react';
import {
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineClipboardList,
  HiOutlineX,
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import {
  getMaintenanceRecords,
  addMaintenanceRecord,
  deleteMaintenanceRecord,
  getProducts,
} from '../services/api';
import { format } from 'date-fns';

const TYPES = ['Repair', 'Service', 'Replacement', 'Inspection', 'Other'];

const TYPE_BADGE = {
  Repair:      'badge badge-type-repair',
  Service:     'badge badge-type-service',
  Replacement: 'badge badge-type-replacement',
  Inspection:  'badge badge-type-inspection',
  Other:       'badge badge-type-other',
};

const emptyForm = {
  product: '',
  type: 'Service',
  description: '',
  serviceDate: '',
  cost: '',
  serviceProvider: '',
  notes: '',
};

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [recRes, prodRes] = await Promise.all([
        getMaintenanceRecords(),
        getProducts(),
      ]);
      setRecords(recRes.data.records || []);
      setProducts(prodRes.data.products || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.description || !form.serviceDate) {
      return toast.error('Product, description and service date are required');
    }
    setFormLoading(true);
    try {
      await addMaintenanceRecord(form);
      toast.success('Maintenance record added');
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add record');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await deleteMaintenanceRecord(id);
      setRecords(records.filter((r) => r._id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="animate-fade-up">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${records.length} record${records.length !== 1 ? 's' : ''} logged`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-primary"
          id="add-maintenance-btn"
        >
          {showForm
            ? <><HiOutlineX style={{ fontSize: 16 }} /> Cancel</>
            : <><HiOutlinePlusCircle style={{ fontSize: 17 }} /> Add Record</>
          }
        </button>
      </div>

      {/* Add Record Form */}
      {showForm && (
        <div
          className="card animate-fade-up"
          style={{ padding: '22px 24px', marginBottom: 16 }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            New Maintenance Record
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '14px 16px',
                marginBottom: 14,
              }}
            >
              <div className="form-group">
                <label htmlFor="maint-product" className="form-label">
                  Product <span className="required">*</span>
                </label>
                <select
                  id="maint-product"
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  className="select"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}{p.brand ? ` (${p.brand})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maint-type" className="form-label">Type</label>
                <select
                  id="maint-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="select"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maint-date" className="form-label">
                  Service Date <span className="required">*</span>
                </label>
                <input
                  id="maint-date"
                  type="date"
                  value={form.serviceDate}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maint-provider" className="form-label">Service Provider</label>
                <input
                  id="maint-provider"
                  value={form.serviceProvider}
                  onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })}
                  className="input"
                  placeholder="e.g. TechRepair Co."
                />
              </div>

              <div className="form-group">
                <label htmlFor="maint-cost" className="form-label">Cost (₹)</label>
                <input
                  id="maint-cost"
                  type="number"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="input"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label htmlFor="maint-desc" className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="maint-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                placeholder="Describe the maintenance work performed..."
                style={{ minHeight: 80, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                id="maint-submit"
                disabled={formLoading}
                className="btn btn-primary"
              >
                {formLoading
                  ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  : 'Save Record'
                }
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="hide-mobile">Date</th>
                  <th className="hide-mobile">Cost</th>
                  <th className="hide-mobile">Provider</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-icon"><HiOutlineClipboardList /></span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          No maintenance records
                        </p>
                        <p style={{ fontSize: 12 }}>Add a record to track service history for your products.</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: 8 }}
                        >
                          <HiOutlinePlusCircle /> Add Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                          {r.product?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.product?.brand}
                        </p>
                      </td>
                      <td>
                        <span className={TYPE_BADGE[r.type] || TYPE_BADGE.Other}>{r.type}</span>
                      </td>
                      <td
                        style={{
                          color: 'var(--text-secondary)',
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.description}
                      >
                        {r.description}
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.serviceDate ? format(new Date(r.serviceDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                        {r.cost ? `₹${Number(r.cost).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                        {r.serviceProvider || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="btn btn-icon btn-ghost"
                            title="Delete record"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--status-danger)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <HiOutlineTrash style={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;
