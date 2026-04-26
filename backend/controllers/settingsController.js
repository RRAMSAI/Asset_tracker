const Settings = require('../models/Settings');

// GET /api/settings — anyone authenticated can read (needed by frontend to show pricing)
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getGlobal();
    res.json({
      success: true,
      settings: {
        extensionPrice:    settings.extensionPrice,
        extensionDuration: settings.extensionDuration,
      },
    });
  } catch (err) {
    console.error('❌ getSettings error:', err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings — admin only
exports.updateSettings = async (req, res) => {
  try {
    const { extensionPrice, extensionDuration } = req.body;

    const settings = await Settings.getGlobal();

    if (extensionPrice !== undefined) {
      settings.extensionPrice = Math.max(0, Number(extensionPrice) || 0);
    }
    if (extensionDuration !== undefined) {
      settings.extensionDuration = Math.max(1, Number(extensionDuration) || 6);
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Global settings updated successfully',
      settings: {
        extensionPrice:    settings.extensionPrice,
        extensionDuration: settings.extensionDuration,
      },
    });
  } catch (err) {
    console.error('❌ updateSettings error:', err);
    res.status(500).json({ message: err.message });
  }
};
