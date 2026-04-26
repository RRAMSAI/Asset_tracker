import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
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
      setTimeout(() => navigate('/'), 400);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-bg)',
        display: 'flex',
      }}
    >
      <Toaster position="top-right" />

      {/* Left panel — branding */}
      <div
        className="hide-mobile"
        style={{
          width: '44%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 56px',
          background: 'var(--surface-base)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background accent */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,110,247,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-brand)',
              }}
            >
              <HiOutlineShieldCheck style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              WarrantyVault
            </span>
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            Track every warranty.
            <br />
            <span style={{ color: 'var(--brand-primary)' }}>Never miss a deadline.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
            A professional asset tracking system for managing product warranties, invoices, and maintenance history — all in one place.
          </p>

          {/* Feature bullets */}
          {[
            'Automatic warranty expiry tracking',
            'Invoice & document storage',
            'Maintenance history logs',
            'Role-based access control',
          ].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--brand-primary-muted)',
                  border: '1px solid var(--brand-primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#4f6ef7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo */}
          <div
            className="sm:hidden"
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HiOutlineShieldCheck style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>WarrantyVault</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            Enter your credentials to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <div className="input-wrapper">
                <HiOutlineMail className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="input input-icon-left"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input input-icon-left input-icon-right"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-end"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 4, width: '100%' }}
            >
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: 28,
              padding: '14px 16px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Demo Credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Admin: <span className="mono" style={{ color: 'var(--brand-primary)' }}>admin@warranty.com</span> · admin123
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                User: <span className="mono" style={{ color: 'var(--brand-primary)' }}>john@warranty.com</span> · user123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
