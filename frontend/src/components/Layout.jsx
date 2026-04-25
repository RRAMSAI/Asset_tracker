import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="min-h-screen bg-[var(--color-dark)] relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`${sidebarOpen ? 'lg:ml-[260px]' : ''} min-h-screen flex flex-col transition-[margin] duration-300 ease-in-out`}>
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 lg:p-10 w-full flex flex-col items-center">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
