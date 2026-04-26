import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { createProduct } from '../services/api';

const CATEGORIES = ['Electronics', 'Appliances', 'Furniture', 'Automobile', 'Software', 'Other'];

const FormSection = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {title}
    </p>
    {children}
  </div>
);

const AddProduct = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: 'Electronics',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    warrantyPeriod: '',
    retailer: '',
    notes: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    if (e.target.files[0]) setFileName(e.target.files[0].name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.purchaseDate || !form.warrantyPeriod) {
      return toast.error('Name, purchase date and warranty period are required');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => { if (form[key]) formData.append(key, form[key]); });
      if (fileRef.current?.files[0]) formData.append('invoiceFile', fileRef.current.files[0]);
      await createProduct(formData);
      toast.success('Product added successfully!');
      setTimeout(() => navigate('/products'), 700);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: 720 }}>
      <Toaster position="top-right" />

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Add Product</h1>
          <p className="page-subtitle">Register a new product and its warranty information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '24px 24px 20px' }}>
          {/* Product Information */}
          <FormSection title="Product Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
              <div className="form-group">
                <label htmlFor="product-name" className="form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  id="product-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input"
                  placeholder='e.g. MacBook Pro 16"'
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-brand" className="form-label">Brand</label>
                <input
                  id="product-brand"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. Apple"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-category" className="form-label">Category</label>
                <select
                  id="product-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="select"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product-model" className="form-label">Model</label>
                <input
                  id="product-model"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. M3 Max"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-serial" className="form-label">Serial Number</label>
                <input
                  id="product-serial"
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleChange}
                  className="input mono"
                  placeholder="e.g. FVFC2XH1Q6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-retailer" className="form-label">Retailer</label>
                <input
                  id="product-retailer"
                  name="retailer"
                  value={form.retailer}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. Apple Store"
                />
              </div>
            </div>
          </FormSection>

          {/* Warranty & Purchase */}
          <FormSection title="Warranty & Purchase">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 16px' }}>
              <div className="form-group">
                <label htmlFor="product-purchase-date" className="form-label">
                  Purchase Date <span className="required">*</span>
                </label>
                <input
                  id="product-purchase-date"
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-warranty-period" className="form-label">
                  Warranty (months) <span className="required">*</span>
                </label>
                <input
                  id="product-warranty-period"
                  type="number"
                  name="warrantyPeriod"
                  value={form.warrantyPeriod}
                  onChange={handleChange}
                  className="input"
                  placeholder="12"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-price" className="form-label">Purchase Price (₹)</label>
                <input
                  id="product-price"
                  type="number"
                  name="purchasePrice"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  className="input"
                  placeholder="999"
                  min="0"
                />
              </div>
            </div>
          </FormSection>

          {/* Invoice Upload */}
          <FormSection title="Invoice Upload">
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              aria-label="Upload invoice file"
            >
              <input
                type="file"
                ref={fileRef}
                onChange={handleFile}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                id="invoice-file-input"
                style={{ display: 'none' }}
              />

              {fileName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <HiOutlineCheckCircle style={{ fontSize: 22, color: 'var(--status-success)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fileName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName('');
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label="Remove file"
                  >
                    <HiOutlineX style={{ fontSize: 16 }} />
                  </button>
                </div>
              ) : (
                <>
                  <HiOutlineUpload style={{ fontSize: 26, color: 'var(--text-muted)', display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Click to upload invoice or receipt
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, JPG, PNG — up to 10 MB</p>
                </>
              )}
            </div>
          </FormSection>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label htmlFor="product-notes" className="form-label">Additional Notes</label>
            <textarea
              id="product-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input"
              placeholder="Any additional information about this product..."
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              id="add-product-submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
            >
              {loading
                ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : 'Add Product'
              }
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-secondary btn-lg"
              style={{ minWidth: 100 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
