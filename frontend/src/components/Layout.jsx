import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLg, setIsLg] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-bg)', display: 'flex' }}>
      <Sidebar isOpen={isLg || sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar on desktop */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isLg ? 'var(--sidebar-width)' : 0,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main
          style={{
            flex: 1,
            padding: '28px 24px',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
