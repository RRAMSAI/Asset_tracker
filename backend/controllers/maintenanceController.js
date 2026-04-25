const MaintenanceHistory = require('../models/MaintenanceHistory');
const Product = require('../models/Product');

// @desc    Add maintenance record
// @route   POST /api/maintenance
exports.addMaintenance = async (req, res) => {
  try {
    const { product: productId } = req.body;

    // Verify product exists and user owns it
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (req.user.role !== 'admin' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const record = await MaintenanceHistory.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all maintenance records
// @route   GET /api/maintenance
exports.getMaintenanceRecords = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const { productId } = req.query;
    if (productId) query.product = productId;

    const records = await MaintenanceHistory.find(query)
      .populate('product', 'name brand category')
      .sort({ serviceDate: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
exports.getMaintenanceRecord = async (req, res) => {
  try {
    const record = await MaintenanceHistory.findById(req.params.id)
      .populate('product', 'name brand category');

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (req.user.role !== 'admin' && record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete maintenance record
// @route   DELETE /api/maintenance/:id
exports.deleteMaintenance = async (req, res) => {
  try {
    const record = await MaintenanceHistory.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (req.user.role !== 'admin' && record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await MaintenanceHistory.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
