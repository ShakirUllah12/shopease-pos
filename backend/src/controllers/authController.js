const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

function generateToken(user, sessionId = null) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      sessionId: sessionId || user.activeSessionId,
    },
    process.env.JWT_SECRET || 'shopease_pos_super_secret_jwt_key_2026_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

/**
 * Check if the system has at least one owner configured.
 */
async function checkSetupStatus(req, res, next) {
  try {
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      isInitialized: userCount > 0,
      userCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initial safe owner creation wizard: works only when NO users exist in the database.
 */
async function setupInitialOwner(req, res, next) {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'System is already initialized. Please sign in or ask the owner to create an account.',
      });
    }

    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, Full Name, and Password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const owner = await User.create({
      name: (fullName || username).trim(),
      fullName: (fullName || username).trim(),
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: ROLES.OWNER,
      isActive: true,
      isLoggedIn: true,
      activeSessionId: crypto.randomUUID(),
      lastActiveAt: new Date(),
    });

    const token = generateToken(owner, owner.activeSessionId);

    res.status(201).json({
      success: true,
      message: 'Owner account successfully created!',
      token,
      user: owner,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * User Login with Single Active Session Protection
 */
async function login(req, res, next) {
  try {
    const { username, password, forceLogoutOthers } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the owner.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Rotate session: Generate a fresh active session ID so only 1 session per user is active at a time

    const sessionId = crypto.randomUUID();
    user.isLoggedIn = true;
    user.activeSessionId = sessionId;
    user.lastActiveAt = new Date();
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user, sessionId);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sign out current authenticated user and clear active session
 */
async function logout(req, res, next) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isLoggedIn: false,
        activeSessionId: null,
      });
    }
    res.json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user
 */
async function getProfile(req, res) {
  if (req.user) {
    // Keep session active timestamp fresh
    User.findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {});
  }
  res.json({
    success: true,
    user: req.user,
  });
}

/**
 * Change current user password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Owner only: create a new staff account (Cashier or Owner)
 */
async function createUser(req, res, next) {
  try {
    const { username, fullName, email, password, role } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, Full Name, and Password are required.',
      });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this username already exists.',
      });
    }

    const validRole = role && Object.values(ROLES).includes(role) ? role : ROLES.CASHIER;
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: validRole,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `${validRole === ROLES.OWNER ? 'Owner' : 'Cashier'} account created successfully.`,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Owner only: list all staff accounts
 */
async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Owner only: update staff account status or role
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, email, role, isActive, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    if (fullName) user.fullName = fullName.trim();
    if (email !== undefined) user.email = email.trim();
    if (role && Object.values(ROLES).includes(role)) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password && password.length >= 6) {
      user.passwordHash = await User.hashPassword(password);
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkSetupStatus,
  setupInitialOwner,
  login,
  logout,
  getProfile,
  changePassword,
  createUser,
  listUsers,
  updateUser,
};
