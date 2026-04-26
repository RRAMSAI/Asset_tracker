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

// @desc    Generate warranty expiry notifications and send emails
exports.generateExpiryNotifications = async () => {
  try {
    const now = new Date();
    
    // ── 1. Expiring Soon (3 days or less) ──
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const expiringSoon = await Product.find({
      user: { $ne: null },
      warrantyExpiryDate: { $gte: now, $lte: threeDaysFromNow },
      reminderEmailSent: false // Only products that haven't received the reminder
    }).populate('user', 'name email notificationsEnabled');

    for (const product of expiringSoon) {
      const daysLeft = Math.ceil((product.warrantyExpiryDate - now) / (1000 * 60 * 60 * 24));

      // Create in-app notification
      await Notification.create({
        user: product.user._id,
        product: product._id,
        type: 'expiry_warning',
        message: `Warranty for "${product.name}" expires in ${daysLeft} days (${product.warrantyExpiryDate.toLocaleDateString()})`,
      });

      // Send Email
      if (product.user.email && product.user.notificationsEnabled !== false) {
        const { sendEmail, warrantyExpiringSoonEmail } = require('../utils/emailService');
        const { subject, html } = warrantyExpiringSoonEmail({
          userName: product.user.name,
          productName: product.name,
          brand: product.brand,
          warrantyExpiryDate: product.warrantyExpiryDate,
          daysLeft,
        });
        await sendEmail({ to: product.user.email, subject, html });
      }

      // Mark as sent
      product.reminderEmailSent = true;
      await product.save({ validateBeforeSave: false }); // Skip validation just for flag update
    }

    // ── 2. Expired ──
    const justExpired = await Product.find({
      user: { $ne: null },
      warrantyExpiryDate: { $lt: now },
      expiryEmailSent: false // Only products that haven't received the expired email
    }).populate('user', 'name email notificationsEnabled');

    for (const product of justExpired) {
      // Create in-app notification
      await Notification.create({
        user: product.user._id,
        product: product._id,
        type: 'expired',
        message: `Warranty for "${product.name}" has expired.`,
      });

      // Send Email
      if (product.user.email && product.user.notificationsEnabled !== false) {
        const { sendEmail, warrantyExpiredEmail } = require('../utils/emailService');
        const { subject, html } = warrantyExpiredEmail({
          userName: product.user.name,
          productName: product.name,
          brand: product.brand,
          warrantyExpiryDate: product.warrantyExpiryDate,
        });
        await sendEmail({ to: product.user.email, subject, html });
      }

      // Mark as sent
      product.expiryEmailSent = true;
      await product.save({ validateBeforeSave: false });
    }

    console.log(`📧 Expiry cron job complete. Reminders sent: ${expiringSoon.length}, Expired sent: ${justExpired.length}`);
  } catch (error) {
    console.error('Notification generation error:', error.message);
  }
};
