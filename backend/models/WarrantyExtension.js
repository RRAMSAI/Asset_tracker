const mongoose = require('mongoose');

const warrantyExtensionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Duration of extension in months
    extensionMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    // Price paid for extension (in INR paise stored, display in rupees)
    amountPaid: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Old and new expiry for audit trail
    previousExpiryDate: {
      type: Date,
      required: true,
    },
    newExpiryDate: {
      type: Date,
      required: true,
    },
    // Razorpay payment details
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WarrantyExtension', warrantyExtensionSchema);
