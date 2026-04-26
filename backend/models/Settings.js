const mongoose = require('mongoose');

// Singleton settings document — only one ever exists (key: 'global')
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },

    // ── Global warranty extension defaults ──
    extensionPrice: {
      type: Number,
      default: 0, // INR — 0 means "not configured yet"
    },
    extensionDuration: {
      type: Number,
      default: 6, // months
    },

    // Future-proof: add more global settings here
  },
  { timestamps: true }
);

// Always return the one global doc, creating it if it doesn't exist
settingsSchema.statics.getGlobal = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
