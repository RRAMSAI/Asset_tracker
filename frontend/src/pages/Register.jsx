import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await registerUser({ name: form.name, email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      toast.success('Account created!');
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <HiOutlineShieldCheck className="text-white text-xl" />
          </div>
          <h1 className="text-xl font-bold gradient-text">WarrantyVault</h1>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Create your account</h2>
        <p className="text-[var(--color-text-muted)] mb-8 text-center">Start your warranty tracking journey</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Full Name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field !pl-11" placeholder="John Doe" id="register-name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Email</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field !pl-11" placeholder="you@example.com" id="register-email" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field !pl-11 !pr-11" placeholder="Min. 6 characters" id="register-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Confirm Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field !pl-11" placeholder="Confirm your password" id="register-confirm" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50" id="register-submit-btn">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">Already have an account?{' '}<Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
