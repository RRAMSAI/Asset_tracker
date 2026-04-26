import { useState, useEffect } from 'react';
import {
  HiOutlinePlusCircle,
  HiOutlineClipboardCheck,
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import {
  getServiceRequests,
  createServiceRequest,
  getProducts,
} from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  Pending:       'badge badge-expiring',
  'In Progress': 'badge badge-admin',
  Resolved:      'badge badge-active',
};

const TYPE_STYLE = {
  'Warranty Service': 'badge badge-type-service',
  'Paid Service':     'badge badge-type-repair',
};

const emptyForm = {
  productId: '',
  subject: '',
  description: '',
};

const ServiceRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { fetchData(); }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.serviceType = typeFilter;

      const [reqRes, prodRes] = await Promise.all([
        getServiceRequests(params),
        getProducts(),
      ]);
      setRequests(reqRes.data.requests || []);
      setProducts(prodRes.data.products || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.subject || !form.description) {
      return toast.error('Product, subject and description are required');
    }
    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append('productId', form.productId);
      fd.append('subject', form.subject);
      fd.append('description', form.description);
      if (file) fd.append('attachmentFile', file);

      const res = await createServiceRequest(fd);
      const sr = res.data.serviceRequest;

      toast.success(
        `Service request created as "${sr.serviceType}"`
      );
      setShowForm(false);
      setForm(emptyForm);
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Requests</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${requests.length} request${requests.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-primary"
          id="add-service-request-btn"
        >
          {showForm
            ? <><HiOutlineX style={{ fontSize: 16 }} /> Cancel</>
            : <><HiOutlinePlusCircle style={{ fontSize: 17 }} /> Report Problem</>
          }
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card animate-fade-up" style={{ padding: '22px 24px', marginBottom: 16 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            marginBottom: 18, paddingBottom: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            New Service Request
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px 16px', marginBottom: 14,
            }}>
              <div className="form-group">
                <label htmlFor="sr-product" className="form-label">
                  Product <span className="required">*</span>
                </label>
                <select
                  id="sr-product"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="select"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}{p.brand ? ` (${p.brand})` : ''} — {p.warrantyStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sr-subject" className="form-label">
                  Subject <span className="required">*</span>
                </label>
                <input
                  id="sr-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                  placeholder="e.g. Screen not responding"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="sr-description" className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="sr-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                placeholder="Describe the issue in detail..."
                style={{ minHeight: 90, resize: 'vertical' }}
              />
            </div>

            {/* File upload */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Attachment (optional)</label>
              <div
                className="upload-zone"
                style={{ padding: '16px 20px' }}
                onClick={() => document.getElementById('sr-file-input').click()}
              >
                <input
                  type="file"
                  id="sr-file-input"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <HiOutlineCheckCircle style={{ color: 'var(--status-success)', fontSize: 18 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                    >
                      <HiOutlineX style={{ fontSize: 14 }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)' }}>
                    <HiOutlinePhotograph style={{ fontSize: 20 }} />
                    <span style={{ fontSize: 12 }}>Click to upload an image or PDF</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={formLoading} className="btn btn-primary" id="sr-submit">
                {formLoading
                  ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  : 'Submit Request'
                }
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setFile(null); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select"
            style={{ width: 'auto', minWidth: 150 }}
          >
            <option value="">All Types</option>
            <option value="Warranty Service">Warranty Service</option>
            <option value="Paid Service">Paid Service</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="hide-mobile">Created</th>
                  {user?.role === 'admin' && <th className="hide-mobile">User</th>}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5}>
                      <div className="empty-state">
                        <span className="empty-icon"><HiOutlineClipboardCheck /></span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          No service requests
                        </p>
                        <p style={{ fontSize: 12 }}>Submit a request if you're having issues with a product.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((sr) => (
                    <tr key={sr._id}>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                          {sr.product?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {sr.product?.brand}
                        </p>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sr.subject}>
                        {sr.subject}
                      </td>
                      <td>
                        <span className={TYPE_STYLE[sr.serviceType] || 'badge badge-user'}>{sr.serviceType}</span>
                      </td>
                      <td>
                        <span className={STATUS_STYLE[sr.status] || 'badge badge-user'}>{sr.status}</span>
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {sr.createdAt ? format(new Date(sr.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                          {sr.user?.name || '—'}
                        </td>
                      )}
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

export default ServiceRequests;
