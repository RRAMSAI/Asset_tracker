import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineTrash, HiOutlinePencil, HiOutlineDocumentDownload, HiOutlinePlusCircle } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { getProducts, deleteProduct } from '../services/api';
import { format } from 'date-fns';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editModal, setEditModal] = useState(null);

  useEffect(() => { fetchProducts(); }, [statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const res = await getProducts(params);
      setProducts(res.data.products || []);
    } catch (err) { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Delete failed'); }
  };

  const getBadge = (status) => {
    if (status === 'Active') return 'badge badge-active';
    if (status === 'Expiring Soon') return 'badge badge-expiring';
    return 'badge badge-expired';
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="spinner" /></div>;

  return (
    <div className="w-full max-w-6xl space-y-8 animate-fade-in">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-[var(--color-text-muted)] text-base mt-2">{products.length} product{products.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link to="/add-product" className="btn-primary" id="products-add-btn">
          <HiOutlinePlusCircle className="text-lg" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search products..." id="product-search" />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-auto min-w-[140px]" id="status-filter">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-field w-auto min-w-[140px]" id="category-filter">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Appliances">Appliances</option>
            <option value="Furniture">Furniture</option>
            <option value="Automobile">Automobile</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hide-mobile">Category</th>
                <th>Purchase Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="hide-mobile">Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-[var(--color-text-muted)]">
                  <p className="text-lg mb-2">No products found</p>
                  <Link to="/add-product" className="text-indigo-400 hover:text-indigo-300 text-sm">Add your first product →</Link>
                </td></tr>
              ) : products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{p.brand} {p.model && `· ${p.model}`}</p>
                    </div>
                  </td>
                  <td className="hide-mobile text-sm text-[var(--color-text-secondary)]">{p.category}</td>
                  <td className="text-sm">{format(new Date(p.purchaseDate), 'MMM dd, yyyy')}</td>
                  <td className="text-sm">{p.warrantyExpiryDate ? format(new Date(p.warrantyExpiryDate), 'MMM dd, yyyy') : '—'}</td>
                  <td><span className={getBadge(p.warrantyStatus)}>{p.warrantyStatus}</span></td>
                  <td className="hide-mobile text-sm">{p.purchasePrice ? `$${p.purchasePrice.toLocaleString()}` : '—'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {p.invoiceFile && (
                        <a href={`/uploads/${p.invoiceFile}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-dark-hover)] text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors" title="View Invoice">
                          <HiOutlineDocumentDownload className="text-base" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Delete">
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
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

export default ProductList;
