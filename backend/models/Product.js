const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Electronics',
        'Appliances',
        'Furniture',
        'Automobile',
        'Software',
        'Other',
      ],
      default: 'Other',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    warrantyPeriod: {
      type: Number, // in months
      required: [true, 'Warranty period is required'],
    },
    warrantyExpiryDate: {
      type: Date,
    },
    warrantyStatus: {
      type: String,
      enum: ['Active', 'Expiring Soon', 'Expired'],
      default: 'Active',
    },
    retailer: {
      type: String,
      trim: true,
      default: '',
    },
    invoiceFile: {
      type: String, // file path
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Calculate expiry date before saving
productSchema.pre('save', function (next) {
  if (this.purchaseDate && this.warrantyPeriod) {
    const expiry = new Date(this.purchaseDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyPeriod);
    this.warrantyExpiryDate = expiry;
  }
  // Auto-categorize warranty status
  this.warrantyStatus = this.getWarrantyStatus();
  next();
});

// Method to get warranty status
productSchema.methods.getWarrantyStatus = function () {
  const now = new Date();
  const expiry = this.warrantyExpiryDate;
  if (!expiry) return 'Expired';
  if (expiry < now) return 'Expired';
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expiry <= thirtyDaysFromNow) return 'Expiring Soon';
  return 'Active';
};

// Static method to update all warranty statuses
productSchema.statics.updateAllStatuses = async function () {
  const products = await this.find();
  for (const product of products) {
    const newStatus = product.getWarrantyStatus();
    if (product.warrantyStatus !== newStatus) {
      product.warrantyStatus = newStatus;
      await product.save();
    }
  }
};

module.exports = mongoose.model('Product', productSchema);
