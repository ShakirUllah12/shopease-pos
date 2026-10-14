const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

// Publicly accessible endpoints for license status and offline activation
router.get('/status', licenseController.getStatus);
router.get('/machine-id', licenseController.getMachineId);
router.post('/activate', licenseController.activate);

module.exports = router;
