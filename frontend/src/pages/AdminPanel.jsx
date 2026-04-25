import { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineShieldCheck, HiOutlineCollection } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { getAllUsers, getProducts } from '../services/api';
import { format } from 'date-fns';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, pRes] = await Promise.all([getAllUsers(), getProducts()]);
        setUsers(uRes.data.users || []);
        setProducts(pRes.data.products || []);
      } catch { toast.error('Failed to load admin data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="spinner" /></div>;

  const stats = [
    { label: 'Total Users', value: users.length, icon: HiOutlineUsers, color: 'from-indigo-500 to-purple-600' },
    { label: 'Total Products', value: products.length, icon: HiOutlineCollection, color: 'from-emerald-500 to-teal-600' },
    { label: 'Admin Users', value: users.filter(u => u.role === 'admin').length, icon: HiOutlineShieldCheck, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Manage users and system overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="text-white text-lg" />
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-[var(--color-dark-border)]">
          <h3 className="text-sm font-semibold">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td className="font-medium text-sm">{u.name}</td>
                  <td className="text-sm text-[var(--color-text-secondary)]">{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-expiring' : 'badge-active'}`}>{u.role}</span></td>
                  <td className="text-sm">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
