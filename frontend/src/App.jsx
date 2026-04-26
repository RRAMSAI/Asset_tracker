import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import ProductList from './pages/ProductList';
import Maintenance from './pages/Maintenance';
import ServiceRequests from './pages/ServiceRequests';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--surface-bg)',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface-overlay)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            boxShadow: 'var(--shadow-elevated)',
            padding: '10px 14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route path="/login"    element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/add-product"  element={<AddProduct />} />
          <Route path="/products"     element={<ProductList />} />
          <Route path="/maintenance"  element={<Maintenance />} />
          <Route path="/service-requests" element={<ServiceRequests />} />
          <Route path="/admin"        element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
