const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

/**
 * Protect route middleware: ensures a valid JWT is present and user is active
 */
async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopease_pos_super_secret_jwt_key_2026_secure'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the owner.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please sign in again.',
      });
    }
    next(error);
  }
}

/**
 * Authorize role middleware: restricts access to specified roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s).`,
      });
    }

    next();
  };
}

// Shortcut guards
const requireOwner = [authenticate, authorize(ROLES.OWNER)];
const requireStaff = [authenticate, authorize(ROLES.OWNER, ROLES.CASHIER)];

module.exports = {
  authenticate,
  authorize,
  requireOwner,
  requireStaff,
};
