import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/',                icon: HiOutlineViewGrid,      label: 'Dashboard',        end: true },
  { path: '/products',       icon: HiOutlineCollection,    label: 'Products' },
  { path: '/add-product',    icon: HiOutlinePlusCircle,    label: 'Add Product' },
  { path: '/maintenance',    icon: HiOutlineClipboardList, label: 'Maintenance' },
  { path: '/service-requests', icon: HiOutlineClipboardCheck, label: 'Service Requests' },
];

const adminItems = [
  { path: '/admin', icon: HiOutlineUsers, label: 'Admin Panel' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 z-50 h-full flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--surface-base)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-brand)',
                  flexShrink: 0,
                }}
              >
                <HiOutlineShieldCheck style={{ color: '#fff', fontSize: 18 }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  WarrantyVault
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Asset Tracker</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-icon btn-ghost lg:hidden"
              aria-label="Close navigation"
            >
              <HiOutlineX style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 10px' }}>
          <p className="section-label" style={{ marginBottom: 8 }}>Navigation</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
              >
                <item.icon className="nav-icon" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {user?.role === 'admin' && (
            <>
              <p className="section-label" style={{ marginTop: 20, marginBottom: 8 }}>Admin</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-nav-item${isActive ? ' active' : ''}`
                    }
                  >
                    <item.icon className="nav-icon" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-full)',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
