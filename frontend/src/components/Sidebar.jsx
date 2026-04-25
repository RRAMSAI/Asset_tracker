import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineUsers,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/add-product', icon: HiOutlinePlusCircle, label: 'Add Product' },
  { path: '/products', icon: HiOutlineCollection, label: 'Products' },
  { path: '/maintenance', icon: HiOutlineClipboardList, label: 'Maintenance' },
];

const adminItems = [
  { path: '/admin', icon: HiOutlineUsers, label: 'Admin Panel' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col
          bg-[var(--color-dark-card)] border-r border-[var(--color-dark-border)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineShieldCheck className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">WarrantyVault</h1>
              <p className="text-[11px] text-[var(--color-text-muted)]">Asset Tracker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] px-4 mb-3">
            Menu
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="text-lg" />
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] px-4 mt-6 mb-3">
                Admin
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="text-lg" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-[var(--color-dark-border)] mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
