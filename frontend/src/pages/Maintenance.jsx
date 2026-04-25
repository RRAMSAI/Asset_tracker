import { useState, useEffect } from 'react';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineClipboardList } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { getMaintenanceRecords, addMaintenanceRecord, deleteMaintenanceRecord, getProducts } from '../services/api';
import { format } from 'date-fns';

const types = ['Repair', 'Service', 'Replacement', 'Inspection', 'Other'];

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ product: '', type: 'Service', description: '', serviceDate: '', cost: '', serviceProvider: '', notes: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [recRes, prodRes] = await Promise.all([getMaintenanceRecords(), getProducts()]);
      setRecords(recRes.data.records || []);
      setProducts(prodRes.data.products || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.description || !form.serviceDate) return toast.error('Fill required fields');
    setFormLoading(true);
    try {
      await addMaintenanceRecord(form);
      toast.success('Record added!');
      setShowForm(false);
      setForm({ product: '', type: 'Service', description: '', serviceDate: '', cost: '', serviceProvider: '', notes: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await deleteMaintenanceRecord(id); setRecords(records.filter(r => r._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const typeBadge = (type) => {
    const colors = { Repair: 'text-red-400 bg-red-400/10', Service: 'text-blue-400 bg-blue-400/10', Replacement: 'text-purple-400 bg-purple-400/10', Inspection: 'text-cyan-400 bg-cyan-400/10', Other: 'text-gray-400 bg-gray-400/10' };
    return `badge ${colors[type] || colors.Other} border-transparent`;
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="spinner" /></div>;

  return (
    <div className="w-full max-w-6xl space-y-8 animate-fade-in">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance History</h1>
          <p className="text-[var(--color-text-muted)] text-base mt-2">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" id="add-maintenance-btn">
          <HiOutlinePlusCircle className="text-lg" /> Add Record
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-card p-8 animate-slide-up">
          <h3 className="text-base font-bold mb-6 text-indigo-400">New Maintenance Record</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Product *</label>
                <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="select-field" id="maint-product">
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.brand})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-field" id="maint-type">
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Service Date *</label>
                <input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} className="input-field" id="maint-date" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Cost ($)</label>
                <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input-field" placeholder="0" id="maint-cost" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Service Provider</label>
                <input value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} className="input-field" placeholder="Repair shop name" id="maint-provider" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--color-text-secondary)]">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" placeholder="What was done?" id="maint-desc" />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={formLoading} className="btn-primary disabled:opacity-50" id="maint-submit">
                {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Record'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Description</th>
                <th className="hide-mobile">Service Date</th>
                <th className="hide-mobile">Cost</th>
                <th className="hide-mobile">Provider</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-[var(--color-text-muted)]">
                  <HiOutlineClipboardList className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>No maintenance records yet</p>
                </td></tr>
              ) : records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <p className="font-medium text-sm">{r.product?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.product?.brand}</p>
                  </td>
                  <td><span className={typeBadge(r.type)}>{r.type}</span></td>
                  <td className="text-sm max-w-[200px] truncate">{r.description}</td>
                  <td className="hide-mobile text-sm">{format(new Date(r.serviceDate), 'MMM dd, yyyy')}</td>
                  <td className="hide-mobile text-sm">{r.cost ? `$${r.cost}` : '—'}</td>
                  <td className="hide-mobile text-sm text-[var(--color-text-secondary)]">{r.serviceProvider || '—'}</td>
                  <td>
                    <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors">
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
