import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] flex">
      <Toaster position="top-right" />

      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-cyan-500/10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30">
            <HiOutlineShieldCheck className="text-white text-4xl" />
          </div>
          <h2 className="text-4xl font-bold mb-4 gradient-text">WarrantyVault</h2>
          <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed">
            Track your product warranties, upload invoices, and never miss an expiry date again.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { num: '100%', label: 'Secure' },
              { num: '24/7', label: 'Tracking' },
              { num: 'Smart', label: 'Alerts' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4">
                <p className="text-xl font-bold text-indigo-400">{stat.num}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineShieldCheck className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold gradient-text">WarrantyVault</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-[var(--color-text-muted)] mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field !pl-11"
                  placeholder="you@example.com"
                  id="login-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field !pl-11 !pr-11"
                  placeholder="Enter your password"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50"
              id="login-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 glass-card p-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
              <p>Admin: <span className="text-indigo-400">admin@warranty.com</span> / admin123</p>
              <p>User: <span className="text-indigo-400">john@warranty.com</span> / user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
