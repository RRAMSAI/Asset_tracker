const ServiceRequest = require('../models/ServiceRequest');
const Product = require('../models/Product');

// @desc    Create a service request
// @route   POST /api/service-requests
exports.createServiceRequest = async (req, res) => {
  try {
    const { productId, subject, description } = req.body;

    if (!productId || !subject || !description) {
      return res.status(400).json({ message: 'Product, subject, and description are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership
    if (product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Determine service type based on warranty status
    const now = new Date();
    const isUnderWarranty =
      product.warrantyExpiryDate && product.warrantyExpiryDate > now;
    const serviceType = isUnderWarranty ? 'Warranty Service' : 'Paid Service';

    const requestData = {
      product: productId,
      user: req.user._id,
      subject,
      description,
      serviceType,
    };

    // Handle optional image upload
    if (req.file) {
      requestData.attachmentFile = req.file.filename;
    }

    const serviceRequest = await ServiceRequest.create(requestData);

    const populated = await ServiceRequest.findById(serviceRequest._id)
      .populate('product', 'name brand category warrantyExpiryDate warrantyStatus')
      .populate('user', 'name email');

    res.status(201).json({ success: true, serviceRequest: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service requests (user sees own, admin sees all)
// @route   GET /api/service-requests
exports.getServiceRequests = async (req, res) => {
  try {
    const { status, serviceType } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    const requests = await ServiceRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('product', 'name brand category warrantyExpiryDate warrantyStatus')
      .populate('user', 'name email');

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single service request
// @route   GET /api/service-requests/:id
exports.getServiceRequest = async (req, res) => {
  try {
    const sr = await ServiceRequest.findById(req.params.id)
      .populate('product', 'name brand category warrantyExpiryDate warrantyStatus serialNumber')
      .populate('user', 'name email');

    if (!sr) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && sr.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service request status + admin notes (admin only)
// @route   PUT /api/service-requests/:id
exports.updateServiceRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};

    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate('product', 'name brand category warrantyExpiryDate warrantyStatus')
      .populate('user', 'name email');

    if (!sr) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service request
// @route   DELETE /api/service-requests/:id
exports.deleteServiceRequest = async (req, res) => {
  try {
    const sr = await ServiceRequest.findById(req.params.id);
    if (!sr) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Owner or admin can delete
    if (req.user.role !== 'admin' && sr.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ServiceRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
