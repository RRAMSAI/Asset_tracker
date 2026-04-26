const Notification = require('../models/Notification');
const Product = require('../models/Product');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('product', 'name brand warrantyExpiryDate')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate warranty expiry notifications
exports.generateExpiryNotifications = async () => {
  try {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    // Find expiring soon products (only those that have a user assigned)
    const expiringSoon = await Product.find({
      user: { $ne: null },
      warrantyExpiryDate: { $gte: now, $lte: thirtyDays },
    });

    for (const product of expiringSoon) {
      // Check if notification already exists for this product today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotif = await Notification.findOne({
        product: product._id,
        type: 'expiry_warning',
        createdAt: { $gte: today },
      });

      if (!existingNotif) {
        const daysLeft = Math.ceil(
          (product.warrantyExpiryDate - now) / (1000 * 60 * 60 * 24)
        );

        await Notification.create({
          user: product.user,
          product: product._id,
          type: 'expiry_warning',
          message: `Warranty for "${product.name}" expires in ${daysLeft} days (${product.warrantyExpiryDate.toLocaleDateString()})`,
        });
      }
    }

    // Find newly expired products (only those that have a user assigned)
    const justExpired = await Product.find({
      user: { $ne: null },
      warrantyExpiryDate: {
        $lt: now,
        $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    });

    for (const product of justExpired) {
      const existingNotif = await Notification.findOne({
        product: product._id,
        type: 'expired',
      });

      if (!existingNotif) {
        await Notification.create({
          user: product.user,
          product: product._id,
          type: 'expired',
          message: `Warranty for "${product.name}" has expired.`,
        });
      }
    }

    console.log('📧 Expiry notifications generated');
  } catch (error) {
    console.error('Notification generation error:', error.message);
  }
};
