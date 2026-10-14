const licenseService = require('../services/licenseService');

/**
 * Middleware that verifies if the POS software has an active trial or valid license.
 * Blocks access to business endpoints if trial has expired or if system clock tampering is detected.
 */
async function licenseGuard(req, res, next) {
  // Allow healthcheck, license activation endpoints, and essential auth routes
  const path = req.path || '';
  if (
    path.startsWith('/api/health') ||
    path.startsWith('/api/license') ||
    path === '/api/auth/login' ||
    path === '/api/auth/setup-status' ||
    path === '/api/auth/setup-initial-owner' ||
    path === '/api/auth/me' ||
    path === '/api/settings/public'
  ) {
    return next();
  }

  try {
    const status = await licenseService.getLicenseStatus();

    if (status.isExpired) {
      const message =
        status.status === 'tampered'
          ? "System clock rollback detected! Please verify your computer's date and time, or enter your offline activation key."
          : 'Your 3-day evaluation trial for ShopEase POS has expired. Please activate your license to continue.';

      return res.status(403).json({
        success: false,
        licenseBlocked: true,
        licenseStatus: status.status,
        machineId: status.machineId,
        daysRemaining: status.daysRemaining,
        message,
      });
    }

    req.licenseStatus = status;
    next();
  } catch (error) {
    // If license check throws unexpected error, log and fail safely or proceed with caution
    console.error('License guard check error:', error.message);
    next();
  }
}

module.exports = licenseGuard;
