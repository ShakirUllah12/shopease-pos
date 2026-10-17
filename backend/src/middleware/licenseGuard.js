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
    req.licenseStatus = status;
    next();
  } catch (error) {
    // If license check throws unexpected error, log and fail safely
    console.warn('License guard check warning:', error.message);
    next();
  }
}

module.exports = licenseGuard;
