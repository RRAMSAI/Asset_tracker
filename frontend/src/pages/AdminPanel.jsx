import { useState, useEffect } from 'react';
import {
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineCollection,
  HiOutlineClipboardCheck,
  HiOutlineSave,
  HiOutlineCreditCard,
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import {
  getAllUsers,
  getProducts,
  updateProduct,
  getServiceRequests,
  updateServiceRequest,
  getAllExtensions,
  adminExtend,
  getSettings,
  updateSettings,
  formatINR,
} from '../services/api';
import { format } from 'date-fns';

const STATUS_STYLE = {
  Pending: 'badge badge-expiring',
  'In Progress': 'badge badge-admin',
  Resolved: 'badge badge-active',
};
const TYPE_STYLE = {
  'Warranty Service': 'badge badge-type-service',
  'Paid Service': 'badge badge-type-repair',
};
const PAYMENT_STYLE = {
  paid: 'badge badge-active',
  created: 'badge badge-expiring',
  failed: 'badge badge-expired',
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Global settings
  const [globalSettings, setGlobalSettings] = useState({ extensionPrice: 0, extensionDuration: 6 });
  const [globalDraft, setGlobalDraft] = useState({ extensionPrice: '', extensionDuration: '' });
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Warranty pricing editor
  const [editingProductId, setEditingProductId] = useState(null);
  const [priceDraft, setPriceDraft] = useState({ extensionPrice: '', extensionDuration: '' });
  const [savingPrice, setSavingPrice] = useState(false);

  // Admin direct extend
  const [extendingProductId, setExtendingProductId] = useState(null);
  const [extendMonths, setExtendMonths] = useState(6);
  const [adminExtending, setAdminExtending] = useState(false);

  // Service request management
  const [srStatusFilter, setSrStatusFilter] = useState('');
  const [srTypeFilter, setSrTypeFilter] = useState('');
  const [editingSrId, setEditingSrId] = useState(null);
  const [srDraft, setSrDraft] = useState({ status: '', adminNotes: '' });
  const [savingSr, setSavingSr] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [uRes, pRes, srRes, extRes, settingsRes] = await Promise.all([
        getAllUsers(),
        getProducts(),
        getServiceRequests(),
        getAllExtensions().catch(() => ({ data: { extensions: [] } })),
        getSettings().catch(() => ({ data: { settings: { extensionPrice: 0, extensionDuration: 6 } } })),
      ]);
      setUsers(uRes.data.users || []);
      setProducts(pRes.data.products || []);
      setServiceRequests(srRes.data.requests || []);
      setExtensions(extRes.data.extensions || []);
      const s = settingsRes.data.settings || { extensionPrice: 0, extensionDuration: 6 };
      setGlobalSettings(s);
      setGlobalDraft({ extensionPrice: s.extensionPrice || '', extensionDuration: s.extensionDuration || 6 });
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // ── Save global settings ──
  const saveGlobalSettings = async () => {
    setSavingGlobal(true);
    try {
      const res = await updateSettings({
        extensionPrice: Number(globalDraft.extensionPrice) || 0,
        extensionDuration: Number(globalDraft.extensionDuration) || 6,
      });
      setGlobalSettings(res.data.settings);
      toast.success('Global extension settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingGlobal(false);
    }
  };

  // ── Warranty pricing save ──
  const startEditPrice = (product) => {
    setEditingProductId(product._id);
    setExtendingProductId(null);
    setPriceDraft({
      extensionPrice:    product.extensionPrice    || '',
      extensionDuration: product.extensionDuration || 6,
    });
  };

  const savePrice = async (productId) => {
    setSavingPrice(true);
    try {
      await updateProduct(productId, {
        extensionPrice:    Number(priceDraft.extensionPrice)    || 0,
        extensionDuration: Number(priceDraft.extensionDuration) || 6,
      });
      toast.success('Extension pricing updated');
      setEditingProductId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Admin direct extend ──
  const startAdminExtend = (product) => {
    setExtendingProductId(product._id);
    setEditingProductId(null);
    setExtendMonths(product.extensionDuration || 6);
  };

  const doAdminExtend = async (productId) => {
    setAdminExtending(true);
    try {
      const res = await adminExtend({ productId, extensionMonths: extendMonths });
      toast.success(res.data.message || 'Warranty extended');
      setExtendingProductId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extend failed');
    } finally {
      setAdminExtending(false);
    }
  };

  // ── Service request update ──
  const startEditSr = (sr) => {
    setEditingSrId(sr._id);
    setSrDraft({ status: sr.status, adminNotes: sr.adminNotes || '' });
  };

  const saveSr = async (srId) => {
    setSavingSr(true);
    try {
      await updateServiceRequest(srId, srDraft);
      toast.success('Service request updated');
      setEditingSrId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingSr(false);
    }
  };

  const filteredSr = serviceRequests.filter((sr) => {
    if (srStatusFilter && sr.status !== srStatusFilter) return false;
    if (srTypeFilter && sr.serviceType !== srTypeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const pendingSr = serviceRequests.filter((s) => s.status === 'Pending').length;
  const totalRevenue = extensions
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  const stats = [
    { label: 'Total Users', value: users.length, icon: HiOutlineUsers, accent: 'var(--brand-primary)', bg: 'var(--brand-primary-muted)' },
    { label: 'Total Products', value: products.length, icon: HiOutlineCollection, accent: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    { label: 'Pending Requests', value: pendingSr, icon: HiOutlineClipboardCheck, accent: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    { label: 'Extension Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: HiOutlineCreditCard, accent: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
  ];

  const tabs = [
    { id: 'overview', label: 'Users' },
    { id: 'pricing', label: 'Warranty Pricing' },
    { id: 'services', label: `Service Requests (${serviceRequests.length})` },
    { id: 'payments', label: `Payments (${extensions.filter(e => e.paymentStatus === 'paid').length})` },
  ];

  return (
    <div className="animate-fade-up">
      <Toaster position="top-right" />

      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">System overview, warranty pricing, services & payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} className="card card-hover" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.accent }}>
                <s.icon style={{ fontSize: 20 }} />
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="btn btn-sm"
            style={{
              background: activeTab === t.id ? 'var(--brand-primary-muted)' : 'transparent',
              color: activeTab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)',
              border: activeTab === t.id ? '1px solid var(--brand-primary-border)' : '1px solid transparent',
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Users ── */}
      {activeTab === 'overview' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>All Users</p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '2px 9px', fontWeight: 500 }}>
              {users.length} total
            </span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-full)', background: u.role === 'admin' ? 'var(--brand-primary)' : 'var(--surface-overlay)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: u.role === 'admin' ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={u.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Warranty Pricing ── */}
      {activeTab === 'pricing' && (
        <>
        {/* ── Global Defaults Card ── */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Global Extension Defaults</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                This price applies to <strong>all products</strong> that don't have a per-product override.
                Users can only extend warranties when this is set.
              </p>
            </div>
            {globalSettings.extensionPrice > 0 ? (
              <span className="badge badge-active" style={{ flexShrink: 0 }}>Active</span>
            ) : (
              <span className="badge badge-expired" style={{ flexShrink: 0 }}>Not Set</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>Extension Price (₹)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                <input
                  type="number"
                  value={globalDraft.extensionPrice}
                  onChange={(e) => setGlobalDraft({ ...globalDraft, extensionPrice: e.target.value })}
                  className="input"
                  style={{ width: 120, padding: '8px 10px' }}
                  min="0"
                  placeholder="e.g. 999"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>Extension Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  value={globalDraft.extensionDuration}
                  onChange={(e) => setGlobalDraft({ ...globalDraft, extensionDuration: e.target.value })}
                  className="input"
                  style={{ width: 80, padding: '8px 10px' }}
                  min="1"
                  placeholder="6"
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>months</span>
              </div>
            </div>
            <button
              onClick={saveGlobalSettings}
              disabled={savingGlobal}
              className="btn btn-primary"
              style={{ height: 38 }}
            >
              {savingGlobal
                ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : <><HiOutlineSave style={{ fontSize: 15 }} /> Save Global Settings</>
              }
            </button>
          </div>
          {globalSettings.extensionPrice > 0 && (
            <p style={{ fontSize: 12, color: 'var(--status-success)', marginTop: 12, fontWeight: 500 }}>
              ✓ Users can extend warranties for {formatINR(globalSettings.extensionPrice)} / {globalSettings.extensionDuration} months
            </p>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Per-Product Price Override <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Override the global price for specific products. Leave at "Global" to use the default price above.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>Owner</th><th>Current Expiry</th><th>Ext. Duration</th><th>Ext. Price (₹)</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {products.map((p) => {
                  const isEditing   = editingProductId   === p._id;
                  const isExtending = extendingProductId === p._id;
                  return (
                    <tr key={p._id}>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.brand}</p>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.user?.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {p.warrantyExpiryDate ? format(new Date(p.warrantyExpiryDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              value={priceDraft.extensionDuration}
                              onChange={(e) => setPriceDraft({ ...priceDraft, extensionDuration: e.target.value })}
                              className="input"
                              style={{ width: 60, padding: '6px 8px', fontSize: 12 }}
                              min="1"
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>months</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>{p.extensionDuration || 6} mo</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹</span>
                            <input
                              type="number"
                              value={priceDraft.extensionPrice}
                              onChange={(e) => setPriceDraft({ ...priceDraft, extensionPrice: e.target.value })}
                              className="input"
                              style={{ width: 90, padding: '6px 8px', fontSize: 12 }}
                              min="0"
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <span style={{ color: p.extensionPrice > 0 ? 'var(--status-success)' : 'var(--text-muted)', fontWeight: 600 }}>
                            {p.extensionPrice > 0 ? formatINR(p.extensionPrice) : 'Global'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                          {/* ── Admin Extend panel ── */}
                          {isExtending ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="number"
                                  value={extendMonths}
                                  onChange={(e) => setExtendMonths(Number(e.target.value) || 1)}
                                  className="input"
                                  style={{ width: 55, padding: '6px 8px', fontSize: 12 }}
                                  min="1"
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>mo</span>
                              </div>
                              <button onClick={() => doAdminExtend(p._id)} disabled={adminExtending} className="btn btn-sm btn-primary">
                                {adminExtending ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : '✓ Extend'}
                              </button>
                              <button onClick={() => setExtendingProductId(null)} className="btn btn-sm btn-secondary">✕</button>
                            </>
                          ) : isEditing ? (
                            <>
                              <button onClick={() => savePrice(p._id)} disabled={savingPrice} className="btn btn-sm btn-primary">
                                {savingPrice ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : <><HiOutlineSave style={{ fontSize: 14 }} /> Save</>}
                              </button>
                              <button onClick={() => setEditingProductId(null)} className="btn btn-sm btn-secondary">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startAdminExtend(p)} className="btn btn-sm btn-primary" title="Extend this warranty now (free)">
                                Extend Now
                              </button>
                              <button onClick={() => startEditPrice(p)} className="btn btn-sm btn-secondary">Set Price</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* ── TAB: Service Requests ── */}
      {activeTab === 'services' && (
        <>
          <div className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <select value={srStatusFilter} onChange={(e) => setSrStatusFilter(e.target.value)} className="select" style={{ width: 'auto', minWidth: 130 }}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select value={srTypeFilter} onChange={(e) => setSrTypeFilter(e.target.value)} className="select" style={{ width: 'auto', minWidth: 150 }}>
                <option value="">All Types</option>
                <option value="Warranty Service">Warranty</option>
                <option value="Paid Service">Paid</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Product</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="hide-mobile">Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSr.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <span className="empty-icon"><HiOutlineClipboardCheck /></span>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>No service requests</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSr.map((sr) => {
                      const isEditing = editingSrId === sr._id;
                      return (
                        <tr key={sr._id} style={{ verticalAlign: 'top' }}>
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{sr.user?.name || '—'}</td>
                          <td>
                            <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{sr.product?.name || 'Unknown'}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sr.product?.brand}</p>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 180 }}>
                            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sr.subject}>{sr.subject}</p>
                            {sr.description && (
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'normal', lineHeight: 1.4 }}>
                                {sr.description.length > 80 ? sr.description.slice(0, 80) + '...' : sr.description}
                              </p>
                            )}
                          </td>
                          <td><span className={TYPE_STYLE[sr.serviceType] || 'badge badge-user'}>{sr.serviceType}</span></td>
                          <td>
                            {isEditing ? (
                              <select value={srDraft.status} onChange={(e) => setSrDraft({ ...srDraft, status: e.target.value })} className="select" style={{ width: 120, padding: '6px 8px', fontSize: 12 }}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            ) : (
                              <span className={STATUS_STYLE[sr.status] || 'badge badge-user'}>{sr.status}</span>
                            )}
                          </td>
                          <td className="hide-mobile" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {sr.createdAt ? format(new Date(sr.createdAt), 'MMM d, yyyy') : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              {isEditing ? (
                                <>
                                  <textarea
                                    value={srDraft.adminNotes}
                                    onChange={(e) => setSrDraft({ ...srDraft, adminNotes: e.target.value })}
                                    className="input"
                                    placeholder="Admin notes..."
                                    style={{ width: 180, minHeight: 50, fontSize: 11, resize: 'vertical', padding: '6px 8px' }}
                                  />
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => saveSr(sr._id)} disabled={savingSr} className="btn btn-sm btn-primary">
                                      {savingSr ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingSrId(null)} className="btn btn-sm btn-secondary">Cancel</button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditSr(sr)} className="btn btn-sm btn-secondary">Manage</button>
                                  {sr.adminNotes && (
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 160, textAlign: 'right', lineHeight: 1.3 }}>
                                      Note: {sr.adminNotes.length > 50 ? sr.adminNotes.slice(0, 50) + '...' : sr.adminNotes}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Payment Tracking ── */}
      {activeTab === 'payments' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Warranty Extension Payments</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All warranty extension transactions</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-success)' }}>
              Total: ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Product</th>
                  <th>Extension</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="hide-mobile">Previous Expiry</th>
                  <th className="hide-mobile">New Expiry</th>
                  <th className="hide-mobile">Date</th>
                </tr>
              </thead>
              <tbody>
                {extensions.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <span className="empty-icon"><HiOutlineCreditCard /></span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No payments yet</p>
                        <p style={{ fontSize: 12 }}>Extension payments will appear here once users extend warranties.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  extensions.map((ext) => (
                    <tr key={ext._id}>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {ext.user?.name || '—'}
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{ext.user?.email}</p>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{ext.product?.name || 'Unknown'}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ext.product?.brand}</p>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>+{ext.extensionMonths} mo</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{(ext.amountPaid || 0).toLocaleString('en-IN')}</td>
                      <td><span className={PAYMENT_STYLE[ext.paymentStatus] || 'badge badge-user'}>{ext.paymentStatus}</span></td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {ext.previousExpiryDate ? format(new Date(ext.previousExpiryDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--status-success)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {ext.newExpiryDate ? format(new Date(ext.newExpiryDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {ext.createdAt ? format(new Date(ext.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
