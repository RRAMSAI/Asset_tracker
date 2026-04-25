const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// @desc    Create product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      user: req.user._id,
    };

    if (req.file) {
      productData.invoiceFile = req.file.filename;
    }

    const product = await Product.create(productData);

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products for user
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { status, category, search, sort } = req.query;
    const query = {};

    // Admin sees all, user sees own
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    if (status) query.warrantyStatus = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'expiry') sortOption = { warrantyExpiryDate: 1 };
    if (sort === 'purchase') sortOption = { purchaseDate: -1 };

    // Update statuses before fetching
    const products = await Product.find(query)
      .sort(sortOption)
      .populate('user', 'name email');

    // Update statuses on the fly
    const updatedProducts = products.map((p) => {
      const doc = p.toObject();
      const now = new Date();
      const expiry = doc.warrantyExpiryDate;
      if (!expiry || expiry < now) {
        doc.warrantyStatus = 'Expired';
      } else {
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        doc.warrantyStatus = expiry <= thirtyDays ? 'Expiring Soon' : 'Active';
      }
      return doc;
    });

    res.json({ success: true, count: updatedProducts.length, products: updatedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('user', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old file if exists
      if (product.invoiceFile) {
        const oldPath = path.join(__dirname, '..', 'uploads', product.invoiceFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.invoiceFile = req.file.filename;
    }

    // Recalculate expiry if dates changed
    if (updateData.purchaseDate || updateData.warrantyPeriod) {
      const purchaseDate = new Date(updateData.purchaseDate || product.purchaseDate);
      const warrantyPeriod = parseInt(updateData.warrantyPeriod || product.warrantyPeriod);
      const expiry = new Date(purchaseDate);
      expiry.setMonth(expiry.getMonth() + warrantyPeriod);
      updateData.warrantyExpiryDate = expiry;

      // Update status
      const now = new Date();
      if (expiry < now) {
        updateData.warrantyStatus = 'Expired';
      } else {
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        updateData.warrantyStatus = expiry <= thirtyDays ? 'Expiring Soon' : 'Active';
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete invoice file
    if (product.invoiceFile) {
      const filePath = path.join(__dirname, '..', 'uploads', product.invoiceFile);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/products/stats/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const products = await Product.find(query);

    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    let active = 0,
      expiringSoon = 0,
      expired = 0,
      totalValue = 0;

    products.forEach((p) => {
      totalValue += p.purchasePrice || 0;
      const expiry = p.warrantyExpiryDate;
      if (!expiry || expiry < now) {
        expired++;
      } else if (expiry <= thirtyDays) {
        expiringSoon++;
      } else {
        active++;
      }
    });

    // Category breakdown
    const categories = {};
    products.forEach((p) => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total: products.length,
        active,
        expiringSoon,
        expired,
        totalValue,
        categories,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
