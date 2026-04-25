const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats/dashboard', protect, getDashboardStats);
router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('invoiceFile'), createProduct);
router.route('/:id')
  .get(protect, getProduct)
  .put(protect, upload.single('invoiceFile'), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
