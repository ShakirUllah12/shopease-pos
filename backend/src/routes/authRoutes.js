const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireOwner } = require('../middleware/auth');

// Public endpoints
router.get('/setup-status', authController.checkSetupStatus);
router.post('/setup-initial-owner', authController.setupInitialOwner);
router.post('/login', authController.login);

// Protected endpoints (Staff: Owner and Cashier)
router.get('/me', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, authController.changePassword);

// Owner-only endpoints
router.get('/users', requireOwner, authController.listUsers);
router.post('/users', requireOwner, authController.createUser);
router.put('/users/:id', requireOwner, authController.updateUser);

module.exports = router;
