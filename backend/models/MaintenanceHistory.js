const mongoose = require('mongoose');

const maintenanceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['Repair', 'Service', 'Replacement', 'Inspection', 'Other'],
      default: 'Service',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    serviceDate: {
      type: Date,
      required: [true, 'Service date is required'],
    },
    cost: {
      type: Number,
      default: 0,
    },
    serviceProvider: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceHistory', maintenanceHistorySchema);
