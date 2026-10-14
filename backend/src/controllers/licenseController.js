const licenseService = require('../services/licenseService');

/**
 * Get current system license and trial status
 */
async function getStatus(req, res, next) {
  try {
    const status = await licenseService.getLicenseStatus();
    res.json({
      success: true,
      license: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system Machine / Hardware ID for offline activation
 */
async function getMachineId(req, res, next) {
  try {
    const machineId = licenseService.getMachineId();
    res.json({
      success: true,
      machineId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit offline license key to activate software
 */
async function activate(req, res, next) {
  try {
    const { licenseKey, clientName } = req.body;

    if (!licenseKey || typeof licenseKey !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'License key is required for offline activation',
      });
    }

    const updatedStatus = await licenseService.activateLicense(licenseKey, clientName);

    res.json({
      success: true,
      message: '🎉 ShopEase POS license successfully activated! All features are unlocked.',
      license: updatedStatus,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to activate license key',
    });
  }
}

module.exports = {
  getStatus,
  getMachineId,
  activate,
};
