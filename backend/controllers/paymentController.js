const Razorpay = require('razorpay');
const crypto = require('crypto');
const Product = require('../models/Product');
const WarrantyExtension = require('../models/WarrantyExtension');

// ── Razorpay factory ──────────────────────────────────────────────────────────
// Fresh instance on every call — reads current process.env (no stale singleton).
function getRazorpay() {
  const keyId     = (process.env.RAZORPAY_KEY_ID     || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  const BAD = ['', 'your_razorpay_key_id', 'your_razorpay_key_secret', 'YOUR_KEY_ID', 'YOUR_KEY_SECRET'];

  if (BAD.includes(keyId) || BAD.includes(keySecret)) {
    console.warn('⚠️  Razorpay keys missing/placeholder — payment gateway disabled.');
    return null;
  }

  console.log(`🔑 Razorpay ready (key: ${keyId.slice(0, 8)}...)`);
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── Receipt helper ────────────────────────────────────────────────────────────
// Razorpay HARD LIMIT: receipt must be ≤ 40 characters.
// Old code: "wext_<24-char-ObjectId>_<13-digit-timestamp>" = 43 chars → REJECTED.
// New code: "wx_<last-8-hex>_<last-9-digits>" = 22 chars → safe.
function makeReceipt(productId) {
  const pid = productId.toString().slice(-8);     // 8 chars
  const ts  = String(Date.now()).slice(-9);        // 9 chars
  return `wx_${pid}_${ts}`;                       // 22 chars total — well within 40
}

// ── POST /api/payments/create-order ──────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    // 1. Gateway configured?
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        message: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env and restart the server.',
      });
    }

    // 2. Validate body
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    // 3. Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 4. Ownership (admin bypasses)
    if (
      req.user.role !== 'admin' &&
      product.user &&
      product.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorised to extend this product' });
    }

    // 5. Extension must be enabled — per-product price overrides global
    const Settings = require('../models/Settings');
    const globalSettings = await Settings.getGlobal();

    // Priority: product-level price > global price
    let extensionPrice    = Number(product.extensionPrice)    || 0;
    let extensionDuration = Number(product.extensionDuration) || 0;

    // Fall back to global settings if product doesn't have its own price
    if (extensionPrice <= 0) {
      extensionPrice = Number(globalSettings.extensionPrice) || 0;
    }
    if (extensionDuration <= 0) {
      extensionDuration = Number(globalSettings.extensionDuration) || 6;
    }

    if (extensionPrice <= 0) {
      return res.status(400).json({
        message: 'Warranty extension pricing has not been configured. Please contact the admin.',
      });
    }

    // 6. Amount in paise — minimum ₹1 (100 paise)
    const amountInPaise = Math.round(extensionPrice * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({
        message: `Extension price ₹${extensionPrice} is below the minimum ₹1.`,
      });
    }

    // 7. Create Razorpay order
    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount:   amountInPaise,
        currency: 'INR',
        receipt:  makeReceipt(product._id),   // ← FIXED: always ≤ 40 chars
        notes: {
          productId:       product._id.toString(),
          userId:          req.user._id.toString(),
          extensionMonths: String(extensionDuration),
        },
      });
    } catch (rzpErr) {
      // Surface the actual Razorpay error in the terminal
      console.error('❌ Razorpay orders.create() failed:', JSON.stringify(rzpErr, null, 2));
      const status = rzpErr.statusCode || 0;
      if (status === 401) {
        return res.status(503).json({ message: 'Razorpay authentication failed — check API keys in .env.' });
      }
      const detail = rzpErr.error?.description || rzpErr.message || 'Unknown Razorpay error';
      return res.status(status === 400 ? 400 : 500).json({ message: `Payment gateway error: ${detail}` });
    }

    // 8. Projected new expiry
    const currentExpiry = product.warrantyExpiryDate || new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + extensionDuration);

    // 9. Persist pending extension record
    await WarrantyExtension.create({
      product:            product._id,
      user:               req.user._id,
      extensionMonths:    extensionDuration,
      amountPaid:         extensionPrice,
      previousExpiryDate: product.warrantyExpiryDate || new Date(),
      newExpiryDate:      newExpiry,
      razorpayOrderId:    rzpOrder.id,
      paymentStatus:      'created',
    });

    // 10. Return checkout payload
    return res.json({
      success: true,
      order: {
        id:       rzpOrder.id,
        amount:   rzpOrder.amount,
        currency: rzpOrder.currency,
      },
      product: {
        name:            product.name,
        brand:           product.brand,
        currentExpiry:   product.warrantyExpiryDate,
        extensionMonths: extensionDuration,
        extensionPrice,
        newExpiry,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID.trim(),
    });
  } catch (err) {
    console.error('❌ createOrder unexpected error:', err);
    res.status(500).json({ message: err.message || 'Failed to create payment order' });
  }
};

// ── POST /api/payments/verify ─────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keySecret || keySecret === 'your_razorpay_key_secret') {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    // HMAC-SHA256 signature verification
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      await WarrantyExtension.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    const extension = await WarrantyExtension.findOne({ razorpayOrderId: razorpay_order_id });
    if (!extension) {
      return res.status(404).json({ message: 'Extension record not found' });
    }

    // Idempotency guard
    if (extension.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Payment already processed', extension });
    }

    extension.razorpayPaymentId = razorpay_payment_id;
    extension.razorpaySignature = razorpay_signature;
    extension.paymentStatus     = 'paid';
    await extension.save();

    // Extend warranty
    const product = await Product.findById(extension.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found during warranty extension' });
    }

    const currentExpiry = product.warrantyExpiryDate || new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + extension.extensionMonths);

    const updatedPeriod = (product.warrantyPeriod || 0) + extension.extensionMonths;
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const newStatus = newExpiry < now ? 'Expired' : newExpiry <= thirtyDays ? 'Expiring Soon' : 'Active';

    // findByIdAndUpdate skips pre-save hook (which would overwrite expiry from purchaseDate)
    await Product.findByIdAndUpdate(product._id, {
      warrantyExpiryDate: newExpiry,
      warrantyPeriod:     updatedPeriod,
      warrantyStatus:     newStatus,
      // Reset email flags so user gets new reminders when this extended warranty expires
      reminderEmailSent:  false,
      expiryEmailSent:    false,
      $inc: { extensionCount: 1 }
    });

    extension.newExpiryDate = newExpiry;
    await extension.save();

    // Send "Warranty Extended" email (async, non-blocking)
    try {
      const User = require('../models/User');
      const { sendEmail, warrantyExtendedEmail } = require('../utils/emailService');
      const user = await User.findById(product.user);
      if (user?.email) {
        const { subject, html } = warrantyExtendedEmail({
          userName: user.name,
          productName: product.name,
          brand: product.brand,
          extensionMonths: extension.extensionMonths,
          previousExpiryDate: currentExpiry,
          newExpiryDate: newExpiry,
          amountPaid: extension.amountPaid,
        });
        sendEmail({ to: user.email, subject, html }); // fire-and-forget
      }
    } catch (emailErr) {
      console.error('📧 Warranty extended email error (non-fatal):', emailErr.message);
    }

    return res.json({
      success:      true,
      message:      'Payment verified. Warranty extended successfully!',
      extension,
      newExpiryDate: newExpiry,
    });
  } catch (err) {
    console.error('❌ verifyPayment error:', err);
    res.status(500).json({ message: err.message || 'Payment verification failed' });
  }
};

// ── POST /api/payments/failure ────────────────────────────────────────────────
exports.handleFailure = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (razorpay_order_id) {
      await WarrantyExtension.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );
    }
    res.json({ success: true, message: 'Payment failure recorded' });
  } catch (err) {
    console.error('❌ handleFailure error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/payments/history/:productId ─────────────────────────────────────
exports.getExtensionHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const query = { paymentStatus: 'paid' };
    if (productId && productId !== 'all') query.product = productId;
    if (req.user.role !== 'admin') query.user = req.user._id;

    const extensions = await WarrantyExtension.find(query)
      .sort({ createdAt: -1 })
      .populate('product', 'name brand category')
      .populate('user',    'name email');

    res.json({ success: true, extensions });
  } catch (err) {
    console.error('❌ getExtensionHistory error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/payments/all (admin) ─────────────────────────────────────────────
exports.getAllExtensions = async (req, res) => {
  try {
    const extensions = await WarrantyExtension.find()
      .sort({ createdAt: -1 })
      .populate('product', 'name brand category')
      .populate('user',    'name email');

    res.json({ success: true, extensions });
  } catch (err) {
    console.error('❌ getAllExtensions error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/payments/admin-extend ───────────────────────────────────────────
// Admin can extend any product's warranty for free (no payment required).
exports.adminExtend = async (req, res) => {
  try {
    const { productId, extensionMonths } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const months = Math.max(1, Number(extensionMonths) || 6);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const currentExpiry = product.warrantyExpiryDate || new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const updatedPeriod = (product.warrantyPeriod || 0) + months;
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const newStatus = newExpiry < now ? 'Expired' : newExpiry <= thirtyDays ? 'Expiring Soon' : 'Active';

    await Product.findByIdAndUpdate(product._id, {
      warrantyExpiryDate: newExpiry,
      warrantyPeriod:     updatedPeriod,
      warrantyStatus:     newStatus,
      // Reset email flags so user gets new reminders when this extended warranty expires
      reminderEmailSent:  false,
      expiryEmailSent:    false,
      $inc: { extensionCount: 1 }
    });

    // Send "Warranty Extended" email (async, non-blocking)
    try {
      const User = require('../models/User');
      const { sendEmail, warrantyExtendedEmail } = require('../utils/emailService');
      const user = await User.findById(product.user);
      if (user?.email) {
        const { subject, html } = warrantyExtendedEmail({
          userName: user.name,
          productName: product.name,
          brand: product.brand,
          extensionMonths: months,
          previousExpiryDate: currentExpiry,
          newExpiryDate: newExpiry,
          amountPaid: 0,
        });
        sendEmail({ to: user.email, subject, html }); // fire-and-forget
      }
    } catch (emailErr) {
      console.error('📧 Admin extended email error (non-fatal):', emailErr.message);
    }

    // Record audit trail with a dummy order ID
    await WarrantyExtension.create({
      product:            product._id,
      user:               req.user._id,
      extensionMonths:    months,
      amountPaid:         0,
      previousExpiryDate: product.warrantyExpiryDate || new Date(),
      newExpiryDate:      newExpiry,
      razorpayOrderId:    `admin_${product._id.toString().slice(-8)}_${Date.now()}`,
      paymentStatus:      'paid',
    });

    return res.json({
      success:      true,
      message:      `Warranty extended by ${months} months. New expiry: ${newExpiry.toDateString()}`,
      newExpiryDate: newExpiry,
    });
  } catch (err) {
    console.error('❌ adminExtend error:', err);
    res.status(500).json({ message: err.message || 'Admin extend failed' });
  }
};
