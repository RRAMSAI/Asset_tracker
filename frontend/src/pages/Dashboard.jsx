import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineXCircle, HiOutlineCurrencyDollar, HiOutlinePlusCircle, HiOutlineChevronRight } from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getDashboardStats, getProducts } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

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
      setRecentProducts(productsRes.data.products?.slice(0, 5) || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Products', value: stats?.total || 0, icon: HiOutlineShieldCheck, color: 'from-indigo-500 to-purple-600', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Active Warranties', value: stats?.active || 0, icon: HiOutlineShieldCheck, color: 'from-emerald-500 to-teal-600', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Expiring Soon', value: stats?.expiringSoon || 0, icon: HiOutlineExclamation, color: 'from-amber-500 to-orange-600', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Expired', value: stats?.expired || 0, icon: HiOutlineXCircle, color: 'from-red-500 to-rose-600', bg: 'rgba(239,68,68,0.1)' },
  ];

  const pieData = [
    { name: 'Active', value: stats?.active || 0, color: '#10b981' },
    { name: 'Expiring Soon', value: stats?.expiringSoon || 0, color: '#f59e0b' },
    { name: 'Expired', value: stats?.expired || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const categoryData = stats?.categories ? Object.entries(stats.categories).map(([name, value]) => ({ name, value })) : [];

  const catColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const getBadge = (status) => {
    if (status === 'Active') return 'badge badge-active';
    if (status === 'Expiring Soon') return 'badge badge-expiring';
    return 'badge badge-expired';
  };

  return (
    <div className="w-full max-w-7xl animate-fade-in mt-[28px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-[20px]">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-[var(--color-text-muted)] text-base mt-2">Here's your warranty overview</p>
        </div>
        <Link to="/add-product" className="btn-primary" id="dashboard-add-btn">
          <HiOutlinePlusCircle className="text-lg" /> Add Product
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[20px]">
        {statCards.map((card, i) => (
          <div key={card.label} className="glass-card p-[20px]" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-[12px]">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="text-white text-lg" />
              </div>
              {card.label === 'Expiring Soon' && card.value > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">ALERT</span>
              )}
            </div>
            <p className="text-3xl font-bold mt-[6px]">{card.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-[6px]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts + Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* Warranty Status Chart */}
        <div className="glass-card p-[24px]">
          <h3 className="text-base font-bold mb-6">Warranty Status</h3>
          {pieData.length > 0 ? (
            <div className="max-h-[180px] py-[16px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-[var(--color-text-muted)] py-12 text-sm">No data yet</p>}
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-[24px]">
          <h3 className="text-base font-bold mb-6">By Category</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-[12px]">
              {categoryData.map((cat, i) => {
                const total = categoryData.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-[8px]">
                      <span className="text-[var(--color-text-secondary)]">{cat.name}</span>
                      <span className="font-medium">{cat.value}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-dark)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: catColors[i % catColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-center text-[var(--color-text-muted)] py-12 text-sm">No data yet</p>}
        </div>

        {/* Total Value */}
        <div className="glass-card pt-[28px] px-[24px] flex flex-col">
          <h3 className="text-base font-bold mb-6">Portfolio Value</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-[12px]">
              <HiOutlineCurrencyDollar className="text-white text-3xl" />
            </div>
            <p className="text-3xl font-bold text-center">${(stats?.totalValue || 0).toLocaleString()}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 text-center">Total asset value</p>
          </div>
        </div>
      </div>

      {/* Recent Products Table */}
      <div className="glass-card overflow-hidden mt-[28px]">
        <div className="p-6 border-b border-[var(--color-dark-border)] flex items-center justify-between">
          <h3 className="text-base font-bold">Upcoming Expirations</h3>
          <Link to="/products" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All <HiOutlineChevronRight />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
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
                <tr><td colSpan="4" className="text-center py-8 text-[var(--color-text-muted)]">No products yet. Add your first product!</td></tr>
              ) : (
                recentProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{p.brand}</p>
                      </div>
                    </td>
                    <td className="hide-mobile text-sm text-[var(--color-text-secondary)]">{p.category}</td>
                    <td className="text-sm">{p.warrantyExpiryDate ? format(new Date(p.warrantyExpiryDate), 'MMM dd, yyyy') : '—'}</td>
                    <td><span className={getBadge(p.warrantyStatus)}>{p.warrantyStatus}</span></td>
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
