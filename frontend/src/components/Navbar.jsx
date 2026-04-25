import { HiOutlineMenu, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-[52px] py-[14px] px-[24px] bg-[var(--color-dark-card)]/80 backdrop-blur-xl border-b border-[var(--color-dark-border)] flex items-center justify-between">
      {/* Left: menu + search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-dark-border)] transition-colors"
        >
          <HiOutlineMenu className="text-xl text-[var(--color-text-secondary)]" />
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-[var(--color-dark)] rounded-xl px-4 py-[10px] border border-[var(--color-dark-border)] w-48 ml-[20px]">
          <HiOutlineSearch className="text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search products..."
            className="bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
            id="global-search-input"
          />
        </div>
      </div>

      {/* Right: user */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold leading-none mb-1">{user?.name || 'Admin User'}</p>
          <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
        </div>
        
        <div className="relative group">
          <button className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold border-2 border-[var(--color-dark-card)] shadow-md transition-transform group-hover:scale-105">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
            <div className="px-4 py-2 border-b border-[var(--color-dark-border)] sm:hidden">
              <p className="text-sm font-bold">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
