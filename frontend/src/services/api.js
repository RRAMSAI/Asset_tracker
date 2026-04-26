import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const loginUser           = (data) => API.post('/auth/login', data);
export const registerUser        = (data) => API.post('/auth/register', data);
export const getMe               = ()     => API.get('/auth/me');
export const getAllUsers         = ()     => API.get('/auth/users');
export const toggleNotifications = ()     => API.put('/auth/notifications/toggle');

// ── Products ──
export const getProducts       = (params) => API.get('/products', { params });
export const getProduct        = (id)     => API.get(`/products/${id}`);
export const createProduct     = (data)   => API.post('/products', data);
export const updateProduct     = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct     = (id)     => API.delete(`/products/${id}`);
export const getDashboardStats = ()       => API.get('/products/stats/dashboard');

// ── Maintenance ──
export const getMaintenanceRecords  = (params) => API.get('/maintenance', { params });
export const addMaintenanceRecord   = (data)   => API.post('/maintenance', data);
export const deleteMaintenanceRecord = (id)    => API.delete(`/maintenance/${id}`);

// ── Notifications ──
export const getNotifications        = ()     => API.get('/notifications');
export const markNotificationRead    = (id)   => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = ()    => API.put('/notifications/read-all');

// ── Payments (Razorpay warranty extension) ──
export const createPaymentOrder  = (data) => API.post('/payments/create-order', data);
export const verifyPayment       = (data) => API.post('/payments/verify', data);
export const reportPaymentFailure = (data) => API.post('/payments/failure', data);
export const getExtensionHistory = (productId) => API.get(`/payments/history/${productId}`);
export const getAllExtensions    = ()     => API.get('/payments/all');
export const adminExtend         = (data) => API.post('/payments/admin-extend', data); // admin only

// ── Service Requests ──
export const getServiceRequests    = (params)   => API.get('/service-requests', { params });
export const getServiceRequest     = (id)       => API.get(`/service-requests/${id}`);
export const createServiceRequest  = (data)     => API.post('/service-requests', data);
export const updateServiceRequest  = (id, data) => API.put(`/service-requests/${id}`, data);
export const deleteServiceRequest  = (id)       => API.delete(`/service-requests/${id}`);

// ── Global Settings ──
export const getSettings    = ()     => API.get('/settings');
export const updateSettings = (data) => API.put('/settings', data);

// ── Currency helper (Indian Rupees) ──
// Usage: formatINR(160000) → "₹1,60,000"
export const formatINR = (amount) => {
  if (amount == null || amount === '') return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export default API;
