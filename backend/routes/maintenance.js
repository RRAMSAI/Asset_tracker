const express = require('express');
const router = express.Router();
const {
  addMaintenance,
  getMaintenanceRecords,
  getMaintenanceRecord,
  deleteMaintenance,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMaintenanceRecords)
  .post(protect, addMaintenance);
router.route('/:id')
  .get(protect, getMaintenanceRecord)
  .delete(protect, deleteMaintenance);

module.exports = router;
