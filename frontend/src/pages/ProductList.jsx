import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineDocumentDownload,
  HiOutlinePlusCircle,
  HiOutlineCollection,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import {
  getProducts,
  deleteProduct,
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure,
  getSettings,
  formatINR,
} from '../services/api';
import { format, addMonths } from 'date-fns';

const CATEGORIES = ['Electronics', 'Appliances', 'Furniture', 'Automobile', 'Software', 'Other'];

const getBadgeClass = (status) => {
  if (status === 'Active') return 'badge badge-active';
  if (status === 'Expiring Soon') return 'badge badge-expiring';
  return 'badge badge-expired';
};

const ProductList = () => {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [extendingId, setExtendingId]       = useState(null);

  // Global settings (for fallback pricing)
  const [globalSettings, setGlobalSettings] = useState({ extensionPrice: 0, extensionDuration: 6 });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null); // { product, price, duration, newExpiry }

  useEffect(() => { fetchProducts(); fetchGlobalSettings(); }, []);
  useEffect(() => { fetchProducts(); }, [statusFilter, categoryFilter]);

  const fetchGlobalSettings = async () => {
    try {
      const res = await getSettings();
      setGlobalSettings(res.data.settings || { extensionPrice: 0, extensionDuration: 6 });
    } catch {
      // Silent — global settings not available
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter)   params.status   = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search)         params.search   = search;
      const res = await getProducts(params);
      setProducts(res.data.products || []);
    } catch {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchProducts(); };
  const clearSearch  = ()  => { setSearch(''); fetchProducts(); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Resolve effective price for a product ──────────────────────────────────
  const getEffectivePrice = (product) => {
    const productPrice = Number(product.extensionPrice) || 0;
    const productDuration = Number(product.extensionDuration) || 0;
    const globalPrice = Number(globalSettings.extensionPrice) || 0;
    const globalDuration = Number(globalSettings.extensionDuration) || 6;

    return {
      price: productPrice > 0 ? productPrice : globalPrice,
      duration: productDuration > 0 ? productDuration : globalDuration,
      source: productPrice > 0 ? 'product' : 'global',
    };
  };

  // ── Show confirmation modal before payment ─────────────────────────────────
  const showExtendConfirmation = (product) => {
    const { price, duration } = getEffectivePrice(product);
    if (price <= 0) return; // Should not happen if button is hidden

    const currentExpiry = product.warrantyExpiryDate ? new Date(product.warrantyExpiryDate) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = addMonths(baseDate, duration);

    setConfirmModal({
      product,
      price,
      duration,
      currentExpiry,
      newExpiry,
    });
  };

  // ── Razorpay Extend Warranty Flow ──────────────────────────────────────────
  const handleExtendWarranty = useCallback(async (productId) => {
    setConfirmModal(null);
    setExtendingId(productId);
    try {
      // 1. Create order on backend
      const { data } = await createPaymentOrder({ productId });
      const { order, product, razorpayKeyId } = data;

      // 2. Open Razorpay checkout
      const options = {
        key:         razorpayKeyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'WarrantyVault',
        description: `Extend warranty for ${product.name} by ${product.extensionMonths} months`,
        order_id:    order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(verifyRes.data.message || 'Warranty extended!');
            fetchProducts();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }),
        },
        prefill: {},
        theme: { color: '#4f6ef7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        try {
          await reportPaymentFailure({ razorpay_order_id: response.error?.metadata?.order_id });
        } catch { /* ignore */ }
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    } finally {
      setExtendingId(null);
    }
  }, []);

  return (
    <div className="animate-fade-up">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Link to="/add-product" className="btn btn-primary" id="products-add-btn">
          <HiOutlinePlusCircle style={{ fontSize: 17 }} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ flex: '1 1 220px', display: 'flex', gap: 8, minWidth: 0 }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
              <HiOutlineSearch className="input-icon" />
              <input
                id="product-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-icon-left"
                placeholder="Search by name, brand..."
                style={{ paddingRight: search ? 36 : 13 }}
              />
              {search && (
                <button type="button" className="input-icon-end" onClick={clearSearch} aria-label="Clear search">
                  <HiOutlineX style={{ fontSize: 14 }} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select" style={{ width: 'auto', minWidth: 130 }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
          <select id="category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select" style={{ width: 'auto', minWidth: 140 }}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  <th className="hide-mobile">Category</th>
                  <th className="hide-mobile">Purchased</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th className="hide-mobile">Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-icon"><HiOutlineCollection /></span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No products found</p>
                        <Link to="/add-product" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                          <HiOutlinePlusCircle /> Add Product
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const canExtend  = p.isExtendable !== false;
                    const { price: effectivePrice, duration: effectiveDuration } = getEffectivePrice(p);
                    const hasPricing = effectivePrice > 0;
                    const isExtending = extendingId === p._id;

                    return (
                      <tr key={p._id}>
                        <td>
                          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {p.brand}{p.model ? ` · ${p.model}` : ''}
                          </p>
                        </td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                          {p.purchaseDate ? format(new Date(p.purchaseDate), 'MMM d, yyyy') : '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {p.warrantyExpiryDate ? format(new Date(p.warrantyExpiryDate), 'MMM d, yyyy') : '—'}
                        </td>
                        <td><span className={getBadgeClass(p.warrantyStatus)}>{p.warrantyStatus}</span></td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                          {p.purchasePrice ? formatINR(p.purchasePrice) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'nowrap' }}>

                            {/* ── Extend Warranty ── */}
                            {canExtend && hasPricing && (
                              <button
                                onClick={() => showExtendConfirmation(p)}
                                disabled={isExtending}
                                className="btn btn-sm"
                                title={`Extend +${effectiveDuration}mo — ${formatINR(effectivePrice)}`}
                                style={{
                                  background: 'var(--brand-primary-muted)',
                                  color: 'var(--brand-primary)',
                                  border: '1px solid var(--brand-primary-border)',
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  whiteSpace: 'nowrap',
                                  opacity: 1,
                                }}
                              >
                                {isExtending
                                  ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                                  : <><HiOutlineRefresh style={{ fontSize: 13 }} /> Extend</>
                                }
                              </button>
                            )}

                            {/* Extension not available — show subtle disabled indicator */}
                            {canExtend && !hasPricing && (
                              <span
                                title="Extension pricing not configured yet"
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                  padding: '4px 10px',
                                  background: 'var(--surface-overlay)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: 'var(--radius-md)',
                                  cursor: 'default',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  whiteSpace: 'nowrap',
                                  opacity: 0.6,
                                }}
                              >
                                <HiOutlineShieldCheck style={{ fontSize: 13 }} /> Extend
                              </span>
                            )}

                            {/* Report Problem */}
                            <Link
                              to="/service-requests"
                              className="btn btn-icon btn-ghost"
                              title="Report a problem"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <HiOutlineExclamation style={{ fontSize: 16 }} />
                            </Link>

                            {/* Invoice */}
                            {p.invoiceFile && (
                              <a href={`/uploads/${p.invoiceFile}`} target="_blank" rel="noreferrer" className="btn btn-icon btn-ghost" title="View Invoice" style={{ color: 'var(--text-muted)' }}>
                                <HiOutlineDocumentDownload style={{ fontSize: 16 }} />
                              </a>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(p._id, p.name)}
                              className="btn btn-icon btn-ghost"
                              title="Delete"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-danger)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <HiOutlineTrash style={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 420,
              margin: 16,
              padding: '28px 28px 24px',
              animation: 'slideUp 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                className="stat-icon"
                style={{
                  background: 'var(--brand-primary-muted)',
                  color: 'var(--brand-primary)',
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                }}
              >
                <HiOutlineShieldCheck style={{ fontSize: 20 }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Extend Warranty
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {confirmModal.product.name}
                </p>
              </div>
            </div>

            {/* Details */}
            <div
              style={{
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Extension Duration</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  +{confirmModal.duration} months
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Expiry</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {format(confirmModal.currentExpiry, 'MMM d, yyyy')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>New Expiry</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-success)' }}>
                  {format(confirmModal.newExpiry, 'MMM d, yyyy')}
                </span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Amount</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {formatINR(confirmModal.price)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleExtendWarranty(confirmModal.product._id)}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                Pay & Extend
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="btn btn-secondary btn-lg"
                style={{ minWidth: 90 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
