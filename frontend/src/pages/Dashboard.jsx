import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineCurrencyRupee,
  HiOutlinePlusCircle,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getDashboardStats, getProducts } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#f43f5e'];

const getBadgeClass = (status) => {
  if (status === 'Active') return 'badge badge-active';
  if (status === 'Expiring Soon') return 'badge badge-expiring';
  return 'badge badge-expired';
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        getDashboardStats(),
        getProducts({ sort: 'expiry' }),
      ]);
      setStats(statsRes.data.stats);
      setRecentProducts(productsRes.data.products?.slice(0, 6) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.total || 0,
      icon: HiOutlineShieldCheck,
      accent: 'var(--brand-primary)',
      bg: 'var(--brand-primary-muted)',
    },
    {
      label: 'Active Warranties',
      value: stats?.active || 0,
      icon: HiOutlineShieldCheck,
      accent: 'var(--status-success)',
      bg: 'var(--status-success-bg)',
      alert: false,
    },
    {
      label: 'Expiring Soon',
      value: stats?.expiringSoon || 0,
      icon: HiOutlineExclamation,
      accent: 'var(--status-warning)',
      bg: 'var(--status-warning-bg)',
      alert: (stats?.expiringSoon || 0) > 0,
    },
    {
      label: 'Expired',
      value: stats?.expired || 0,
      icon: HiOutlineXCircle,
      accent: 'var(--status-danger)',
      bg: 'var(--status-danger-bg)',
    },
  ];

  const pieData = [
    { name: 'Active',        value: stats?.active || 0 },
    { name: 'Expiring Soon', value: stats?.expiringSoon || 0 },
    { name: 'Expired',       value: stats?.expired || 0 },
  ].filter((d) => d.value > 0);

  const categoryData = stats?.categories
    ? Object.entries(stats.categories).map(([name, value]) => ({ name, value }))
    : [];

  const catColors = ['var(--brand-primary)', '#22c55e', '#f59e0b', '#f43f5e', '#38bdf8', '#a855f7'];

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong> —
            here's your warranty overview.
          </p>
        </div>
        <Link to="/add-product" className="btn btn-primary" id="dashboard-add-btn">
          <HiOutlinePlusCircle style={{ fontSize: 17 }} />
          Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {statCards.map((card) => (
          <div key={card.label} className="card card-hover" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div
                className="stat-icon"
                style={{ background: card.bg, color: card.accent }}
              >
                <card.icon style={{ fontSize: 20 }} />
              </div>
              {card.alert && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    background: 'var(--status-warning-bg)',
                    color: 'var(--status-warning)',
                    border: '1px solid var(--status-warning-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 8px',
                  }}
                >
                  ALERT
                </span>
              )}
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {card.value}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Warranty Status donut */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Warranty Status</p>
          {pieData.length > 0 ? (
            <>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-elevated)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ paddingTop: 32, paddingBottom: 32 }}>
              <p style={{ fontSize: 13 }}>No data yet</p>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>By Category</p>
          {categoryData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryData.map((cat, i) => {
                const total = categoryData.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cat.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.value}</span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--surface-overlay)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: catColors[i % catColors.length],
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ paddingTop: 32, paddingBottom: 32 }}>
              <p style={{ fontSize: 13 }}>No data yet</p>
            </div>
          )}
        </div>

        {/* Portfolio value */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Portfolio Value</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="stat-icon"
              style={{ background: 'var(--brand-primary-muted)', color: 'var(--brand-primary)', width: 44, height: 44 }}
            >
              <HiOutlineCurrencyRupee style={{ fontSize: 22 }} />
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
                ₹{(stats?.totalValue || 0).toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Total asset value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming expirations table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Upcoming Expirations</p>
          <Link
            to="/products"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--brand-primary)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            View all <HiOutlineArrowRight style={{ fontSize: 13 }} />
          </Link>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hide-mobile">Category</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <span className="empty-icon"><HiOutlineShieldCheck /></span>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>No products yet</p>
                      <Link to="/add-product" style={{ fontSize: 12, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                        Add your first product →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recentProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.brand}</p>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {p.warrantyExpiryDate ? format(new Date(p.warrantyExpiryDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      <span className={getBadgeClass(p.warrantyStatus)}>{p.warrantyStatus}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
