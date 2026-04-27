const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env from the backend directory explicitly — resolves issues with CWD mismatch
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔑 ENV CHECK on startup:');
console.log('  PORT              =', process.env.PORT);
console.log('  MONGODB_URI set   =', !!process.env.MONGODB_URI);
console.log('  JWT_SECRET set    =', !!process.env.JWT_SECRET);
console.log('  RAZORPAY_KEY_ID   =', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 8) + '...' : '❌ NOT SET');
console.log('  RAZORPAY_SECRET   =', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.slice(0, 4) + '...' : '❌ NOT SET');

const connectDB = require('./config/db');
const { generateExpiryNotifications } = require('./controllers/notificationController');

const app = express();

// ── CORS — must be FIRST middleware so headers are always sent ──
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://asset-tracker-eosin.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check — ABOVE DB middleware so it always works
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint — shows what env vars Vercel actually has (no secrets exposed)
app.get('/api/debug', (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    node_env: process.env.NODE_ENV,
    mongodb_uri_set: !!process.env.MONGODB_URI,
    mongodb_uri_preview: process.env.MONGODB_URI ? process.env.MONGODB_URI.slice(0, 30) + '...' : 'NOT SET',
    jwt_secret_set: !!process.env.JWT_SECRET,
    client_url: process.env.CLIENT_URL || 'NOT SET',
  });
});

// ── Connect DB before each request (serverless-safe) ──
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/settings', require('./routes/settings'));

// Config check — verifies .env keys are loaded (never exposes full secrets)
app.get('/api/config-check', (req, res) => {
  const rzpKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const rzpSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const placeholders = ['your_razorpay_key_id', 'your_razorpay_key_secret', ''];

  res.json({
    mongodb_uri_set: !!process.env.MONGODB_URI,
    jwt_secret_set:  !!process.env.JWT_SECRET,
    razorpay_key_id: rzpKeyId
      ? (placeholders.includes(rzpKeyId)
          ? '⚠️ Still placeholder'
          : `✅ ${rzpKeyId.slice(0, 8)}...`)
      : '❌ NOT SET',
    razorpay_secret: rzpSecret
      ? (placeholders.includes(rzpSecret)
          ? '⚠️ Still placeholder'
          : `✅ set (${rzpSecret.length} chars)`)
      : '❌ NOT SET',
    razorpay_ready: !placeholders.includes(rzpKeyId) && !placeholders.includes(rzpSecret),
  });
});

// ── node-cron only works in persistent servers, NOT in Vercel serverless ──
// Run it only when NOT on Vercel
if (!process.env.VERCEL) {
  const cron = require('node-cron');
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running daily warranty expiry check...');
    generateExpiryNotifications();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max size is 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Something went wrong!' });
});

// ── Local dev: start HTTP server. Vercel: export the app ──
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  // Connect once at startup for local dev
  connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📂 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  });
}

// Required for Vercel serverless
module.exports = app;




 
