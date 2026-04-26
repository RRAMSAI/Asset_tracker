const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleFailure,
  getExtensionHistory,
  getAllExtensions,
  adminExtend,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/create-order',   protect, createOrder);
router.post('/verify',         protect, verifyPayment);
router.post('/failure',        protect, handleFailure);
router.post('/admin-extend',   protect, adminOnly, adminExtend);   // ← new
router.get('/all',             protect, adminOnly, getAllExtensions);
router.get('/history/:productId', protect, getExtensionHistory);

module.exports = router;
