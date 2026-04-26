const express = require('express');
const router = express.Router();
const {
  createServiceRequest,
  getServiceRequests,
  getServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
} = require('../controllers/serviceRequestController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(protect, getServiceRequests)
  .post(protect, upload.single('attachmentFile'), createServiceRequest);

router
  .route('/:id')
  .get(protect, getServiceRequest)
  .put(protect, adminOnly, updateServiceRequest)
  .delete(protect, deleteServiceRequest);

module.exports = router;
