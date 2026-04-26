import { useState, useRef, useEffect } from 'react';
import { HiOutlineMenu, HiOutlineBell, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { toggleNotifications } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout, loadUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        height: 'var(--navbar-height)',
        background: 'rgba(14, 15, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: 12,
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onMenuToggle}
          className="btn btn-icon btn-ghost lg:hidden"
          aria-label="Toggle navigation"
          id="sidebar-toggle"
        >
          <HiOutlineMenu style={{ fontSize: 20, color: 'var(--text-secondary)' }} />
        </button>

        {/* Breadcrumb-style page title placeholder */}
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            display: 'none',
          }}
          className="sm:block"
        >
          {/* dynamic page label could go here */}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* User info (desktop only) */}
        <div
          className="hide-mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginRight: 4,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user?.name || 'User'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {user?.role === 'admin' ? 'Administrator' : 'Member'}
          </span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-primary)',
              border: '2px solid var(--surface-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            id="user-menu-btn"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 200,
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-elevated)',
                overflow: 'hidden',
                zIndex: 50,
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {user?.email}
                </p>
              </div>

              {/* Settings */}
              <div style={{ padding: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={async () => {
                    try {
                      const res = await toggleNotifications();
                      toast.success(res.data.message);
                      loadUser(); // Refresh user state
                    } catch (err) {
                      toast.error('Failed to toggle notifications');
                    }
                  }}
                  role="menuitem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiOutlineBell style={{ fontSize: 16, color: 'var(--text-secondary)' }} />
                    Email Alerts
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 16,
                      borderRadius: 'var(--radius-full)',
                      background: user?.notificationsEnabled !== false ? 'var(--status-success)' : 'var(--surface-base)',
                      border: '1px solid var(--border-default)',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 1,
                        left: user?.notificationsEnabled !== false ? 13 : 2,
                        transition: 'left 0.2s',
                      }}
                    />
                  </div>
                </button>
              </div>

              {/* Logout */}
              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  role="menuitem"
                  id="logout-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-danger)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--status-danger-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <HiOutlineLogout style={{ fontSize: 16 }} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
