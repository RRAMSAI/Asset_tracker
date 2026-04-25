import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineX, HiOutlineCheckCircle } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { createProduct } from '../services/api';

const categories = ['Electronics', 'Appliances', 'Furniture', 'Automobile', 'Software', 'Other'];

const AddProduct = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState({
    name: '', brand: '', category: 'Electronics', model: '', serialNumber: '',
    purchaseDate: '', purchasePrice: '', warrantyPeriod: '', retailer: '', notes: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    if (e.target.files[0]) setFileName(e.target.files[0].name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.purchaseDate || !form.warrantyPeriod) {
      return toast.error('Please fill required fields');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => { if (form[key]) formData.append(key, form[key]); });
      if (fileRef.current?.files[0]) formData.append('invoiceFile', fileRef.current.files[0]);
      await createProduct(formData);
      toast.success('Product added successfully!');
      setTimeout(() => navigate('/products'), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-3xl animate-fade-in">
      <Toaster position="top-right" />
      <div className="mb-[24px]">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-[var(--color-text-muted)] text-base mt-2">Register a product and its warranty details</p>
      </div>
      <form onSubmit={handleSubmit} className="glass-card pt-[32px] px-[28px] pb-[24px]">
        {/* Product Info */}
        <div className="mb-[28px]">
          <h3 className="text-sm font-bold mb-[12px] text-indigo-400 uppercase tracking-wider">Product Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px] gap-y-[20px]">
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="MacBook Pro 16&quot;" id="product-name" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} className="input-field" placeholder="Apple" id="product-brand" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="select-field" id="product-category">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Model</label>
              <input name="model" value={form.model} onChange={handleChange} className="input-field" placeholder="M3 Max" id="product-model" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Serial Number</label>
              <input name="serialNumber" value={form.serialNumber} onChange={handleChange} className="input-field" placeholder="FVFC2XH1Q6" id="product-serial" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Retailer</label>
              <input name="retailer" value={form.retailer} onChange={handleChange} className="input-field" placeholder="Apple Store" id="product-retailer" />
            </div>
          </div>
        </div>

        {/* Warranty Info */}
        <div className="border-t border-[var(--color-dark-border)] pt-[28px] mb-[28px]">
          <h3 className="text-sm font-bold mb-[12px] text-indigo-400 uppercase tracking-wider">Warranty & Purchase</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[20px] gap-y-[20px]">
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Purchase Date *</label>
              <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className="input-field" id="product-purchase-date" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Warranty Period (months) *</label>
              <input type="number" name="warrantyPeriod" value={form.warrantyPeriod} onChange={handleChange} className="input-field" placeholder="12" id="product-warranty-period" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Purchase Price ($)</label>
              <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className="input-field" placeholder="999" id="product-price" />
            </div>
          </div>
        </div>

        {/* Invoice Upload */}
        <div className="border-t border-[var(--color-dark-border)] pt-[28px] mb-[20px]">
          <h3 className="text-sm font-bold mb-[12px] text-indigo-400 uppercase tracking-wider">Invoice Upload</h3>
          <div className="file-upload-zone py-[32px]" onClick={() => fileRef.current?.click()}>
            <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" id="invoice-file-input" />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <HiOutlineCheckCircle className="text-xl" />
                <span className="text-sm font-medium">{fileName}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFileName(''); fileRef.current.value = ''; }} className="ml-2 text-[var(--color-text-muted)] hover:text-red-400">
                  <HiOutlineX />
                </button>
              </div>
            ) : (
              <>
                <HiOutlineUpload className="text-3xl text-[var(--color-text-muted)] mx-auto mb-[12px]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Click to upload invoice</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">PDF, JPG, PNG up to 10MB</p>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-[20px]">
          <label className="block text-xs font-medium mb-[6px] text-[var(--color-text-secondary)]">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none p-[12px] min-h-[80px]" placeholder="Additional notes..." id="product-notes" />
        </div>

        {/* Submit */}
        <div className="flex gap-[12px] mt-[24px]">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-[48px] text-[15px] font-medium disabled:opacity-50" id="add-product-submit">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary px-8 h-[48px] text-[15px] font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
